// js/announcement.js
let announcementList = [];
/** โหลดรายการ announcement */
async function loadAnnouncements() {
  if (announcementList.length) return;
  let raw = await fetch('data/announcement.json').then(r => r.json());
  announcementList = raw.announcements || [];
}
/** Render popup รวมประกาศในหมวดต่างๆ (รองรับ noti dot) */
async function openAnnouncementPopup() {
  await loadAnnouncements();
  let readIds = JSON.parse(localStorage.getItem('read_announcement_ids') || "[]");
  // ปักหมุด/กลุ่ม
  let pin = announcementList.filter(a => a.pin && isAnnouncementAvailable(a));
  let normal = announcementList.filter(a => !a.pin && isAnnouncementAvailable(a));
  function groupBy(arr, key) { return arr.reduce((r, x) => ((r[x[key]]=r[x[key]]||[]).push(x),r),{});}
  let normalGrp = groupBy(normal, 'type');
  let tabTypes = ['all', ...Object.keys(normalGrp)];
  let activeType = 'all';
  let htmlTabs = tabTypes.map(type => 
    `<button class="primary-btn" style="margin-right:8px;font-weight:${type===activeType?'bold':'400'};" onclick="changeAnnouncementTab('${type}')">${type==='all'?'ทั้งหมด':typeTitle(type)}</button>`
  ).join('');
  let htmlPin = pin.length ? `<div style="margin-bottom:16px;">${pin.map(renderAnnounceCard).join('')}</div>` : '';
  let htmlList = normal.map(renderAnnounceCard).join('');
  let html = `
    <div>
      <div style="margin-bottom:13px;">${htmlTabs}</div>
      ${htmlPin}
      <div id="announceMainList">${htmlList}</div>
    </div>
    <div style="text-align:right;"><button class="secondary-btn" onclick="closePopup()">ปิด</button></div>
  `;
  window.openPopup('announcement', html, 'large', 'ประกาศ');
  setMenuNoti('btnAnnouncement', hasUnreadAnnouncement());
}
function renderAnnounceCard(a, idx = 0) {
  let readIds = JSON.parse(localStorage.getItem('read_announcement_ids') || "[]");
  let unread = !readIds.includes(a.id);
  let badge = a.type === 'patch' ? '🛠️ ' : a.type === 'event' ? '🎉 ' : a.type === 'reward' ? '🎁 ' :
              a.type === 'shop' ? '🛒 ' : a.type === 'system' ? '⚠️ ' : '';
  let pin = a.pin ? '<span style="color:#fdec60;font-size:1.1em;">📌</span>' : '';
  let statusDot = unread ? '<span style="display:inline-block;width:9px;height:9px;border-radius:7px;background:#ff6565;margin-left:6px;margin-bottom:1px;"></span>' : '';
  return `
    <div class="announce-card" style="background:#222d3d;border-radius:9px;margin-bottom:11px;padding:7px 13px 7px 13px;box-shadow:0 1px 16px #1470ad21;border:2px solid #174e8b42;cursor:pointer;transition:.14s;" onclick="viewAnnouncement('${a.id}')">
      <div style="font-size:1.02em;margin-bottom:1px;font-weight:bold;">
        ${pin} ${badge} <span>${a.title || '-'}</span> ${statusDot}
      </div>
      <div style="color:#9ad;font-size:.95em;">${a.show_time?formatTime(a.show_time):""} ${typeTitle(a.type)}</div>
      <div style="font-size:.93em;">
          ${a.short ? escapeHTML(a.short || '') : truncate(stripTags(a.content || ''), 71)}
      </div>
    </div>
  `;
}
/** ดูประกาศเต็ม */
window.viewAnnouncement = function (id) {
  let ann = announcementList.find(a => a.id === id);
  if (!ann) return;
  // Mark as read
  let readIds = JSON.parse(localStorage.getItem('read_announcement_ids') || '[]');
  if (!readIds.includes(ann.id)) {
    readIds.push(ann.id);
    localStorage.setItem('read_announcement_ids', JSON.stringify(readIds));
  }
  // action พิเศษ (force_popup, shop link, ... อื่นๆ)
  if (ann.force_popup) setTimeout(() => {}, 1);
  // Render detail
  let badge = ann.type === 'patch' ? '🛠️ ' : ann.type === 'event' ? '🎉 ' : ann.type === 'reward' ? '🎁 ' :
              ann.type === 'shop' ? '🛒 ' : ann.type === 'system' ? '⚠️ ' : '';
  let html = `
      <div style="font-size:1.19em;margin-bottom:.6em;">
          ${badge}<b>${escapeHTML(ann.title || '')}</b>
          ${ann.pin?'<span style="font-size:1.1em;color:#fdc900;">📌</span>':''}
      </div>
      <div style="color:#bce1ff;font-size:.97em;margin-bottom:4px;">
          หมวด: ${typeTitle(ann.type)} &nbsp; ${ann.show_time?formatTime(ann.show_time):""}
      </div>
      <div style="margin:9px 0 18px 0;white-space:pre-line;">${richText(ann.content||'')}</div>
      ${ann.link_url ? `<div><a href="${ann.link_url}" target="_blank" style="color:#3fa8ff;text-decoration:underline;">รายละเอียดเพิ่มเติม</a></div>` : ''}
      <div style="text-align:right;margin-top:1.1em;">
        <button class="secondary-btn" onclick="closePopup();openAnnouncementPopup();">กลับ</button>
      </div>
  `;
  window.openPopup('announceDetail', html, 'large', ann.title ? `${badge}${ann.title}` : "รายละเอียดประกาศ");
  setMenuNoti('btnAnnouncement', hasUnreadAnnouncement());
};
// UI helpers
function typeTitle(type) {
  return {
    'patch': 'Patch Note','event': 'กิจกรรม',
    'reward': 'ของรางวัล','shop': 'ร้านค้า/โปรโมชั่น',
    'system': 'แจ้งระบบ','general': 'ทั่วไป','inbox': 'ข้อความเฉพาะ'
  }[type] || type;
}
function stripTags(html) { return html.replace(/(<([^>]+)>)/gi, ""); }
function truncate(str, len) { return str.length<=len?str:str.substring(0, len-2)+"..."; }
function formatTime(ts) { if(!ts) return ""; let d=new Date(ts); return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`; }
function escapeHTML(str) { return str.replace(/[<>"&]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
function richText(str) { return escapeHTML(str).replace(/\n/g, '<br>').replace(/\*(.*?)\*/g, '<b>$1</b>'); }
/** ควรแสดง? (ตามเวลา, flag) */
function isAnnouncementAvailable(a) {
  const now = Date.now();
  if ((a.start_time && now < a.start_time) || (a.end_time && now > a.end_time)) return false;
  return a.enabled !== false;
}
/** มีประกาศใหม่ unread? */
function hasUnreadAnnouncement() {
  let readIds = JSON.parse(localStorage.getItem('read_announcement_ids') || "[]");
  return announcementList.some(a => isAnnouncementAvailable(a) && !readIds.includes(a.id));
}
/** Tab switch */
window.changeAnnouncementTab = function (type) {
  let list = announcementList.filter(a => isAnnouncementAvailable(a)
      && (type === 'all' || a.type === type));
  let htmlPin = list.filter(a=>a.pin).map(renderAnnounceCard).join('');
  let htmlList = list.filter(a=>!a.pin).map(renderAnnounceCard).join('');
  document.getElementById('announceMainList').innerHTML = htmlPin + htmlList;
};
// Auto bind main menu
document.addEventListener('DOMContentLoaded', () => {
  let btn = document.getElementById('btnAnnouncement');
  if (btn) btn.onclick = openAnnouncementPopup;
  if (hasUnreadAnnouncement()) setMenuNoti('btnAnnouncement', true);
});
// export
window.announcementEngine = {
  open: openAnnouncementPopup,
  getAll: () => announcementList,
  reload: async () => { announcementList = []; await loadAnnouncements(); }
};