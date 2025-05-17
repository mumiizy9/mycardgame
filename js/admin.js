// js/admin.js (ฉบับเต็มสำหรับ admin panel)

/* ==== 1) LOGIN ADMIN GUARD ==== */
document.addEventListener('DOMContentLoaded', () => {
  // Check admin session
  const isAdmin = localStorage.getItem("user_is_admin") === "1";
  const adminName = localStorage.getItem("user_name");

  if (!isAdmin) {
    alert("ต้องเป็นผู้ดูแลระบบเท่านั้น");
    window.location.href = "index.html";
    return;
  }
  document.getElementById('adminName').innerText = `👤 ${adminName}`;
  document.getElementById("btnLogout").onclick = function () {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_is_admin");
    window.location.href = "index.html";
  };

  // Menu event mapping
  {
    let mapping = {
      btnUserMgr:   renderUserMgr,
      btnCharMgr:   renderCharMgr,
      btnItemMgr:   renderItemMgr,
      btnRuneMgr:   renderRuneMgr,
      btnQuestMgr:  renderQuestMgr,
      btnGachaMgr:  renderGachaMgr,
      btnStageMgr:  renderStageMgr,
      btnShopMgr:   renderShopMgr,
      btnAnnounceMgr: renderAnnounceMgr,
      btnRedeemMgr: renderRedeemMgr,
      btnChatMod:   renderChatMgr
    };
    Object.entries(mapping).forEach(([btn, fn])=>{
      let el = document.getElementById(btn);
      if (el) el.onclick = fn;
    });
  }

  // Default: open user mgr
  renderUserMgr();
});

// Helper: set main admin area content
function setAdminMain(html) {
  document.getElementById("adminMainArea").innerHTML = html;
}

/* ==== 2) USER MANAGEMENT ==== */
async function renderUserMgr() {
  let res = await fetch('data/user.json').then(r=>r.json());
  let html = `<h2>จัดการผู้ใช้</h2>
    <table style="width:100%;background:#223247;border-radius:12px;">
      <tr style="color:#bfa;font-size:1.13em;"><th>ID</th><th>ชื่อ</th><th>Role</th><th>สถานะ</th><th>ควบคุม</th></tr>
      ${res.map(u=>
        `<tr>
          <td>${u.id}</td>
          <td>${u.name}</td>
          <td>${u.role}</td>
          <td><span style="color:${u.enabled?'#7fe':'#fad'};">${u.enabled?'✔️ ใช้งาน':'❌ ถูกปิด'}</span></td>
          <td>
            <button onclick="editUserPopup('${u.id}')" class="primary-btn" style="font-size:.95em;">แก้ไข</button>
            <button onclick="banUser('${u.id}')" class="secondary-btn" style="font-size:.93em;">แบนผู้ใช้</button>
          </td>
        </tr>`).join('')}
    </table>
    <div style="margin:16px 0 0 0;text-align:right;">
      <button class="primary-btn" onclick="addUserPopup()">+ เพิ่มผู้ใช้</button>
    </div>`;
  setAdminMain(html);
}
window.renderUserMgr = renderUserMgr;

window.editUserPopup = function (uid) {
  alert("ฟอร์มแก้ไขผู้ใช้อยู่ระหว่างพัฒนา");
}
window.addUserPopup = function () {
  alert("ฟอร์มเพิ่มผู้ใช้ใหม่อยู่ระหว่างพัฒนา");
}
window.banUser = function (uid) {
  alert(`ระบบแบนผู้ใช้ "${uid}" อยู่ระหว่างพัฒนา (ในเวอร์ชัน local ต้องแก้ใน data/user.json โดยตรงหรือเชื่อมต่อ backend)`);
};

