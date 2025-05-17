// js/rune.js

let runeData = [];
let runeSetBonuses = {};
let userRunes = [];    // ทุกรูนของ user (id, unlock, slot)
let equippedRunes = {}; // { char_id: [slot1, slot2, slot3, slot4] }
let currentCharEquip = null;

// โหลดข้อมูลรูนจาก data/rune.json
async function loadRuneData() {
  if (runeData.length) return;
  let arr = await fetch('data/rune.json').then(r => r.json());
  runeData = arr.filter(x => !x.set_bonuses);
  runeSetBonuses = arr.find(x => x.set_bonuses)?.set_bonuses || {};
}

// โหลดรูนของ user (จาก localStorage)
function loadUserRunes() {
  userRunes = JSON.parse(localStorage.getItem('user_runes') || "[]");
  equippedRunes = JSON.parse(localStorage.getItem('equipped_runes') || "{}");
}

// เซฟรูนกลับ localStorage
function saveUserRunes() {
  localStorage.setItem('user_runes', JSON.stringify(userRunes));
  localStorage.setItem('equipped_runes', JSON.stringify(equippedRunes));
}

// UI - render pop-up สวมใส่รูน
async function openRuneEquipPopup(char_id) {
  await loadRuneData(); loadUserRunes();
  currentCharEquip = char_id;
  let charRunes = equippedRunes[char_id] || [null, null, null, null];
  let runeSlotHtml = '';
  for (let slot = 1; slot <= 4; slot++) {
    let runeId = charRunes[slot - 1];
    let ru = runeData.find(r => r.id === runeId);
    runeSlotHtml += `<div style="border:1px solid #348ac9;border-radius:10px;padding:8px 7px;min-width:96px;min-height:65px;margin:3px 0;">
      <b>ช่อง ${slot}:</b> ${ru ?
        `<span title="${ru.name}" style="font-size:1.2em;vertical-align:middle;">${ru.icon ?? '🔸'}</span> 
        <span style="color:#7df;font-weight:600;">${ru.name}</span>
        <button class="secondary-btn" style="font-size:.96em;padding:.1em .8em;margin-left:4px;" onclick="unequipRune(${slot})">ถอน</button>
        <div style="font-size:0.88em;color:#acfc94;margin-top:4px;">${mainStatText(ru.main_stat)} ${ru.sub_stats.map(mainStatText).join(', ')}</div>`
        : `<span style="color:#888;">ว่าง</span>
          <button class="primary-btn" style="font-size:.9em;" onclick="showSelectRune(${slot})">+ เพิ่มรูน</button>`
      }
      </div>`;
  }
  const setBuffHtml = renderSetBonus(charRunes);
  const html = `
    <div style="display:flex;flex-direction:column;gap:7px;">
      <h3>รูนของตัวละครนี้</h3>
      ${runeSlotHtml}
      ${setBuffHtml}
      <button class="secondary-btn" onclick="closePopup()">บันทึกและปิด</button>
    </div>`;
  window.openPopup('runeEquip', html, 'large', 'สวมใส่รูน');
}

// Render set buff รวม (ถ้าเซ็ตครบ)
function renderSetBonus(runeIdArr) {
  let sets = {}, slots = {};
  runeIdArr.forEach(id => {
    let r = runeData.find(a => a.id === id);
    if (r) {
      sets[r.set] = (sets[r.set] || 0) + 1;
      slots[r.slot] = 1;
    }
  });
  let buffHtml = '';
  Object.keys(sets).forEach(set => {
    const cfg = runeSetBonuses[set];
    if (cfg && sets[set] >= cfg.slot_required) {
      buffHtml += `<div style="background:#22442b;margin:13px 0;padding:7px 9px;border-radius:7px;">
          <span style="font-size:1.16em;">${cfg.desc}</span> <b style="color:#66e0ca;">(ครบเซ็ต!)</b>
        </div>`;
    }
  });
  return buffHtml ? `<div style="margin-top:14px;">${buffHtml}</div>` : '';
}

// เลือกรูน
window.showSelectRune = function(slot) {
  let avai = userRunes.filter(r =>
    !Object.values(equippedRunes).flat().includes(r.rune_id) && runeData.find(x => x.id === r.rune_id)?.slot === slot);
  let html = avai.length
      ? avai.map(r => {
          let d = runeData.find(x => x.id === r.rune_id);
          return `<div style="display:flex;align-items:center;gap:9px;">
            <span style="font-size:1.3em;">${d.icon ?? '🔸'}</span>
            <b>${d.name}</b> <span style="font-size:0.93em;color:#d2ffee;">${mainStatText(d.main_stat)}</span>
            <button class="primary-btn" onclick="equipRuneSlot('${r.rune_id}',${slot})">ใส่</button>
          </div>`;
        }).join('<hr style="margin:2px 0;">')
      : `<div style="color:#fda;">ยังไม่มีรูนสำหรับช่องนี้</div>`;
  window.openPopup('selectRune', html, 'small', `เลือกรูน ช่อง ${slot}`);
};

// ข้อความหลักของ stat
function mainStatText(stat) {
  if (!stat) return "";
  const lib = { spd: 'SPD', atk_pct: 'ATK%', def: 'DEF', def_pct: 'DEF%', crit_pct: 'CRIT%', effectiveness: 'EFF' };
  return (lib[stat.type] || stat.type) + " +" + stat.val;
}

// ใส่รูนลง slot
window.equipRuneSlot = function(rune_id, slot) {
  let charRunes = equippedRunes[currentCharEquip] || [null,null,null,null];
  charRunes[slot - 1] = rune_id;
  equippedRunes[currentCharEquip] = charRunes;
  saveUserRunes();
  closePopup('selectRune');
  openRuneEquipPopup(currentCharEquip);
};

// ถอนรูน
window.unequipRune = function(slot) {
  let charRunes = equippedRunes[currentCharEquip] || [null,null,null,null];
  charRunes[slot - 1] = null;
  equippedRunes[currentCharEquip] = charRunes;
  saveUserRunes();
  openRuneEquipPopup(currentCharEquip);
};

// อัปเกรดรูน (mock)
window.upgradeRune = function(rune_id) {
  alert("= Demo = คุณอัปเลเวลรูน " + rune_id + " แล้ว (mock)");
};

window.runeEngine = {
  openEquipPopup: openRuneEquipPopup,
  getEquipped: function(char_id) { loadUserRunes(); return equippedRunes[char_id] || [null,null,null,null]; },
  getUserRunes: function() { loadUserRunes(); return userRunes; },
  addRune: function(rune_id) { userRunes.push({ rune_id }); saveUserRunes(); },
  removeRune: function(rune_id) { userRunes = userRunes.filter(r => r.rune_id !== rune_id); saveUserRunes(); }
};

// Hook DOM ในคลังตัวละคร (คลิกปุ่ม "ใส่รูน" ได้)
document.addEventListener('DOMContentLoaded', async () => {
  await loadRuneData(); loadUserRunes();
  if (document.getElementById('characterArea')) {
    document.getElementById('characterArea').addEventListener('click', e => {
      const btn = e.target.closest('[data-equiprune]');
      if (btn) openRuneEquipPopup(btn.getAttribute('data-equiprune'));
    });
  }
});