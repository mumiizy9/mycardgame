// quest-system.js
// -- ระบบเควสต์ภารกิจและมิชชั่นประจำวัน RPG idle (Main, Daily, Reward)

window.questList = [
  // Quest type: "main"/"side"/"daily"
  {
    id: "clear1-1", 
    type: "main",
    desc: "เคลียร์ด่าน ป่าเขียวชอุ่ม-1 (World 1-1)",
    check: () => (window.stageClearLog && window.stageClearLog["1-1"]), 
    reward: { gold: 150, exp: 25, item: "gacha_ticket" },
    claimed: false
  },
  {
    id: "get5equip", 
    type: "side",
    desc: "สะสมอุปกรณ์ครบ 5 ชิ้น",
    check: () => (window.inventory && window.inventory.equips && window.inventory.equips.length >= 5),
    reward: { gold: 250, exp: 35 },
    claimed: false
  },
  {
    id: "winArena1", 
    type: "main",
    desc: "ชนะ Arena 1 ครั้ง",
    check: () => (window.arenaWinCount && window.arenaWinCount >= 1),
    reward: { gold: 200, exp: 40, item: "arena_badge" },
    claimed: false
  },
  {
    id: "adventure10", 
    type: "daily",
    desc: "เข้าสู่โหมด ผจญภัย 10 ครั้ง (รีใหม่ทุกวัน)",
    check: () => (window.dailyStat && window.dailyStat.adventure >= 10),
    reward: { gold: 100, exp: 10 },
    claimed: false,
    resetDaily: true
  }
  // เพิ่ม quest อื่น ๆ ได้ตามต้องการ
];

// 1. ฟังก์ชันตรวจสอบเคลียร์
window.isQuestCompleted = function (q) {
  return typeof q.check === "function" ? q.check() : false;
};

// 2. ฟังก์ชันรับรางวัล
window.claimQuestReward = function (idx) {
  let q = window.questList[idx];
  if (!q || q.claimed || !window.isQuestCompleted(q)) return alert("ยังไม่ผ่านเงื่อนไขเควสต์นี้!");
  q.claimed = true;
  let r = q.reward || {};
  if (r.gold) window.inventory.gold = (window.inventory.gold || 0) + r.gold;
  if (r.exp) window.inventory.exp = (window.inventory.exp || 0) + r.exp;
  if (r.item) window.inventory.items[r.item] = (window.inventory.items[r.item] || 0) + 1;
  alert(`รับรางวัล: ${r.gold ? "💰" + r.gold + " Gold " : ""}${r.exp ? "⭐" + r.exp + " EXP " : ""}${r.item ? "🎫" + r.item : ""}`);
  window.renderQuestPanel();
};

// 3. แสดงเควสต์ (UI panel)  
window.renderQuestPanel = function () {
  document.getElementById("questPanel")?.remove();
  let panel = document.createElement("div");
  panel.id = "questPanel";
  panel.style.position = "fixed";
  panel.style.left = "35px";
  panel.style.top = "70px";
  panel.style.background = "#183a2f";
  panel.style.color = "#fff";
  panel.style.padding = "16px";
  panel.style.borderRadius = "13px";
  panel.style.zIndex = 700;
  panel.innerHTML = `<h3>📋 เควสต์ & มิชชั่น</h3>`;
  ["main", "side", "daily"].forEach(tp => {
    let list = window.questList.filter(q => q.type === tp);
    if (list.length === 0) return;
    panel.innerHTML += `<div><b>${tp === "main" ? "Main Quest" : tp === "side" ? "Side Quest" : "Daily Quest"}</b></div>`;
    list.forEach((q, idx) => {
      let done = window.isQuestCompleted(q);
      let claimed = q.claimed;
      panel.innerHTML += `<div style="margin-bottom:3px;${claimed ? 'opacity:.5;text-decoration:line-through;' : ''}">
        ${done ? "✅" : "⬜"} ${q.desc} 
        ${done && !claimed ? `<button onclick="window.claimQuestReward(${window.questList.indexOf(q)})">รับรางวัล</button>` : ""}
        ${claimed ? `<span style="color:#efe;">(รับแล้ว)</span>` : ""}
      </div>`;
    });
  });
  let btn = document.createElement("button");
  btn.textContent = "ปิด";
  btn.style.marginTop = "15px";
  btn.onclick = () => panel.remove();
  panel.appendChild(btn);
  document.body.appendChild(panel);
};

// 4. ระบบ Daily Quest Reset (รีเซ็ตทุกวัน)
window.resetDailyQuests = function () {
  window.questList.forEach(q => { if (q.resetDaily) q.claimed = false; });
  // reset ค่าที่ใช้นับ เช่น
  if (window.dailyStat) window.dailyStat.adventure = 0;
};

// [ตัวอย่าง auto reset เมื่อข้ามวัน]
window._questSystem_lastDay = window._questSystem_lastDay || (new Date()).getDate();
setInterval(() => {
  let d = (new Date()).getDate();
  if (d !== window._questSystem_lastDay) {
    window.resetDailyQuests();
    window._questSystem_lastDay = d;
  }
}, 60 * 1000); // check ทุก 1 นาที

// 5. เพิ่มปุ่มในเมนูหลัก
(function () {
  if (document.getElementById("questMenuBtn")) return;
  const btn = document.createElement("button");
  btn.id = "questMenuBtn";
  btn.textContent = "Quest";
  btn.onclick = window.renderQuestPanel;
  document.querySelector('.game-container').appendChild(btn);
})();

// === END quest-system.js === //