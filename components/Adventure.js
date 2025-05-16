// Adventure.js - Stage/Adventure UI (สมบูรณ์ เชื่อม battle engine จริง ไม่ mock)

let adventureData = [];
let selectedWorld = 0;
let stageResult = null;
let currentPlayStage = null;

async function initAdventure() {
  const res = await fetch('./data/stages.json');
  adventureData = await res.json();
  renderAdventureWorlds();
}

// UI เลือก world
function renderAdventureWorlds() {
  const root = document.getElementById('adventure-root');
  let worldBtns = adventureData.map((world, idx) =>
    `<button onclick="selectWorld(${idx})" ${idx === selectedWorld ? 'class="active"' : ''}>
      🌎 World ${world.world}: ${world.name}
    </button>`
  ).join(' ');

  root.innerHTML = `
    <div class='adventure-box'>
      <h2>🌄 Adventure</h2>
      <div class='adventure-world-btns'>${worldBtns}</div>
      <div id="stage-list"></div>
      <div id="stage-battleresult"></div>
    </div>
  `;
  renderStageList();
}

// สำหรับคลิก world
function selectWorld(idx) {
  selectedWorld = idx;
  renderAdventureWorlds();
}

// UI list stage ทุกด่าน
function renderStageList() {
  const div = document.getElementById('stage-list');
  const world = adventureData[selectedWorld];
  div.innerHTML = world.stages.map(stg => `
    <div class="stage-card">
      <span style="font-size:22px;">🛤️</span>
      <strong>Stage ${stg.id}: ${stg.name}</strong>
      <div>ศัตรู: ${stg.enemies.map(e =>
        `<span title="Lv.${e.level}${e.star ? ' ★' + e.star : ''}">
            ${e.name} (${e.level})${e.star ? ' ★' + e.star : ''}
        </span>`
      ).join(', ')}</div>
      ${stg.boss ?
        `<div class="stage-boss">👹 BOSS: ${stg.boss.name} (Lv.${stg.boss.level} ★${stg.boss.star}) <b>${stg.boss.extra_skill}</b> <span title="Boss note">${stg.boss.note || ""}</span></div>`
        : ""
      }
      <div>🎁 รางวัล: <b>${stg.reward.gold}</b> <span>🪙</span> 
      ${stg.reward.item ? (`| <span>${getItemIcon(stg.reward.item)}</span> ${stg.reward.item}`) : ''}</div>
      <button onclick="enterStage('${stg.id}')" style="margin-top:5px;">เริ่มต่อสู้</button>
    </div>
  `).join('');
}

function getItemIcon(item) {
  switch (item) {
    case "Minor Potion": return "🧪";
    case "Epic Potion": return "💎";
    case "Gacha Ticket": return "🎟";
    case "Rare Equip Box": return "🎁";
    case "Mana Fragment": return "🌕";
    case "Ancient Herb": return "🌿";
    case "Curse Relic": return "☠️";
    case "Celestial Ticket": return "🔱";
    default: return "🎁";
  }
}

// เริ่มเข้าสู้ ใช้งาน battle engine จริง
async function enterStage(stageId) {
  const world = adventureData[selectedWorld];
  const stg = world.stages.find(s => s.id === stageId);
  currentPlayStage = stg;

  // ฟETCHข้อมูลตัวละคร (ต้อง fetch และสร้าง getCharStatsById ก่อน map enemies)
  const allchars = await fetch('./data/characters.json').then(r => r.json());

  function getCharStatsById(id, lv, star) {
    let char = allchars.find(c => c.id === id);
    if (!char) return { hp: 100, atk: 40, def: 10, spd: 10 };
    let s = JSON.parse(JSON.stringify(char.stats));
    let up = (lv - 1) * 16 + ((star ? (star - char.rarity) : 0) * 22);
    return {
      hp: s.hp + up * 10,
      atk: s.atk + up * 2,
      def: s.def + up * 2,
      spd: s.spd + Math.max(0, Math.floor(up / 15))
    }
  }

  // ใช้งานทีมจริง
  let userChars = window.selectedTeam?.length ? window.selectedTeam : [];
  if (userChars.length < 1) {
    alert("กรุณาเลือกทีมของคุณ (อย่างน้อย 1 ตัวละคร) ที่ด้านบนก่อน!");
    return;
  }

  // ข้อมูลศัตรู (คลูนจาก character.json + stat scaling)
  let enemies = [
    ...stg.enemies.map(e => ({
      ...e,
      stats: getCharStatsById(e.id, e.level, e.star)
    }))
  ];
  if (stg.boss) {
    enemies.push({
      ...stg.boss,
      stats: getCharStatsById(stg.boss.id, stg.boss.level, stg.boss.star)
    });
  }

  // ไป battle ui (เชื่อม battle engine จริง)
  window.initBattleUI(userChars, enemies);

  // แสดงผลรางวัล หากจบ
  setTimeout(() => renderBattleRewardUI(), 900);
}

function renderBattleRewardUI() {
  const battleRoot = document.getElementById('battle-root');
  if (!window.currentBattle || !window.currentBattle.getState().finished) return;
  const result = window.currentBattle.getState().result;
  const stg = currentPlayStage;
  const rwd = stg.reward;
  let box = document.getElementById('stage-battleresult');
  if (!box) box = document.createElement('div');
  box.id = 'stage-battleresult';
  box.innerHTML = `
    <div class="stage-result-box" style="font-size:1.15em;line-height:2">
      <b>สรุปผล Stage: ${stg.id}</b>
      <div>🧾 ผลการต่อสู้: <b>${result}</b></div>
      ${result === 'win' ? `<div>🎉 ได้รับ: <b>${rwd.gold} 🪙</b> ${rwd.item ? '| ' + getItemIcon(rwd.item) + ' ' + rwd.item : ""}</div>` : ""}
      <button onclick="closeStageResult()" style="margin-top:7px;">ปิด</button>
    </div>
  `;
  let parent = document.getElementById('adventure-root');
  if (box && parent) parent.appendChild(box);
}

function closeStageResult() {
  let box = document.getElementById('stage-battleresult');
  if (box) box.remove();
  currentPlayStage = null;
}

// สำหรับ global
window.initAdventure = initAdventure;
window.selectWorld = selectWorld;
window.enterStage = enterStage;
window.closeStageResult = closeStageResult;
window.renderBattleRewardUI = renderBattleRewardUI;

// END Adventure.js