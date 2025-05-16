// arena.js — Arena (PvP Mock ระบบอารีน่า)

// =====================
// 1. Arena Rival Teams
// =====================
window.arenaRivals = [
  {
    name: "ริวโซ (ทีมสายฟ้า)",
    team: [
      { name: "นักเวทสายฟ้า", maxHp: 130, atk: 85, element: "สายฟ้า", skills: [{ name: "ช็อตสายฟ้า", type: "damage", power: 1.1, effect: { stun: 1 }, desc: "โจมตี + stun" }] },
      { name: "คางคกสายฟ้า", maxHp: 220, atk: 55, element: "สายฟ้า", skills: [{ name: "ฟ้าผ่ารุนแรง", type: "damage", power: 1.19, effect: {}, desc: "โจมตีแรง" }] },
      { name: "หมีอ้วนไว", maxHp: 180, atk: 61, element: "สายฟ้า", skills: [{ name: "กระแทก", type: "damage", power: 1.05, effect: {}, desc: "โจมตีธรรมดา" }] },
      { name: "งูแสงฟาด", maxHp: 155, atk: 74, element: "สายฟ้า", skills: [{ name: "ฟาดสายฟ้า", type: "damage", power: 1.11, effect: {}, desc: "โจมตีธรรมดา" }] }
    ]
  },
  {
    name: "คาเรน (ทีมธาตุน้ำ)",
    team: [
      { name: "นักธนูน้ำ", maxHp: 150, atk: 70, element: "น้ำ", skills: [{ name: "ยิงทะลวง", type: "damage", power: 1.0, effect: { defenseDown: 2 }, desc: "โจมตีและลด def" }] },
      { name: "ปลาปีศาจ", maxHp: 178, atk: 61, element: "น้ำ", skills: [{ name: "กระแทกน้ำ", type: "damage", power: 1.2, effect: {}, desc: "โจมตี" }] },
      { name: "งูน้ำ", maxHp: 174, atk: 65, element: "น้ำ", skills: [{ name: "บีบคอ", type: "damage", power: 1.09, effect: {}, desc: "โจมตี" }] },
      { name: "ฮีลเลอร์แสง", maxHp: 170, atk: 40, element: "แสง", skills: [{ name: "ฟื้นฟูพลังชีวิต", type: "heal-over-time-1", power: 1.1, effect: { healOverTimeSingle: 2 }, desc: "ฮิลทีละ 1 ตัว/เทิร์น (2 เทิร์น)" }] }
    ]
  },
  {
    name: "โซล & ดาร์ค (มืด/ผสม)",
    team: [
      { name: "สาวดาบมืด", maxHp: 160, atk: 60, element: "มืด", skills: [{ name: "วายุดำ", type: "damage", power: 1.2, effect: { atkDown: 2 }, desc: "โจมตี ลด atk เป้าหมาย 2 เทิร์น" }] },
      { name: "นักเวทปีศาจ", maxHp: 120, atk: 89, element: "มืด", skills: [{ name: "เงามืดดูดพลัง", type: "damage", power: 1.2, effect: { atkDown: 1, burn: 1 }, desc: "โจมตีและดูด atk+burn" }] },
      { name: "ผีดิบ", maxHp: 154, atk: 50, element: "มืด", skills: [{ name: "กัดพิษ", type: "damage", power: 1.07, effect: {}, desc: "โจมตีธรรมดา" }] },
      { name: "นักเวทสายฟ้า", maxHp: 130, atk: 85, element: "สายฟ้า", skills: [{ name: "ช็อตสายฟ้า", type: "damage", power: 1.1, effect: { stun: 1 }, desc: "โจมตี + stun 1 เทิร์น" }] }
    ]
  }
];

// =====================
// 2. Arena State Reset
// =====================
window._arenaBattleActive = false;

// =====================
// 3. Arena Main Menu UI
// =====================
window.renderArenaMenu = function () {
  window._arenaBattleActive = false;
  document.getElementById("arenaPanel")?.remove();

  const panel = document.createElement("div");
  panel.id = "arenaPanel";
  panel.style.position = "fixed";
  panel.style.right = "40px";
  panel.style.bottom = "60px";
  panel.style.background = "#242428";
  panel.style.color = "#fff";
  panel.style.padding = "18px";
  panel.style.borderRadius = "14px";
  panel.style.zIndex = 700;
  panel.innerHTML = `<h3>🌟 Arena - PvP Mock</h3>
    <div><b>เลือกคู่ต่อสู้:</b></div>`;

  window.arenaRivals.forEach((r, idx) => {
    const b = document.createElement("button");
    b.textContent = r.name;
    b.onclick = () => window.renderArenaRival(idx);
    panel.appendChild(b);
  });

  // random
  let randBtn = document.createElement("button");
  randBtn.textContent = "สุ่มศัตรู";
  randBtn.onclick = () => window.randomArenaRival();
  panel.appendChild(randBtn);

  // Show player team stats
  panel.innerHTML += `<div style="margin:15px 0 0 0;"><b>ทีมของคุณ:</b></div>`;
  (window.playerTeam || []).forEach((idx, i) => {
    let c = window.characters[idx];
    if (!c) return;
    let stat = window.getTotalStat ? window.getTotalStat(c) : c;
    panel.innerHTML += `<div style="margin-top:2px;">${c.name} [HP:${stat.maxHp} ATK:${stat.atk}${stat.spd ? ` SPD:${stat.spd}` : ""} E:${stat.element}]</div>`;
  });

  const btnClose = document.createElement("button");
  btnClose.textContent = "ปิด";
  btnClose.onclick = () => panel.remove();
  btnClose.style.marginTop = "12px";
  panel.appendChild(btnClose);

  document.body.appendChild(panel);
};

// ============================
// 4. Arena: เลือก/สุ่ม คู่ต่อสู้
// ============================
window.renderArenaRival = function (rIdx) {
  let rival = window.arenaRivals[rIdx];
  if (!rival) return;
  let teamClone = rival.team.map(c => JSON.parse(JSON.stringify(c)));
  window.enemyTeam = teamClone;
  alert(`คุณเลือกแข่งกับ ${rival.name}`);
  window.startArenaBattle();
  document.getElementById('arenaPanel')?.remove();
};

window.randomArenaRival = function () {
  let idx = Math.floor(Math.random() * window.arenaRivals.length);
  window.renderArenaRival(idx);
};

// =====================
// 5. Start Arena PvP
// =====================
window.startArenaBattle = function () {
  window._arenaBattleActive = true;
  window._arenaBattleMonitor && clearInterval(window._arenaBattleMonitor);
  if (window.gamedom && window.gamedom.log) window.gamedom.log.innerHTML = '';
  window.startBattle && window.startBattle();

  // ตรวจสอบผล PvP
  window._arenaBattleMonitor = setInterval(() => {
    let logTxt = window.gamedom?.log?.innerHTML;
    if (!window._arenaBattleActive) return clearInterval(window._arenaBattleMonitor);
    if (logTxt && (logTxt.includes("คุณชนะ!") || logTxt.includes("คุณแพ้!") || logTxt.includes("เสมอ!"))) {
      window._arenaBattleActive = false;
      clearInterval(window._arenaBattleMonitor);
      let msg = logTxt.includes("คุณชนะ!") ? "🏆 ชนะ Arena!" :
        logTxt.includes("คุณแพ้!") ? "แพ้ Arena! ลองใหม่" : "เสมอ!";
      setTimeout(() => alert(msg), 400);
      // กำหนด event หรือ award point ในอนาคตที่นี่
      // เช่น window.arenaWinCount++
    }
  }, 600);
};

// =====================
// END arena.js
// =====================