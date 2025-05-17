// js/upgrade.js - Epic Seven Auto Battle - Upgrade System

let upgradeConfig = {};
let charUpgradeTarget = null;
let inventory = []; // preload via inventory.js

/** โหลดข้อมูล config อัปเกรดจาก /data/upgrade.json */
async function loadUpgradeConfig() {
  if (Object.keys(upgradeConfig).length) return;
  upgradeConfig = await fetch('data/upgrade.json').then(r => r.json());
}

/** Render ป๊อปอัปอัปเกรดตัวละคร โชว์ stat + ปุ่มอัปเลเวล/อัปสกิล/เลื่อนขั้น */
async function openUpgradePopup(characterId) {
  await loadUpgradeConfig();
  await window.inventoryEngine.reloadAll();
  let char = JSON.parse(localStorage.getItem('char_' + characterId)
               || localStorage.getItem('char_' + characterId.replace('_', ''))
               || '{}');
  if (!char || !char.id) {
    alert("ไม่พบตัวละครนี้");
    return;
  }
  charUpgradeTarget = char; // export สำหรับ event ภายนอก

  // Render main popup
  let html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
      <img src="img/char/${char.img}" style="width:72px;border-radius:15px;box-shadow:0 0 22px #1defeb66;">
      <div style="font-size:1.18em;font-weight:bold;">${char.name}</div>
      <div>Lv. <b>${char.level}</b> <span style="color:#ffe480;">★${char.star}</span>
          / <b>EXP</b> ${char.exp}/${char.exp_max || '?'}
      </div>
      <div style="color:#87c7ff;">HP <b>${char.hp}</b> | ATK <b>${char.atk}</b> | DEF <b>${char.def}</b> | SPD <b>${char.spd}</b></div>
      <hr style="width:88%; border:1px solid #234">
      <div style="display:flex;gap:12px;">
        <button class="primary-btn" onclick="doLevelUpChar('${char.id}')">เพิ่มเลเวล</button>
        <button class="primary-btn" onclick="doSkillUpChar('${char.id}')">อัปเกรดสกิล</button>
        <button class="primary-btn" onclick="doPromoteChar('${char.id}')">เลื่อนขั้น/เพิ่มดาว</button>
      </div>
      <button class="secondary-btn" onclick="closePopup()">ปิด</button>
    </div>
  `;
  window.openPopup('upgradePopup', html, 'large', 'อัปเกรดตัวละคร');
}

/** อัปเลเวล (ใช้ exp_potion ได้ก่อน, หรือจำลองได้) */
window.doLevelUpChar = function (charId) {
  let char = JSON.parse(localStorage.getItem('char_' + charId));
  if (!char) return;
  let expItem = upgradeConfig.levelup.exp_item;
  let inv = window.inventoryEngine.list();
  let owned = inv.find(i => i.id === expItem);
  if (!owned || owned.qty <= 0) {
    alert("ไม่มี EXP Potion ในคลัง");
    return;
  }
  // EXP เพิ่ม
  let expAdd = 500;
  char.exp = (char.exp || 0) + expAdd;
  let lvled = false;
  while (char.exp >= (char.exp_max || 99999)) {
    char.exp -= char.exp_max;
    char.level = (char.level || 1) + 1;
    lvled = true;
  }
  if (lvled) alert("Level UP!");
  // เพิ่ม status ทุกเลเวล (สูตร basic -- สามารถโยง config/curve ต่อได้)
  char.hp = Math.round(char.hp * 1.085);
  char.atk = Math.round(char.atk * 1.08);
  char.def = Math.round(char.def * 1.09);
  localStorage.setItem('char_' + char.id, JSON.stringify(char));
  window.inventoryEngine.remove(expItem, 1);
  openUpgradePopup(char.id);
};

/** อัปสกิล (ใช้ skill_book, เพิ่ม multiplier, ลดคูลดาวน์) */
window.doSkillUpChar = function (charId) {
  let char = JSON.parse(localStorage.getItem('char_' + charId));
  if (!char) return;
  let inv = window.inventoryEngine.list();
  let skillBookItem = upgradeConfig.skillup.item;
  let owned = inv.find(i => i.id === skillBookItem);
  if (!owned || owned.qty <= 0) { alert("ไม่มี Skill Book ในคลัง"); return; }
  // Pick skill to up (สุ่ม 1 skill)
  let skills = char.skills || [];
  if (!skills.length) { alert("ไม่มีสกิลให้อัปเกรด"); return; }
  let idx = Math.floor(Math.random() * skills.length);
  let sk = skills[idx];
  // เพิ่ม multiplier และลด cooldown ถ้าได้
  if (sk.multiplier)
    sk.multiplier = +(sk.multiplier + upgradeConfig.skillup.increase_percent/100).toFixed(2);
  if (sk.cooldown && sk.cooldown > 1)
    sk.cooldown = Math.max(1, sk.cooldown - 1);
  char.skills[idx] = sk;
  localStorage.setItem('char_' + char.id, JSON.stringify(char));
  window.inventoryEngine.remove(skillBookItem, 1);
  alert(`อัปเกรด Skill "${sk.name}" ให้แรงขึ้น!`);
  openUpgradePopup(char.id);
};

/** เลื่อนขั้น/Promotion เพิ่มดาว (ใช้ gold+materials) */
window.doPromoteChar = function (charId) {
  let char = JSON.parse(localStorage.getItem('char_' + charId));
  if (!char) return;
  let starNext = (char.star || 1) + 1;
  let prom = upgradeConfig.promotion.requirements.find(r => r.star === char.star);
  if (!prom) { alert("ดาวสูงสุดแล้ว"); return; }
  // เช็คของ
  let inv = window.inventoryEngine.list();
  let gold = inv.find(i => i.id === 'gold');
  if (!gold || gold.qty < prom.cost_gold) {
    alert("Gold ไม่พอ");
    return;
  }
  let enough = prom.materials.every(mat =>
    inv.find(i => i.id === mat.id && i.qty >= mat.qty));
  if (!enough) { alert("วัตถุดิบไม่พอ"); return; }
  // หักของ
  window.inventoryEngine.remove('gold', prom.cost_gold);
  prom.materials.forEach(mat => window.inventoryEngine.remove(mat.id, mat.qty));
  // เพิ่มดาว+อัป stat
  char.star = starNext;
  char.hp = Math.floor(char.hp * 1.20);
  char.atk = Math.floor(char.atk * 1.15);
  char.def = Math.floor(char.def * 1.12);
  localStorage.setItem('char_' + char.id, JSON.stringify(char));
  alert("เลื่อนขั้นสำเร็จ! ดาวใหม่: " + char.star);
  openUpgradePopup(char.id);
};

// เชื่อม event กับ popup
document.addEventListener('DOMContentLoaded', () => {
  // Hook กับ characterCollection
  window.upgradeCharPopup = openUpgradePopup;
  // ถ้ามีการกดปุ่มจากคลังตัวละครให้เชื่อมได้เลย ตัวอย่าง:
  let area = document.getElementById('characterArea');
  if (area) area.addEventListener('click', e => {
    let target = e.target.closest('[data-upgrade]');
    if (target) openUpgradePopup(target.dataset.upgrade);
  });
});

// Expose ให้ระบบอื่นเรียก
window.upgradeEngine = {
  open: openUpgradePopup,
  reloadConfig: loadUpgradeConfig
};