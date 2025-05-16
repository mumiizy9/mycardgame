// gacha-upgrade.js
// ระบบสุ่ม (Gacha), อัปเกรด, Upgrade Point, ปุ่ม UI ที่เกี่ยวข้อง
// ใช้งานกับ main.js, char-skill.js แล้วต่อกับ battle-system.js ได้เลย
// ---------------------------------------------------

// (1) Gacha Pool: ระบุ pool ตัวละครที่สามารถสุ่ม
window.gachaPool = [
  { name: "อัศวินไฟ",   maxHp: 200, atk: 55, element: "ไฟ",   skills: [{ name: "ฟาดดาบรุนแรง", type: "damage", power: 1.2, effect: { burn: 2 },  desc: "โจมตีแรง มีโอกาสติด burn" }] },
  { name: "นักธนูน้ำ",  maxHp: 150, atk: 70, element: "น้ำ",  skills: [{ name: "ยิงทะลวง", type: "damage", power: 1.0, effect: { defenseDown: 2 }, desc: "โจมตีและลด def"  }] },
  { name: "ฮีลเลอร์แสง", maxHp: 170, atk: 40, element: "แสง", skills: [{ name: "ฟื้นฟูพลังชีวิต", type: "heal-over-time-1", power: 1.1, effect: { healOverTimeSingle: 2 }, desc: "ฮิลทีละ 1 ตัว/เทิร์น" }] },
  { name: "นักเวทสายฟ้า", maxHp: 130, atk: 85, element: "สายฟ้า", skills: [{ name: "ช็อตสายฟ้า", type: "damage", power: 1.1, effect: { stun: 1 }, desc: "โจมตี + stun" }] },
  { name: "แทงค์ไม้",   maxHp: 220, atk: 35, element: "ไม้",  skills: [{ name: "ฟาดไม้หนัก", type: "damage", power: 1.3, effect: { atkDown: 1 }, desc: "โจมตี ลด atk ศัตรู" }] },
  { name: "สาวดาบมืด", maxHp: 160, atk: 60, element: "มืด",  skills: [{ name: "วายุดำ", type: "damage", power: 1.2, effect: { atkDown: 2 }, desc: "โจมตี ลด atk เป้าหมาย 2 เทิร์น" }] },
  // ตัวละครพิเศษ
  { name: "นักรบมังกร", maxHp: 210, atk: 76, element: "ไฟ", skills: [{ name: "โจมตีมังกร", type: "damage", power: 1.3, effect: { burn: 2 }, desc: "โจมตีแรงและติด burn" }] },
  { name: "ราชินีน้ำแข็ง", maxHp: 164, atk: 76, element: "น้ำ", skills: [{ name: "คำสาปน้ำแข็ง", type: "damage", power: 1.15, effect: { stun: 1 }, desc: "มีโอกาสทำให้เป้าหมายติด stun" }] },
  { name: "นักเวทปีศาจ", maxHp: 120, atk: 89, element: "มืด", skills: [{ name: "เงามืดดูดพลัง", type: "damage", power: 1.2, effect: { atkDown: 1, burn: 1 }, desc: "โจมตีและดูด atk+burn" }] }
];

// (2) ฟังก์ชันเปิด Gacha: สุ่ม 1 ตัว ไม่ซ้ำ, push เข้า window.characters
window.openGacha = function() {
  const idx = Math.floor(Math.random() * window.gachaPool.length);
  // copy
  const newChar = JSON.parse(JSON.stringify(window.gachaPool[idx]));
  // ป้องกันซ้ำ
  if (window.characters.some(c => c.name === newChar.name)) {
    alert(`คุณได้ตัวละครซ้ำ: ${newChar.name} (ไม่ได้เพิ่มเข้าทีม)`);
    return;
  }
  window.characters.push(newChar);
  alert(`ยินดีด้วย! คุณได้รับตัวละครใหม่: ${newChar.name}`);
  window.renderCharacterSelect && window.renderCharacterSelect();
};
// (2.1) Gacha Button (add ถ้ายังไม่มี)
(function addGachaButton() {
  if (document.getElementById("gachaBtn")) return;
  const gachaBtn = document.createElement("button");
  gachaBtn.id = "gachaBtn";
  gachaBtn.textContent = "เปิดกล่องสุ่มตัวละคร";
  gachaBtn.onclick = window.openGacha;
  gachaBtn.style.marginRight = "10px";
  document.querySelector('.game-container').appendChild(gachaBtn);
})();

