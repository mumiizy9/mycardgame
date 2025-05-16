// equip-system.js
// -- Equipment & Rune System (ติดตั้ง-ถอด-คำนวณ stat รวม)

window.equipList = [
  // ตัวอย่างอุปกรณ์ + ออฟชั่นพื้นฐาน
  { name: "ดาบเหล็ก", slot: "weapon", bonus: { atk: 20 }, rarity: "C", desc: "เพิ่มโจมตี +20" },
  { name: "ไม้เท้าเวทย์", slot: "weapon", bonus: { atk: 12, maxHp: 30 }, rarity: "C", desc: "เพิ่มโจมตี+12 Hp+30" },
  { name: "หอกสายฟ้า", slot: "weapon", bonus: { atk: 28, element: "สายฟ้า" }, rarity: "B", desc: "เพิ่มโจมตี+28 และธาตุสายฟ้า" },
  { name: "โล่เงิน", slot: "offhand", bonus: { maxHp: 40 }, rarity: "C", desc: "เพิ่มเลือด +40" },
  { name: "เกราะหนัง", slot: "armor", bonus: { maxHp: 50 }, rarity: "C", desc: "เพิ่มเลือด +50" },
  { name: "รองเท้าล่องลม", slot: "boot", bonus: { spd: 8 }, rarity: "B", desc: "Spd +8" },
  { name: "รูนไฟ", slot: "rune", bonus: { atk: 6, element: "ไฟ" }, rarity: "A", desc: "Ak+6 Elementไฟ" },
  { name: "รูนแสง", slot: "rune", bonus: { maxHp: 18, element: "แสง" }, rarity: "A", desc: "Hp+18 Elementแสง" },
  // เพิ่มไอเท็มใหม่ๆ ได้เรื่อยๆ
];

// 1. ให้แต่ละตัวละครมีช่องอุปกรณ์ (weapon, offhand, armor, boot, rune)
window.getEquipSlots = function() {
  return ["weapon", "offhand", "armor", "boot", "rune"];
};
window.characters = window.characters ?? [];
window.characters.forEach((c,i)=> {
  c.equipSlots = c.equipSlots ?? [null,null,null,null,null];
});

// 2. Inventory ของผู้เล่น
window.inventory = window.inventory ?? { gold:0, exp:0, items:{}, equips:[] };
// วิธีเพิ่ม (ตัวอย่าง)
// window.inventory.equips.push( window.equipList[0] );

window.addEquipToInventory = function(equip) {
  window.inventory.equips.push(JSON.parse(JSON.stringify(equip))); // clone ใหม่เสมอ
  alert("ได้รับอุปกรณ์ใหม่: "+equip.name);
};

// 3. ฟังก์ชั่นคำนวณ stat รวม เมื่อติดอุปกรณ์
window.getTotalStat = function(charObj) {
  let base = { maxHp: charObj.maxHp, atk: charObj.atk, spd: charObj.spd||0 };
  let element = charObj.element;
  (charObj.equipSlots||[]).forEach((eq, idx) => {
    if (eq && eq.bonus) {
      Object.keys(eq.bonus).forEach(stat=>{
        if(stat==="element") element = eq.bonus[stat];
        else base[stat]=(base[stat]||0)+eq.bonus[stat];
      });
    }
  });
  return { ...base, element };
};

// 4. UI แสดงอุปกรณ์สำหรับเลือก equip/un-equip
window.renderEquipPanel = function(charIdx) {
  document.querySelectorAll("#equipPanel").forEach(e=>e.remove());
  const c = window.characters[charIdx];
  if(!c) return;
  let panel = document.createElement("div");
  panel.id = "equipPanel";
  panel.style.position = "fixed";
  panel.style.top = "60px";
  panel.style.right = "30px";
  panel.style.background = "#212841";
  panel.style.color = "#fff";
  panel.style.padding = "16px";
  panel.style.borderRadius = "13px";
  panel.style.zIndex = 110;
  panel.style.minWidth = "300px";
  panel.innerHTML = `<h3>อุปกรณ์ของ ${c.name}</h3>`;
  let slots = window.getEquipSlots();
  slots.forEach((slot, si) => {
    const eq = c.equipSlots[si];
    panel.innerHTML += `
      <div style="margin-bottom:4px;">
        <b>${slot.toUpperCase()}:</b>
        ${eq ? `<span style="color:#abf435">${eq.name}</span> <button onclick="window.unequipItem(${charIdx},${si})">ถอด</button>` :
        `<span style="color:#ffb050;">-ว่าง-</span>`}
        <button onclick="window.showEquipSelection(${charIdx},${si})">เลือกใส่</button>
      </div>
    `;
  });
  // โชว์ stat รวมหลัง equip
  let stat = window.getTotalStat(c);
  panel.innerHTML += `<div style="margin-top:6px;"><b>Stat รวม:</b> HP:${stat.maxHp} | Atk:${stat.atk}${stat.spd?` | Spd:${stat.spd}`:""} | Element: <b>${stat.element}</b></div>`;
  let btnClose = document.createElement("button");
  btnClose.textContent = "ปิด";
  btnClose.onclick = () => panel.remove();
  btnClose.style.marginTop="17px";
  panel.appendChild(btnClose);
  document.body.appendChild(panel);
};

