// js/chat.js

/*
  Epic Seven Card Auto Battle - Chat System
  - GM / Global / System / Player Chat
  - เก็บ chat.json + banned_words.json
  - Responsive, security filter, limited send rate
  - ใช้กับ popup UI
  (C) 2024
*/

let chatList = [];     // [{user, text, time}, ...]
let bannedWords = [];  // ["badword1", ...]
let chatLastTime = 0;
const CHAT_LOG_MAX = 50;

// โหลด chat log (localStorage/data)
async function loadChat() {
  if (!chatList.length) {
    try {
      let arr = JSON.parse(localStorage.getItem('chat_log') || "[]");
      chatList = arr;
    } catch { chatList = []; }
  }
}
function saveChat() {
  let arr = chatList.slice(-CHAT_LOG_MAX); // keep recent
  localStorage.setItem('chat_log', JSON.stringify(arr));
}

// โหลด banned words
async function loadBannedWords() {
  if (!bannedWords.length) {
    try {
      let arr = await fetch('data/banned_words.json').then(r=>r.json());
      bannedWords = arr;
    } catch { bannedWords = []; }
  }
}

// ฟังก์ชัน render popup UI
async function openChatPopup() {
  await loadChat(); await loadBannedWords();
  renderChatListUI();

  let html = `
      <div style="max-height:300px;overflow-y:auto;" id="chatAreaList"></div>
      <div style="margin-top:1.0em;display:flex;gap:7px;">
        <input id="chatInputBox" maxlength="90" placeholder="พิมพ์ที่นี่..." style="flex:1;"/>
        <button class="primary-btn" onclick="sendChatMsg()">ส่ง</button>
      </div>
      <div style="font-size:.86em;color:#cae;margin-top:.3em;">ขีดจำกัดครั้งละ 1 ข้อความต่อ 3 วินาที</div>
      <button class="secondary-btn" style="margin-top:9px;" onclick="closePopup()">ปิด</button>
  `;
  window.openPopup('chat', html, 'tall', 'แชท Global');

  document.getElementById('chatInputBox').focus();
  setInterval(renderChatListUI, 4000); // refresh
}

// Render ข้อความ
function renderChatListUI() {
  let el = document.getElementById('chatAreaList');
  if (!el) return;
  let arr = chatList.slice(-CHAT_LOG_MAX);
  el.innerHTML = arr.map(c =>
   `<div style="display:flex;align-items:center;gap:7px;margin-bottom:2px;">
      <span style="color:#77f;font-weight:600;font-size:.98em;">[${formatChatTime(c.time)}] ${escapeHTML(c.user)}:</span>
      <span style="font-size:.97em;">${escapeHTML(c.text)}</span>
      ${c.system ? ` <span style="color:#ef7;font-size:.89em;">[System]</span>` : ""}
    </div>`).join('');
  el.scrollTop = el.scrollHeight;
}

// ฟอร์แมตเวลา
function formatChatTime(ts) {
  let d = new Date(ts);
  return d.getHours().toString().padStart(2,"0")+":"+d.getMinutes().toString().padStart(2,"0");
}

// ส่งข้อความ
window.sendChatMsg = function() {
  let box = document.getElementById('chatInputBox');
  if (!box) return;
  let txt = (box.value || "").trim();
  if (!txt) return;
  if (txt.length>90) return alert('ข้อความยาวเกิน 90 ตัวอักษร');
  let now = Date.now();
  // Anti spam/rapid
  if (now - chatLastTime < 3000) { alert("ต้องรอ 3 วินาทีต่อข้อความ"); return; }
  chatLastTime = now;
  // ดึงชื่อ
  let username = localStorage.getItem('user_name') || 'Guest';
  // Filter banned
  let test = txt.toLowerCase();
  if (bannedWords.some(w => test.includes(w))) { alert("ข้อความไม่เหมาะสม!"); return; }
  // Safe HTML, not allow tags
  if (txt.match(/[<>]/)) { alert("ไม่อนุญาต HTML"); return; }
  // Push log
  chatList.push({ user: username, text: txt, time: now, system: false });
  // ตัดเก็บแค่ 50 messages
  chatList = chatList.slice(-CHAT_LOG_MAX);
  saveChat();
  box.value = "";
  renderChatListUI();
}

// Add system message (เรียกจาก battle/gacha)
window.addSystemChat = function(msg) {
  let now = Date.now();
  chatList.push({ user: "System", text: msg, time: now, system: true });
  chatList = chatList.slice(-CHAT_LOG_MAX);
  saveChat();
  renderChatListUI();
}

// Escape HTML
function escapeHTML(str) {
  return (str || "").replace(/[<>"']/g, c =>
    ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
}

// Auto mount ปุ่มแชทในเมนู
document.addEventListener('DOMContentLoaded', () => {
  let btn = document.getElementById('btnChat');
  if (btn) btn.onclick = openChatPopup;
});

// Export
window.chatEngine = {
  open: openChatPopup,
  addSystem: window.addSystemChat,
  reloadWords: async()=>{bannedWords=[];await loadBannedWords();}
};