/* ==== 3) CHAR MANAGEMENT ==== */
async function renderCharMgr() {
  let charIds = ['astra','slime_basic'];
  let all = await Promise.all(charIds.map(id=>fetch(`data/char/${id}.json`).then(r=>r.json())));
  let html = `<h2>จัดการตัวละคร (meta-json)</h2>
    <table style="width:100%;background:#2a3247;border-radius:12px;">
      <tr><th>รูป</th><th>ID</th><th>ชื่อ</th><th>★</th><th>ธาตุ</th><th>class</th><th>สกิล</th><th>แก้ไข</th></tr>
      ${all.map(c=>`
        <tr>
         <td><img src="img/char/${c.img}" style="width:36px;border-radius:9px;" /></td>
         <td>${c.id}</td>
         <td>${c.name}</td>
         <td>${c.star}</td>
         <td>${c.element}</td>
         <td>${c.class}</td>
         <td>${(c.skills||[]).length}</td>
         <td><button onclick="editCharPopup('${c.id}')" class="primary-btn" style="font-size:.93em;">แก้ไข</button></td>
        </tr>`).join('')}
    </table>
    <div style="margin:14px 0 0 0;text-align:right;">
      <button class="primary-btn" onclick="addCharPopup()">+ เพิ่มตัวละคร</button>
    </div>
    <div style="color:#aaa;padding:13px 0;">*การอัปเดตจะ Reflect เมื่อลงไฟล์ .json จริง (auto reload)</div>`;
  setAdminMain(html);
}
window.renderCharMgr = renderCharMgr;
window.editCharPopup = function (cid) { window.openPopup('editChar',`<div>ยังไม่รองรับ (โปรดแก้ json โดยตรง)</div>`,'small','แก้ไขตัวละคร'); }
window.addCharPopup = function () { window.openPopup('addChar',`<div>ยังไม่รองรับ (โปรดเขียน .json ใหม่ใน data/char/)</div>`,'small','เพิ่มตัวละคร'); }

/* ==== 4) ITEM MANAGEMENT ==== */
async function renderItemMgr() {
  let items = await fetch('data/item.json').then(r=>r.json());
  let html = `<h2>จัดการไอเท็ม</h2>
    <table style="width:100%;background:#273257;border-radius:12px;">
      <tr><th>รูป</th><th>ID</th><th>ชื่อ</th><th>type</th><th>desc</th><th>ราคา</th></tr>
      ${items.map(it=>
        `<tr>
           <td><img src="img/item/${it.img||'noimg.png'}" style="width:32px" /></td>
           <td>${it.id}</td><td>${it.name}</td>
           <td>${it.type||'-'}</td><td>${it.description||'-'}</td>
           <td>${it.price}</td>
        </tr>`
      ).join('')}
    </table>
    <div style="margin:14px 0 0 0;text-align:right;">
      <button class="primary-btn" onclick="alert('เพิ่มไอเท็ม: โปรดเพิ่มที่ data/item.json')">+ เพิ่มไอเท็ม</button>
    </div>`;
  setAdminMain(html);
}
window.renderItemMgr = renderItemMgr;

/* ==== 5) RUNE ==== */
async function renderRuneMgr() {
  let runes = await fetch('data/rune.json').then(r=>r.json());
  let html = `<h2>จัดการรูน (rune.json)</h2>
    <table style="width:100%;background:#223549;border-radius:12px;">
      <tr><th>ICON</th><th>id</th><th>name</th><th>slot</th><th>main stat</th><th>set</th><th>sub</th></tr>
      ${runes.filter(r=>r.id).map(r=>
        `<tr>
         <td>${r.icon||'🔸'}</td>
         <td>${r.id}</td>
         <td>${r.name}</td>
         <td>${r.slot}</td>
         <td>${r.main_stat ? `${r.main_stat.type}+${r.main_stat.val}` : '-'}</td>
         <td>${r.set}</td>
         <td>${(r.sub_stats||[]).map(s=>`${s.type}+${s.val}`).join(', ')}</td>
        </tr>`).join('')}
    </table>
    <div style="text-align:right;margin-top:13px;">
      <button class="primary-btn" onclick="alert('เพิ่มรูน: โปรดเพิ่มใน data/rune.json')">+ เพิ่มรูน</button>
    </div>`;
  setAdminMain(html);
}
window.renderRuneMgr = renderRuneMgr;

