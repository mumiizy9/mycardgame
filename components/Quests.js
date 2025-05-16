// Quests.js - ระบบเควส/มิชชั่น

// QUEST STORAGE
let questProgress = {
  // ตัวอย่าง: main-1: {claimed: false, done: false}
};
let questData = {};
let questCallbacks = {};

function saveQuests() {
  localStorage.setItem("questProgress", JSON.stringify(questProgress));
}
function loadQuests() {
  questProgress = JSON.parse(localStorage.getItem("questProgress") || '{}');
}

// เชื่อม event จากฟังก์ชั่นเกมอื่นๆ
function triggerQuest(event, payload = 1) {
  for (const [qid, cb] of Object.entries(questCallbacks)) cb(event, payload);
}

// อ่านไฟล์ quests.json
async function initQuests() {
  loadQuests();
  const res = await fetch('./data/quests.json');
  questData = await res.json();
  renderQuestsUI();

  // Register event handlers
  registerQuestHandlers();
}
// สร้างฟังก์ชั่นตรวจสอบเควส
function registerQuestHandlers() {
  if (!questData) return;

  // Clean all
  questCallbacks = {};

  // Event-driven update
  Object.values(questData).flat().forEach(q => {
    // Handler ต่อเควสแต่ละอัน
    questCallbacks[q.id] = (event, payload = 1) => {
      // ดึงค่าปัจจุบัน
      let p = questProgress[q.id] || { progress: 0, done: false, claimed: false };
      switch (event) {
        case "login":
          if((q.require.login)) { p.done = true; }
          break;
        case "gacha":
          if(q.require.gacha) { p.progress = Math.min(q.require.gacha, (p.progress || 0) + payload); if(p.progress >= q.require.gacha) p.done = true;}
          break;
        case "adventure_play":
          if(q.require.adventure_play) { p.progress = Math.min(q.require.adventure_play, (p.progress || 0) + payload); if(p.progress >= q.require.adventure_play) p.done = true; }
          break;
        case "full_team":
          if(q.require.full_team) { if(payload >= q.require.full_team) p.done = true; }
          break;
        case "upgrade":
          if(q.require.upgrade) { p.progress = Math.min(q.require.upgrade, (p.progress || 0) + payload); if(p.progress >= q.require.upgrade) p.done = true;}
          break;
        case "stage_clear":
          if(q.require.stage_clear && payload === q.require.stage_clear) { p.done = true; }
          break;
      }
      questProgress[q.id] = p;
      saveQuests();
      renderQuestsUI();
    };
  });
}

// อัปเดต UI
function renderQuestsUI() {
  if (!questData || Object.keys(questData).length === 0) return;
  const root = document.getElementById('quests-root');
  if (!root) return;
  function questBlock(type, quests) {
    return `
      <div class="quests-block">
        <h3>${type === "main" ? "🗺️ เควสหลัก" : type === "daily" ? "🔥 เควสประจำวัน" : "💡 Side Quest"}</h3>
        ${quests.map(q => {
          const prog = questProgress[q.id] || { progress: 0, done: false, claimed: false };
          return `
            <div class="quest-card ${prog.done ? "done" : ""}">
              <span class="quest-icon">${q.icon}</span>
              <strong>${q.name}</strong><br/>
              <span class="quest-desc">${q.desc}</span><br/>
              <span class="quest-reward">🎁 รางวัล: <b>${q.reward.gold}</b> 🪙${q.reward.item ? (' | ' + getItemIcon(q.reward.item) + ' ' + q.reward.item) : ''}</span><br/>
              ${q.require.gacha ? `<span>ความคืบหน้า: ${prog.progress || 0}/${q.require.gacha}</span>` : ''}
              ${q.require.upgrade ? `<span>ความคืบหน้า: ${prog.progress || 0}/${q.require.upgrade}</span>` : ''}
              ${q.require.adventure_play ? `<span>ความคืบหน้า: ${prog.progress || 0}/${q.require.adventure_play}</span>` : ''}
              ${prog.done && !prog.claimed
                ? `<button onclick="claimQuest('${q.id}')">รับรางวัล</button>`
                : prog.claimed
                ? `<span class="quest-claimed">✓ ได้รับรางวัลแล้ว</span>`
                : `<span class="quest-status">${prog.done ? '✔️ สำเร็จ' : '⏳ ยังไม่สำเร็จ'}</span>`
              }
            </div>
          `
        }).join("")}
      </div>
    `;
  }
  root.innerHTML = `
    <div class="quests-container">
      ${questBlock("main", questData.main)}
      ${questBlock("daily", questData.daily)}
      ${questBlock("side", questData.side)}
    </div>
  `;
}

// อัปเดตรับรางวัล
function claimQuest(id) {
  let q = Object.values(questData).flat().find(q => q.id === id);
  if (!q) return;
  let p = questProgress[q.id] || {};
  if (!p.done || p.claimed) return;

  // รับรางวัล
  alert(`🎉 ได้รับ: ${q.reward.gold} Gold ${q.reward.item ? '| ' + q.reward.item : ''}`);
  // เชื่อมระบบเงิน, item (mock)
  window.userGold = (window.userGold || 0) + q.reward.gold;
  // สามารถเชื่อมระบบ item จริง ในอนาคต
  p.claimed = true;
  questProgress[q.id] = p;

  saveQuests();
  renderQuestsUI();
}

// === เชื่อม Event ฝั่งเกมจริงจัง ไปที่ triggerQuest แบบอัตโนมัติ ===

// Login
document.addEventListener("DOMContentLoaded", () => {
  triggerQuest("login", 1);
});

// เชื่อมกับกาชา
window.originalRollGacha = window.rollGacha;
window.rollGacha = function() {
  window.originalRollGacha();
  triggerQuest("gacha", 1);
};

// เชื่อมกับ Adventure
window.originalEnterStage = window.enterStage;
window.enterStage = function(stageId) {
  triggerQuest("adventure_play", 1);
  window.originalEnterStage(stageId);
};

// จัดทีมครบ 4 ตัว
window.originalToggleTeam = window.toggleTeam;
window.toggleTeam = function(id) {
  window.originalToggleTeam(id);
  if (window.selectedTeam && window.selectedTeam.length === 4) {
    triggerQuest("full_team", window.selectedTeam.length);
  }
};

// เชื่อมกับ Upgrade
window.originalUpgradeStat = window.upgradeStat;
window.upgradeStat = function(idx, stat) {
  window.originalUpgradeStat(idx, stat);
  triggerQuest("upgrade", 1);
};
window.originalUpgradeLevel = window.upgradeLevel;
window.upgradeLevel = function(idx) {
  window.originalUpgradeLevel(idx);
  triggerQuest("upgrade", 1);
};

// ด่านจบ
window.originalRenderBattleRewardUI = window.renderBattleRewardUI;
window.renderBattleRewardUI = function (...args) {
  // ตรวจชม stage ที่จบ
  if (window.currentBattle && window.currentBattle.getState().finished && window.currentPlayStage) {
    triggerQuest("stage_clear", window.currentPlayStage.id);
  }
  window.originalRenderBattleRewardUI(...args);
};

// Helper
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

window.initQuests = initQuests;
window.claimQuest = claimQuest;