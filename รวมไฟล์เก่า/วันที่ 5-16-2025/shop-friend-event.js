// shop-friend-event.js
// --- Shop, Friend, Setting, Event and Notice System ---

// 1. SHOP SYSTEM
window.shopItems = [
  { id: "gacha_ticket", name: "ตั๋วกาชา", desc: "สุ่มรับตัวละคร", price: 100, limit: 5 },
  { id: "heal_potion", name: "ยา HP", desc: "ฟื้นฟู HP เต็ม", price: 30, limit: 10 },
  { id: "upgrade_stone", name: "หินอัปเกรด", desc: "อัปเกรดตัวละคร", price: 300, limit: 2 },
  { id: "arena_ticket", name: "Arena Ticket", desc: "ตั๋วเข้าสนามประลอง", price: 70, limit: 3 }
  // เพิ่มสินค้าได้ตามต้องการ
];

window.shopBuyCount = window.shopBuyCount || {};

window.renderShopPanel = function() {
  document.querySelectorAll("#shopPanel").forEach(e=>e.remove());
  const panel = document.createElement("div");
  panel.id = "shopPanel";
  panel.style.position = "fixed";
  panel.style.right = "40px";
  panel.style.top = "70px";
  panel.style.background = "#34384d";
  panel.style.color = "#fff";
  panel.style.padding = "17px";
  panel.style.borderRadius = "13px";
  panel.style.zIndex = 1010;
  panel.innerHTML = `<h3>🏪 ร้านค้า Shop</h3>`;
  panel.innerHTML += `<div>Gold: <b>${window.inventory?.gold||0}</b></div>`;
  window.shopItems.forEach((it, idx)=>{
    let cnt = window.shopBuyCount[it.id]||0;
    let limStr = it.limit ? ` (เหลือ ${it.limit-cnt})` : "";
    panel.innerHTML += `<div style="margin:8px 0 5px;">
      <b>${it.name}</b> <span style="color:#ff8">${it.price}G</span> ${limStr}<br>
      <i>${it.desc}</i> <button ${cnt>=it.limit?'disabled':''} onclick="window.buyShopItem('${it.id}')">ซื้อ</button>
    </div>`;
  });
  let btn = document.createElement("button");
  btn.textContent = "ปิด";
  btn.onclick = ()=>panel.remove();
  btn.style.marginTop="10px";
  panel.appendChild(btn);
  document.body.appendChild(panel);
};

window.buyShopItem = function(id) {
  let it = window.shopItems.find(x=>x.id===id);
  if(!it) return alert("ไม่พบสินค้า");
  let cnt = window.shopBuyCount[it.id]||0;
  if(it.limit && cnt>=it.limit) return alert("ซื้อสินค้าชิ้นนี้ถึงจำนวนจำกัดในวันนี้แล้ว");
  if((window.inventory.gold||0)<it.price) return alert("Gold ไม่พอ");
  window.inventory.gold -= it.price;
  window.inventory.items[it.id]=(window.inventory.items[it.id]||0)+1;
  window.shopBuyCount[it.id]=(cnt+1);
  alert(`ซื้อ ${it.name} สำเร็จ!`);
  window.renderShopPanel();
};

// 2. FRIEND SYSTEM (mock)
window.friendList = window.friendList || [
  { name: "Noel", online: true },
  { name: "Rin", online: false }
];

window.renderFriendPanel = function() {
  document.querySelectorAll("#friendPanel").forEach(e=>e.remove());
  const panel = document.createElement("div");
  panel.id = "friendPanel";
  panel.style.position = "fixed";
  panel.style.right = "350px";
  panel.style.top = "70px";
  panel.style.background = "#3b3e44";
  panel.style.color = "#fff";
  panel.style.padding = "15px";
  panel.style.borderRadius = "11px";
  panel.style.zIndex = 1010;
  panel.innerHTML = `<h3>🤝 เพื่อน (Friend)</h3>`;
  window.friendList.forEach(f=>{
    panel.innerHTML += `<div>${f.name} <span style="color:${f.online?'#af7':'#aaa'}">${f.online?'(ออนไลน์)':'(ออฟไลน์)'}</span></div>`;
  });
  panel.innerHTML += `<input id="inviteName" placeholder="เพิ่มเพื่อน..."> <button onclick="window.addFriend()">เพิ่ม</button>`;
  let btn=document.createElement("button");btn.textContent="ปิด";btn.onclick=()=>panel.remove();btn.style.marginTop="8px";panel.appendChild(btn);
  document.body.appendChild(panel);
};
window.addFriend = function() {
  let name = document.getElementById("inviteName")?.value?.trim();
  if(!name) return alert("ใส่ชื่อเพื่อนก่อน!");
  if(window.friendList.find(f=>f.name===name)) return alert("มีเพื่อนคนนี้ในรายชื่อแล้ว");
  window.friendList.push({ name, online: Math.random()>.5 });
  window.renderFriendPanel();
};

// 3. EVENT & NOTICE SYSTEM
window.currentEvent = window.currentEvent || {
  name: "เทศกาลต้อนรับผู้เล่นใหม่",
  desc: "ล็อกอินทุกวันเพื่อรับรางวัล!",
  reward: { gacha_ticket: 1, gold: 200, exp: 30 },
  active: true
};

