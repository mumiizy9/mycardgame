// components/FriendEventUI.js

// ----- 1. FRIEND SYSTEM
let myFriends = [];
function loadFriends() {
  myFriends = JSON.parse(localStorage.getItem('myFriends') || '[]');
}
function saveFriends() {
  localStorage.setItem('myFriends', JSON.stringify(myFriends));
}
function addFriend(name) {
  if (!name || myFriends.find(f => f.name === name)) {
    alert("กำลังเพิ่มเพื่อนหรือเพื่อนซ้ำแล้ว"); return;
  }
  let newfriend = { name: name, online: Math.random() > 0.33, lastGift: null, id: Math.random().toString(36).substr(2, 8) };
  myFriends.push(newfriend);
  saveFriends();
  renderFriendEventUI();
}
function sendGift(idx) {
  let now = Date.now();
  let friend = myFriends[idx];
  if (friend.lastGift && now - friend.lastGift < 86400000) {
    alert("ส่งของขวัญไปแล้ววันนี้!"); return;
  }
  friend.lastGift = now;
  saveFriends();
  alert(`🎁 ส่งของขวัญให้ ${friend.name} แล้ว!`);
  renderFriendEventUI();
}
function removeFriend(idx) {
  if (confirm("ต้องการลบเพื่อนนี้หรือไม่?")) {
    myFriends.splice(idx, 1);
    saveFriends();
    renderFriendEventUI();
  }
}

// ----- 2. EVENT / LOGIN BONUS
let loginEvent = {
  dayStreak: 0,
  lastLogin: null,
  rewards: [
    { day: 1, reward: { gold: 200, item: "Minor Potion", icon: "🧪" } },
    { day: 2, reward: { gold: 500, item: "Gacha Ticket", icon: "🎟" } },
    { day: 3, reward: { gold: 800, item: "Rare Equip Box", icon: "🎁" } },
    { day: 4, reward: { gold: 1200, item: "Epic Potion", icon: "💎" } },
    { day: 5, reward: { gold: 2000, item: "Celestial Ticket", icon: "🔱" } },
  ]
};
function loadLoginEvent() {
  let obj = JSON.parse(localStorage.getItem('loginEvent') || '{}');
  loginEvent.dayStreak = obj.dayStreak || 0;
  loginEvent.lastLogin = obj.lastLogin || null;
}
function saveLoginEvent() {
  localStorage.setItem('loginEvent', JSON.stringify({
    dayStreak: loginEvent.dayStreak,
    lastLogin: loginEvent.lastLogin
  }));
}
function claimLoginReward(day) {
  if (loginEvent.dayStreak + 1 !== day) { alert("รับรางวัลลำดับผิดวัน"); return; }
  let rwd = loginEvent.rewards[day - 1].reward;
  window.userGold = (window.userGold || 0) + rwd.gold;
  // เพิ่มไอเทมหากต้องการ (mock ใน window.inventory)
  window.inventory = window.inventory || {};
  let key = rwd.item ? `login_${rwd.item.replace(' ', '_')}` : '';
  if (key) window.inventory[key] = (window.inventory[key] || 0) + 1;
  loginEvent.dayStreak = day;
  loginEvent.lastLogin = (new Date()).toDateString();
  saveLoginEvent();
  alert(`รับรางวัลล็อกอินวันที่ ${day}: +${rwd.gold} Gold +${rwd.item || ''}`);
  renderFriendEventUI();
}