// (3) POINT & UPGRADE SYSTEM ----
window.points = window.points ?? 20;
// เพิ่มแต้ม
window.addPoints = function(amount) {
  window.points += amount;
  alert(`คุณได้รับแต้ม: ${amount} แต้ม\nคะแนนคงเหลือ: ${window.points}`);
};
// อัปเกรดตัวละคร: ใช้ point, อัป stat
window.upgradeCharacter = function (characterIdx) {
  const char = window.characters[characterIdx];
  // ถ้าตัวละครมีเลเวลให้ใช้แต้มเยอะขึ้น, ไม่มี level ใช้ 10
  const usePoint = char.level && char.level > 10 ? 18 : 10;
  if (window.points < usePoint) {
    alert(`แต้มคงเหลือไม่พอ (ต้องใช้ ${usePoint} แต้ม/อัปเกรด)`);
    return;
  }
  char.maxHp += 20;
  char.atk += 5;
  if (char.level) char.level += 1;
  window.points -= usePoint;
  alert(
    `อัปเกรด ${char.name} แล้ว! HP: ${char.maxHp}, Atk: ${char.atk}\nแต้มคงเหลือ: ${window.points}`
  );
  window.renderPlayerTeam && window.renderPlayerTeam();
  window.renderUpgradeUI && window.renderUpgradeUI();
};
// UI Panel Upgrade (for current team)
window.renderUpgradeUI = function () {
  const el = document.getElementById("upgradeContainer");
  if (!el) return;
  el.innerHTML = `<h3>อัปเกรดตัวละครในทีม (ใช้แต้ม 10~18):</h3>`;
  el.innerHTML += `<div style="margin-bottom:6px;">แต้มคงเหลือ: <span id="pointsAmount" style="color:#43f445;font-weight:bold;">${window.points}</span></div>`;
  window.playerTeam.forEach(idx => {
    const char = window.characters[idx];
    const usePoint = char.level && char.level > 10 ? 18 : 10;
    const upgradeDiv = document.createElement('div');
    upgradeDiv.className = 'upgrade-card';
    upgradeDiv.style.display = 'flex';
    upgradeDiv.style.alignItems = 'center';
    upgradeDiv.style.gap = '10px';
    upgradeDiv.style.marginBottom = "4px";
    upgradeDiv.style.background = "#1e2331";
    upgradeDiv.style.padding = "5px 11px";
    upgradeDiv.style.borderRadius = "8px";
    upgradeDiv.innerHTML = `
      <span style="display:inline-block;min-width:120px;"><strong>${char.name}</strong> | HP: ${char.maxHp} | Atk: ${char.atk} (ใช้${usePoint}คะแนน)</span>
    `;
    const btn = document.createElement("button");
    btn.textContent = 'อัปเกรด';
    btn.onclick = () => window.upgradeCharacter(idx);
    upgradeDiv.appendChild(btn);
    el.appendChild(upgradeDiv);
  });
};
// (3.1) Upgrade Button
(function addUpgradeButton() {
  if (document.getElementById("upgradeBtn")) return;
  const btn = document.createElement("button");
  btn.id = "upgradeBtn";
  btn.textContent = "เปิดหน้าต่างอัปเกรดตัวละคร";
  btn.onclick = window.renderUpgradeUI;
  document.querySelector('.game-container').appendChild(btn);
})();

// (4) Optional: Panel สรุปแต้มอัปเกรด (Upgrade Point Log) — call จากพาร์ทอื่นได้ถ้าต้องการ
window.upgradePointLog = window.upgradePointLog || [];
window.renderUpgradePointUI = function() {
  document.querySelectorAll("#upgradePointPanel").forEach(e => e.remove());
  const box = document.createElement("div");
  box.id = "upgradePointPanel";
  box.style.position = "fixed";
  box.style.top = "40px";
  box.style.right = "15px";
  box.style.background = "#353d43";
  box.style.color = "#fff";
  box.style.padding = "13px 20px";
  box.style.borderRadius = "12px";
  box.style.fontSize = "1em";
  box.style.boxShadow = "0 2px 10px #0008";
  box.innerHTML = `<b>แต้มอัปเกรด (Upgrade Point): <span style='color:#ffd130' id='pt-val'>${window.points}</span></b><br>`;
  if(window.upgradePointLog && window.upgradePointLog.length){
    box.innerHTML += "<u>แต้มล่าสุด:</u><ul style='margin:3px 0 0 17px;padding:0'>";
    window.upgradePointLog.slice(0,5).forEach(txt=>{
      box.innerHTML += `<li>${txt}</li>`;
    });
    box.innerHTML += "</ul>";
  }
  const btnClose = document.createElement("button");
  btnClose.textContent = "ปิด";
  btnClose.onclick = ()=>box.remove();
  btnClose.style.marginTop = "7px";
  box.appendChild(btnClose);
  document.body.appendChild(box);
};
// (4.1) ปุ่มเมนูเปิด panel สรุปแต้มอัปเกรด
(function addUpgradePointMenuButton() {
  if(document.getElementById("upgradePointBtn")) return;
  const btn = document.createElement("button");
  btn.id = "upgradePointBtn";
  btn.textContent = "ดูแต้มอัปเกรด";
  btn.onclick = window.renderUpgradePointUI;
  document.querySelector('.game-container').appendChild(btn);
})();

// === END gacha-upgrade.js ===