window.noticeLogs = window.noticeLogs || [
  { msg: "ประกาศ: ระบบกาชาเปิดใช้งานเต็มรูปแบบ!", ts: Date.now()-1000000 },
  { msg: "Event เทศกาลผู้เล่นใหม่ แจกตั๋วกาชาฟรี!", ts: Date.now()-800000 }
];

window.renderEventPanel = function() {
  document.querySelectorAll("#eventPanel").forEach(e=>e.remove());
  const panel = document.createElement("div");
  panel.id = "eventPanel";
  panel.style.position = "fixed";
  panel.style.left = "35px";
  panel.style.top = "70px";
  panel.style.background = "#22634c";
  panel.style.color = "#fff";
  panel.style.padding = "14px";
  panel.style.borderRadius = "13px";
  panel.style.zIndex = 1010;
  panel.innerHTML = `<h3>🎊 Event & Notice</h3>`;
  if(window.currentEvent && window.currentEvent.active){
    panel.innerHTML += `<div>
      <b>${window.currentEvent.name}</b>: ${window.currentEvent.desc}
      <br>รางวัล: ${Object.entries(window.currentEvent.reward).map(([k,v])=>`${v}x ${k}`).join(", ")}
      <button onclick="window.claimLoginEvent()">รับเลย</button>
    </div>`;
  }else{
    panel.innerHTML += `<div>วันนี้ยังไม่มี Event</div>`;
  }
  // Notice log
  panel.innerHTML += `<hr><b>ประกาศทั้งหมด:</b><br>`;
  window.noticeLogs.slice().reverse().forEach(n=>{
    panel.innerHTML += `<div style="font-size:90%;">${new Date(n.ts).toLocaleString()} : ${n.msg}</div>`;
  });
  let btn=document.createElement("button");btn.textContent="ปิด";btn.onclick=()=>panel.remove();btn.style.marginTop="8px";panel.appendChild(btn);
  document.body.appendChild(panel);
};

window.claimLoginEvent = function() {
  let e = window.currentEvent;
  if(!e || !e.active) return;
  // แจกของ
  for(let k in e.reward) {
    if(k==="gold"||k==="exp") window.inventory[k]=(window.inventory[k]||0)+e.reward[k];
    else window.inventory.items[k]=(window.inventory.items[k]||0)+e.reward[k];
  }
  e.active=false;
  window.noticeLogs.push({ msg: `รับรางวัล Event "${e.name}" สำเร็จ!`, ts: Date.now() });
  alert("รับรางวัลอีเวนต์สำเร็จ!");
  window.renderEventPanel();
};

// 4. SETTING Panel
window.renderSettingPanel = function() {
  document.querySelectorAll("#settingPanel").forEach(e=>e.remove());
  const panel = document.createElement("div");
  panel.id = "settingPanel";
  panel.style.position = "fixed";
  panel.style.right = "40px";
  panel.style.bottom = "60px";
  panel.style.background = "#444c51";
  panel.style.color = "#fff";
  panel.style.padding = "13px";
  panel.style.borderRadius = "11px";
  panel.style.zIndex = 1010;
  panel.innerHTML = `<h3>⚙️ Setting</h3>`;
  panel.innerHTML += `<div>เสียง: <input type="checkbox" id="soundToggle" ${window._soundMute?'':'checked'} onchange="window.toggleSound()"> เปิด/ปิด</div>`;
  panel.innerHTML += `<div>ธีม: <button onclick="window.toggleTheme()">สลับโหมดเข้ม/สว่าง</button></div>`;
  panel.innerHTML += `<div><button onclick="document.getElementById('settingPanel').remove()">ปิด</button></div>`;
  document.body.appendChild(panel);
};
window._soundMute = false;
window.toggleSound = function() {
  window._soundMute = !document.getElementById("soundToggle").checked;
};
window.toggleTheme = function() {
  document.body.classList.toggle("light-theme");
  alert("สลับธีมเรียบร้อย!");
};

// 5. AUTO BTN INJECT MENU
(function(){
  // Shop
  if(!document.getElementById("shopMenuBtn")) {
    let btn=document.createElement("button");
    btn.id="shopMenuBtn";
    btn.textContent="Shop";
    btn.onclick=window.renderShopPanel;
    document.querySelector('.game-container').appendChild(btn);
  }
  // Friend
  if(!document.getElementById("friendMenuBtn")) {
    let btn=document.createElement("button");
    btn.id="friendMenuBtn";
    btn.textContent="Friend";
    btn.onclick=window.renderFriendPanel;
    document.querySelector('.game-container').appendChild(btn);
  }
  // Event/Notice
  if(!document.getElementById("eventMenuBtn")) {
    let btn=document.createElement("button");
    btn.id="eventMenuBtn";
    btn.textContent="Event";
    btn.onclick=window.renderEventPanel;
    document.querySelector('.game-container').appendChild(btn);
  }
  // Setting
  if(!document.getElementById("settingMenuBtn")) {
    let btn=document.createElement("button");
    btn.id="settingMenuBtn";
    btn.textContent="Setting";
    btn.onclick=window.renderSettingPanel;
    document.querySelector('.game-container').appendChild(btn);
  }
})();

// --- END shop-friend-event.js --- //