// ----- 3. GLOBAL ANNOUNCE / NOTIFY
let notifyList = [
  { type: "announce", icon: "📢", msg: "อัปเดตใหม่! เพิ่มด่านและระบบร้านค้า", time: "วันนี้" },
  { type: "reward", icon: "🎁", msg: "กิจกรรมแจกของขวัญสำหรับผู้เล่นใหม่!", time: "สัปดาห์นี้" }
];
let lastNotifyIndex = -1;
function showNotification(msgObj) {
  let root = document.getElementById('notify-popup');
  if (!root) {
    root = document.createElement('div');
    root.id = 'notify-popup';
    root.className = "notify-popup";
    document.body.appendChild(root);
  }
  root.innerHTML = `<span class="popup-icon">${msgObj.icon}</span><span>${msgObj.msg}</span>
    <button onclick="this.parentNode.style.display='none'">ปิด</button>`;
  root.style.display = 'block';
}
function showNextNotification() {
  lastNotifyIndex++; if (lastNotifyIndex >= notifyList.length) lastNotifyIndex = 0;
  showNotification(notifyList[lastNotifyIndex]);
}

// ----- 4. UI RENDER
function renderFriendEventUI() {
  loadFriends();
  loadLoginEvent();
  let root = document.getElementById('friend-event-root');
  if (!root) return;
  // FRIEND LIST UI
  let friendsHTML = `
    <div class="friend-box">
      <h2>🤝 รายชื่อเพื่อน</h2>
      <div class="friend-add-bar">
        <input id="add-friend-input" placeholder="ใส่ชื่อเพื่อน..." type="text" style="padding:5px;border-radius:7px;border:1px solid #cecece">
        <button onclick="addFriend(document.getElementById('add-friend-input').value)">+ เพิ่มเพื่อน</button>
      </div>
      <div class="friend-list">
        ${myFriends.map((f,i)=>`
          <div class="friend-card">
            <span class="friend-icon">${f.name.charAt(0).toUpperCase()}</span>
            <b>${f.name}</b> ${f.online ? `<span class="online">🟢 Online</span>` : `<span class="offline">⚫ Offline</span>`}
            <button onclick="sendGift(${i})" ${f.lastGift&&Date.now()-f.lastGift<86400000?'disabled':''}>🎁 ส่งของขวัญ</button>
            <button onclick="removeFriend(${i})" style="background:#eee;color:#b21d1d">ลบ</button>
          </div>`).join('') || '<em style="color:#b6b6cf">ยังไม่มีเพื่อน</em>'}
      </div>
    </div>`;
  // LOGIN EVENT BONUS UI
  let loginDay = (loginEvent.lastLogin !== (new Date()).toDateString()) ? (loginEvent.dayStreak + 1) : loginEvent.dayStreak;
  let eventHTML = `
    <div class="event-box">
      <h2>🎉 Event: Login Reward</h2>
      <div class="login-reward-bar">
        ${loginEvent.rewards.map((r,i)=>`
          <div class="login-reward-item${loginEvent.dayStreak>i?' claimed':loginEvent.dayStreak===i?' active':''}">
            <span class="login-reward-icon">${r.reward.icon}</span>
            <div>Day ${r.day}</div>
            <div style="font-size:0.97em">${r.reward.item}</div>
            <div><b>+${r.reward.gold}</b> 🪙</div>
            ${loginEvent.dayStreak===i&&loginEvent.lastLogin !== (new Date()).toDateString()
              ? `<button onclick="claimLoginReward(${r.day})">รับรางวัล</button>`
              : loginEvent.dayStreak>i?'<span class="claimed">✔️ รับแล้ว</span>':''
            }
          </div>
        `).join('')}
      </div>
    </div>`;
  // ANNOUNCE/NOTIFY BUTTON
  let notifyHTML = `<div class="notify-bar"><button onclick="showNextNotification()">📢 ข่าว/ประกาศ</button></div>`;
  // รวมทั้งหมด
  root.innerHTML = `<div class="friendevent-container">${friendsHTML}${eventHTML}${notifyHTML}</div>`;
}

// expose global
window.renderFriendEventUI = renderFriendEventUI;
window.addFriend = addFriend;
window.sendGift = sendGift;
window.removeFriend = removeFriend;
window.claimLoginReward = claimLoginReward;
window.showNextNotification = showNextNotification;

// Initial render (call in index.html)

// end FriendEventUI.js