/* ==== 6) QUEST (JSON) ==== */
async function renderQuestMgr() {
  setAdminMain(`<h2>จัดการเควสต์ (โปรดแก้ไขที่ data/quest/*.json)</h2>
    <div>เควสต์/ภารกิจสามารถเพิ่มหรือแก้ไขได้ทันทีที่ไฟล์แล้ว reload เกม</div>
    <div style="margin:16px 0;"><button class="primary-btn" onclick="alert('รอเพิ่มหน้าเควสต์')">ตัวอย่าง</button></div>`);
}

/* ==== 7) GACHA ==== */
async function renderGachaMgr() {
  let gacha = await fetch('data/gacha.json').then(r=>r.json());
  let html = `<h2>จัดการกาชา (gacha.json)</h2>
      <table style="width:100%;background:#243168;border-radius:12px;">
      <tr><th>id</th><th>name</th><th>เปิดใช้งาน</th><th>type</th><th>cost</th><th>pool</th><th>ควบคุม</th></tr>
      ${gacha.gachas.map(g=>
        `<tr>
         <td>${g.id}</td>
         <td>${g.name}</td>
         <td>${g.enabled ? "✔" : "❌"}</td>
         <td>${g.type}</td>
         <td>${g.cost.amount} ${g.cost.item}</td>
         <td>${g.pool.map(p=>`${p.char_id}(★${p.rarity})`).join(', ')}</td>
         <td><button onclick="alert('edit gacha: โปรดแก้ไขที่ data/gacha.json')" class="primary-btn">แก้ไข</button></td>
        </tr>`).join('')}
      </table>
      <div style="margin-top:11px;text-align:right;">
        <button onclick="alert('เพิ่มกาชา: โปรดแก้ไข data/gacha.json')" class="primary-btn">+ เพิ่มกาชา</button>
      </div>`;
  setAdminMain(html);
}
window.renderGachaMgr = renderGachaMgr;

/* ==== 8) STAGE/DUNGEON ==== */
async function renderStageMgr() {
  setAdminMain(`<h2>จัดการ Stage/Dungeon</h2>
  <div>แผนที่, Zone, Stage ทั้งหมด config ใน data/stage/*.json</div>`);
}

/* ==== 9) SHOP ==== */
async function renderShopMgr() {
  let shop = await fetch('data/shop.json').then(r=>r.json());
  let html = `<h2>จัดการร้านค้า</h2>
      <table style="width:100%;background:#223249;border-radius:12px;">
      <tr><th>id</th><th>name</th><th>type</th><th>สถานะ</th><th>สินค้า</th></tr>
      ${shop.shops.map(s=>
        `<tr>
         <td>${s.id}</td>
         <td>${s.name}</td>
         <td>${s.type}</td>
         <td>${s.enabled ? "✔" : "❌"}</td>
         <td>${(s.items||[]).length} รายการ</td>
        </tr>`).join('')}
      </table>
      <div style="margin-top:10px;text-align:right;">
        <button onclick="alert('update shop: โปรดแก้ไขที่ data/shop.json')" class="primary-btn">+ เพิ่มร้านค้า/สินค้า</button>
      </div>`;
  setAdminMain(html);
}
window.renderShopMgr = renderShopMgr;

/* ==== 10) ANNOUNCEMENT ==== */
async function renderAnnounceMgr() {
  let ann = await fetch('data/announcement.json').then(r=>r.json());
  let html = `<h2>จัดการประกาศ</h2>
    <table style="width:100%;background:#142449;border-radius:10px;">
    <tr><th>id</th><th>title</th><th>pin</th><th>type</th><th>เวลา</th><th>แก้ไข</th></tr>
    ${ann.announcements.map(a=>
      `<tr>
        <td>${a.id}</td><td>${a.title}</td>
        <td>${a.pin?'✔':'❌'}</td>
        <td>${a.type}</td>
        <td>${a.show_time ? new Date(a.show_time).toLocaleString() : '-'}</td>
        <td><button onclick="alert('Announce: โปรดแก้ไขที่ data/announcement.json')" class="primary-btn" style="font-size:.96em;">แก้ไข</button></td>
      </tr>`
    ).join('')}
    </table>
    <div style="margin-top:10px;text-align:right">
     <button class="primary-btn" onclick="alert('เพิ่ม/ลบประกาศ: โปรดแก้ที่ announcement.json')">+ เพิ่มประกาศ</button>
    </div>
    <div style="color:#ead;padding:13px;">*ประกาศใหม่/ลบ ต้อง reload ไฟล์ announcement.json แล้วรีเฟรชเกม</div>`;
  setAdminMain(html);
}
window.renderAnnounceMgr = renderAnnounceMgr;

