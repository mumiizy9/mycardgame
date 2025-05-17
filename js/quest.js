// js/quest.js

/**
 * ระบบเควสต์รายวัน / สัปดาห์ / event, UI popup, เชื่อม inventory/reward
 * ข้อมูลหลักอยู่ที่ data/quest/<xxx>.json
 */

let questData = [];
let questProgress = {}; // ต่อ user

async function loadQuests() {
  questData = [];
  // สมมุติใช้ไฟล์เดียวรายวัน/สัปดาห์ก่อน
  let daily = await fetch('data/quest/daily.json').then(r => r.json()).catch(() => []);
  let weekly = await fetch('data/quest/weekly.json').then(r => r.json()).catch(() => []);
  questData = [...(daily.quests || []), ...(weekly.quests || [])];
  loadQuestProgress();
}
function loadQuestProgress() {
  try {
    questProgress = JSON.parse(localStorage.getItem('quest_progress') || '{}');
  } catch { questProgress = {}; }
}
function saveQuestProgress() {
  localStorage.setItem('quest_progress', JSON.stringify(questProgress));
}

async function openQuestPopup() {
  await loadQuests();
  loadQuestProgress();
  let html = questData.length
    ? questData.map(q => renderQuestCard(q)).join('')
    : `<div style="text-align:center;color:#ddd">ยังไม่มีเควสต์ในระบบ</div>`;
  window.openPopup('quest', `<div>${html}</div>
    <div style="margin-top:16px;text-align:right;"><button class="secondary-btn" onclick="closePopup()">ปิด</button></div>`, 'large', 'เควสต์');
}
function renderQuestCard(q) {
  let prog = questProgress[q.id] || { cur: 0, claimed: false };
  let done = prog.cur >= (q.target || 1);
  return `<div style="background:#1f302a;border-radius:11px;margin:8px 0;padding:12px 13px;color:${done ? '#adeb98' : '#fff'}">
    <b>${q.name}</b><br>
    <div style="color:#bde8ff">${q.desc || ''}</div>
    <div style="margin:7px 0">ความคืบหน้า: <b>${prog.cur || 0} / ${q.target || 1}</b> ${done ? '✅' : ''}</div>
    <div>รางวัล: ${q.reward.map(r => `<span>${r.type === "item" ? "🎁" : r.type === "character" ? "🎴" : "⭐"} ${window.inventoryEngine?.findItemById(r.id)?.name || r.id} x${r.qty}</span>`).join(' ')}</div>
    <button class="primary-btn" style="margin-top:8px" onclick="claimQuest('${q.id}')" ${!done || prog.claimed ? 'disabled' : ''}>รับรางวัล${prog.claimed ? 'แล้ว' : ''}</button>
  </div>`;
}
window.claimQuest = function (questId) {
  let q = questData.find(x => x.id === questId);
  if (!q) return;
  loadQuestProgress();
  let prog = questProgress[questId] || { cur: 0, claimed: false };
  if ((prog.cur || 0) >= q.target && !prog.claimed) {
    window.rewardEngine.give(q.reward);
    prog.claimed = true;
    questProgress[questId] = prog;
    saveQuestProgress();
    openQuestPopup();
  } else {
    alert("ยังทำเควสต์ไม่ครบ");
  }
}
// ฟังก์ชันเพิ่มความคืบหน้า: เรียกเมื่อระบบหลัก trigger
window.increaseQuestProgress = function (questId, amt = 1) {
  loadQuestProgress();
  let prog = questProgress[questId] || { cur: 0, claimed: false };
  prog.cur += amt;
  questProgress[questId] = prog;
  saveQuestProgress();
}

// Auto bind menu
document.addEventListener('DOMContentLoaded', () => {
  let btn = document.getElementById('btnQuest');
  if (btn) btn.onclick = openQuestPopup;
});
// export
window.questEngine = {
  open: openQuestPopup,
  reload: loadQuests,
  progress: questProgress,
  increment: window.increaseQuestProgress,
};