// 5. แสดงตัวเลือกอุปกรณ์ที่ใส่ได้ในช่องนั้นๆ
window.showEquipSelection = function(charIdx, slotIdx) {
  document.querySelectorAll("#equipSelectPanel").forEach(e=>e.remove());
  const c = window.characters[charIdx];
  if(!c) return;
  let slotName = window.getEquipSlots()[slotIdx];
  let panel = document.createElement("div");
  panel.id = "equipSelectPanel";
  panel.style.position = "fixed";
  panel.style.top = "190px";
  panel.style.right = "90px";
  panel.style.background = "#31395c";
  panel.style.color = "#fff";
  panel.style.padding = "14px";
  panel.style.borderRadius = "9px";
  panel.style.zIndex = 115;
  panel.innerHTML = `<b>เลือกอุปกรณ์ (${slotName})</b><br>`;
  let eqs = window.inventory.equips.filter(eq=>eq.slot===slotName);
  if(eqs.length===0){
    panel.innerHTML += `<div style="color:#ffbaad;">ไม่มีอุปกรณ์ในคลัง</div>`;
  } else {
    eqs.forEach((eq, eid) => {
      let eqStr = `<span style="color:#ffe260">${eq.name}</span> (${eq.desc}) [${eq.rarity}]`;
      let btn = document.createElement("button");
      btn.textContent = "ใส่";
      btn.onclick = () => { window.equipItem(charIdx,slotIdx,eid); panel.remove(); };
      panel.innerHTML += `<div style="margin-bottom:3px;">${eqStr}</div>`;
      panel.appendChild(btn);
    });
  }
  let btnClose = document.createElement("button");
  btnClose.textContent = "ปิด";
  btnClose.onclick = ()=>panel.remove();
  btnClose.style.marginTop="13px";
  panel.appendChild(btnClose);
  document.body.appendChild(panel);
};

// 6. action ใส่/ถอดอุปกรณ์
window.equipItem = function(charIdx,slotIdx,equipInventoryIdx) {
  const c = window.characters[charIdx];
  let eq = window.inventory.equips.splice(equipInventoryIdx,1)[0];
  if(!eq) return alert("เกิดข้อผิดพลาด อุปกรณ์ไม่พบ!");
  // คืนค่าของเดิมเข้า inventory ถ้ามี
  let old = c.equipSlots[slotIdx];
  if(old) window.inventory.equips.push(old);
  c.equipSlots[slotIdx] = eq;
  window.renderEquipPanel(charIdx);
};
window.unequipItem = function(charIdx,slotIdx){
  const c = window.characters[charIdx];
  if(!c) return;
  let old = c.equipSlots[slotIdx];
  if(old) { window.inventory.equips.push(old); c.equipSlots[slotIdx]=null; }
  window.renderEquipPanel(charIdx);
};

// 7. ใส่ปุ่มพาเนลอุปกรณ์ใน UI หลัก (ถ้าเรียก renderPlayerTeam โชว์ปุ่ม “จัดอุปกรณ์” แต่ละตัว)
window.renderPlayerTeam = window.renderPlayerTeam || function() {
  // ตัวอย่างระบบแสดงทีมผู้เล่นและปุ่มจัดอุปกรณ์
  let el = document.getElementById("playerTeamPanel");
  if(!el) {
    el = document.createElement("div");
    el.id = "playerTeamPanel";
    document.querySelector('.game-container').appendChild(el);
  }
  el.innerHTML = "<h3>ทีมของคุณ</h3>";
  (window.playerTeam||[]).forEach((idx,i)=>{
    let c = window.characters[idx];
    el.innerHTML += `<div>
      <b>${c.name}</b> [HP:${c.maxHp}/ATK:${c.atk}] <button onclick="window.renderEquipPanel(${idx})">จัดอุปกรณ์</button>
    </div>`;
  });
};

// === END equip-system.js === //