/* ==== 11) REDEEM CODE ==== */
async function renderRedeemMgr() {
  let rc = await fetch('data/redeem.json').then(r=>r.json());
  let html = `<h2>จัดการโค้ด (redeem)</h2>
    <table style="width:100%;background:#212d41;border-radius:12px;">
      <tr><th>id</th><th>desc</th><th>active</th><th>จำนวนที่ใช้</th><th>แก้ไข</th></tr>
      ${rc.codes.map(c=>
        `<tr>
         <td>${c.id}</td>
         <td>${c.desc}</td>
         <td>${c.enabled?'✔':'❌'}</td>
         <td>${c.used_count||0}/${c.max_usage||'-'}</td>
         <td><button onclick="alert('แก้ไขโค้ด: โปรดแก้ไขใน data/redeem.json')" class="primary-btn">แก้ไข</button></td>
        </tr>`
      ).join('')}
    </table>
    <div style="margin-top:11px;text-align:right;">
      <button onclick="alert('เพิ่มโค้ด: โปรดแก้ไข data/redeem.json โดยตรง')" class="primary-btn">+ เพิ่มโค้ด</button>
    </div>`;
  setAdminMain(html);
}
window.renderRedeemMgr = renderRedeemMgr;

/* ==== 12) CHAT MOD/PANEL ==== */
async function renderChatMgr() {
  // Load chat log, banned words
  let chat = [];
  try { chat = await fetch('data/chat.json').then(r=>r.json()); } catch { chat = []; }
  let banned = [];
  try { banned = await fetch('data/banned_words.json').then(r=>r.json()); } catch {banned = [];}
  let html = `<h2>ควบคุมแชท/ข้อความ</h2>
    <h3>บันทึกข้อความล่าสุด (${chat.length})</h3>
    <div style="max-height:210px;overflow-y:auto;">
      <table style="width:100%;background:#23236c;border-radius:11px;">
        <tr><th style="width:120px;">เวลา</th><th style="width:180px;">ผู้ใช้</th><th>ข้อความ</th><th>ควบคุม</th></tr>
        ${chat.slice(-50).reverse().map(c=>
          `<tr>
            <td>${c.time ? (new Date(c.time)).toLocaleTimeString() : '-'}</td>
            <td>${c.user}</td>
            <td>${escapeHTML(c.text)}</td>
            <td>
              <button class="secondary-btn" style="padding:.2em 1.2em;" onclick="alert('ลบข้อความนี้: แก้ chat.json')">ลบ</button>
            </td>
          </tr>`
        ).join('')}
      </table>
    </div>
    <h3>คำต้องห้าม (${banned.length})</h3>
    <div>
      <ul>
      ${banned.map(word=>`<li>${escapeHTML(word)} <button class="secondary-btn" onclick="alert('ลบคำต้องห้าม: โปรดแก้ banned_words.json โดยตรง')">ลบ</button></li>`).join('')}
      </ul>
      <button class="primary-btn" onclick="alert('เพิ่มคำต้องห้าม: โปรดเพิ่มใน banned_words.json')">+ เพิ่มคำต้องห้าม</button>
    </div>
    <div style="color:#98ffe7;margin:11px 0 0 0;">* ต้องอัปเดตไฟล์ JSON และรีเฟรชจึงจะมีผล</div>`;
  setAdminMain(html);
}
window.renderChatMgr = renderChatMgr;

// Utility for safe display in table
function escapeHTML(str) {
  return (str || "").replace(/[<>&"]/g, c=>
    ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
}