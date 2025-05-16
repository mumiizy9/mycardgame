// arena.js - ระบบ Arena PvP Mock

let arenaRivals = [];
let myArenaTeam = [];
let arenaBattleLog = [];
let arenaGold = 0;
let arenaStat = {
  wins: 0,
  loses: 0,
  plays: 0
};

async function initArena() {
  // โหลดข้อมูลตัวละครจากไฟล์
  const res = await fetch('./data/characters.json');
  const chars = await res.json();

  // แปลงทีมผู้เล่น (หรือ mock ชุดที่ผู้เล่นเลือก)
  myArenaTeam = window.selectedTeam?.length
    ? window.selectedTeam
    : chars.slice(0, 4);

  // Mock ฝ่าย Rivals (สุ่ม 3 ชุดระดับยาก/ง่าย)
  arenaRivals = [
    {
      name: "🔥Endless Leo",
      team: [chars[1], chars[5], chars[3], chars[2]].map(c => ({
        ...c,
        stats: {
          ...c.stats,
          hp: c.stats.hp + Math.floor(Math.random() * 200),
          atk: c.stats.atk + Math.floor(Math.random() * 60),
          def: c.stats.def + Math.floor(Math.random() * 30)
        }
      })),
      pow: 2250 + Math.floor(Math.random() * 600)
    },
    {
      name: "🌊Mythic Waters",
      team: [chars[0], chars[7], chars[2], chars[4]].map(c => ({
        ...c,
        stats: {
          ...c.stats,
          hp: c.stats.hp + Math.floor(Math.random() * 320),
          atk: c.stats.atk + Math.floor(Math.random() * 80),
          def: c.stats.def + Math.floor(Math.random() * 44)
        }
      })),
      pow: 2700 + Math.floor(Math.random() * 900)
    },
    {
      name: "🏅Light Squad",
      team: [chars[2], chars[6], chars[5], chars[3]].map(c => ({
        ...c,
        stats: {
          ...c.stats,
          hp: c.stats.hp + Math.floor(Math.random() * 250),
          atk: c.stats.atk + Math.floor(Math.random() * 70),
          def: c.stats.def + Math.floor(Math.random() * 50)
        }
      })),
      pow: 1900 + Math.floor(Math.random() * 800)
    }
  ];
  renderArenaUI();
}

// Summary team power
function calcTeamPower(team) {
  return team.reduce(
    (sum, c) =>
      sum +
      c.stats.hp / 9 +
      c.stats.atk * 3.5 +
      c.stats.def * 2.2 +
      c.stats.spd * 8,
    0
  );
}

function renderArenaUI() {
  const root = document.getElementById('arena-root');
  if (!root) return;
  root.innerHTML = `
    <div class="arena-box">
      <h2>🏟️ Arena (PVP) Mock</h2>
      <div>
        <b>ทีมของคุณ (PWR: ${Math.round(calcTeamPower(myArenaTeam))})</b>
        <ul>
          ${myArenaTeam.map(c => `<li>${c.name} (${c.job}/${c.element}) <span style="color:#286fc4">Lv.${c.level} ★${c.rarity}</span></li>`).join("")}
        </ul>
      </div>
      <hr>
      <h3>เลือกคู่ต่อสู้</h3>
      <div class="arena-rival-list">
        ${arenaRivals
          .map(
            (r, i) => `
          <div class="arena-rival-card">
            <b>${r.name}</b> (PWR: ${r.pow})
            <ul style="margin:6px 0">
              ${r.team
                .map(
                  c =>
                    `<li>${c.name} <span style="color:#43b650;font-size:0.9em">Lv.${c.level} ★${c.rarity}</span></li>`
                )
                .join("")}
            </ul>
            <button onclick="startArenaBattle(${i})">ต่อสู้</button>
          </div>
        `
          )
          .join("")}
      </div>
      <hr>
      <div>
        <span>🏆 ชนะ: <b>${arenaStat.wins}</b> | ❌ แพ้: <b>${arenaStat.loses}</b> | เล่น: ${arenaStat.plays} | 🪙 Gold: <b>${arenaGold}</b></span>
      </div>
      <div id="arena-battle-log"></div>
    </div>
  `;
  renderArenaBattleLog();
}

function startArenaBattle(idx) {
  const enemyTeam = arenaRivals[idx].team;
  // battle engine ของจริง
  window.currentBattle = new window.BattleEngine(myArenaTeam, enemyTeam);
  window.currentBattle.runAutoFull();
  const state = window.currentBattle.getState();
  const logs = window.currentBattle.getLog();
  let resultText = "";
  if (state.result === 'win') {
    arenaStat.wins++;
    arenaGold += 700 + Math.floor(Math.random() * 350);
    resultText = '🏆 คุณชนะ!';
  } else if (state.result === 'lose') {
    arenaStat.loses++;
    resultText = '❌ คุณแพ้!';
  } else {
    resultText = '🤝 เสมอ!';
  }
  arenaStat.plays++;

  arenaBattleLog.unshift({
    rival: arenaRivals[idx].name,
    date: new Date(),
    result: state.result,
    logs: logs,
    reward: state.result === "win" ? (arenaGold) : 0
  });

  showArenaBattleDetail(resultText, logs, state.result, rivalName = arenaRivals[idx].name);
  renderArenaUI();
}

function showArenaBattleDetail(resultText, logs, result, rivalName = '') {
  const box = document.getElementById("arena-battle-log");
  if (!box) return;
  box.innerHTML = `
    <div class="arena-battle-result" style="font-size:1.09em">
      <b>VS ${rivalName}</b> <br/>
      ${resultText}
      <div style="margin:5px 0">บันทึก:</div>
      <div style="max-height:110px;overflow:auto;background:#f6f9ff;padding:7px;border-radius:7px">
        ${logs.map(l => {
          if (l.type === 'attack')
            return `<div>🗡️ <b>${l.actor}</b> โจมตี <b>${l.target}</b> (${l.skill}) <span style="color:red">- ${l.value} HP</span></div>`;
          if (l.type === 'heal')
            return `<div>💚 <b>${l.actor}</b> ฟื้น HP <span style="color:green">+${l.value}</span></div>`;
          if (l.type === 'aoe')
            return `<div>💥 <b>${l.actor}</b> ใช้ "${l.skill}" โจมตีหมู่ ทุกคน -${l.value} HP</div>`;
          return `<div>${JSON.stringify(l)}</div>`;
        }).join("")}
      </div>
      <button onclick="closeArenaBattleDetail()" style="margin-top:8px">ปิด</button>
    </div>
  `;
}

function closeArenaBattleDetail() {
  const box = document.getElementById("arena-battle-log");
  if (box) box.innerHTML = "";
}

function renderArenaBattleLog() {
  // แสดงประวัติย้อนหลัง
  const box = document.getElementById("arena-battle-log");
  if (!box) return;
  if (arenaBattleLog.length > 0) {
    let rec = arenaBattleLog[0];
    showArenaBattleDetail(
      rec.result === "win" ? '🏆 คุณชนะ!' : rec.result === "lose" ? '❌ คุณแพ้!' : '🤝 เสมอ!',
      rec.logs,
      rec.result,
      rec.rival
    );
  } else {
    box.innerHTML = '<div style="color:#aaa;font-style:italic">ยังไม่มีประวัติการต่อสู้</div>';
  }
}

// export สำหรับ html
window.initArena = initArena;
window.startArenaBattle = startArenaBattle;
window.closeArenaBattleDetail = closeArenaBattleDetail;

// end arena.js