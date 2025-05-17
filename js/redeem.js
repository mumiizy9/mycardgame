// js/redeem.js
let redeemCodeList = [];
let userUsedRedeem = []; // [{code_id:..., redeemed_time:...}]
async function loadRedeemCodeList() {
  if (redeemCodeList.length) return;
  try {
    redeemCodeList = (await fetch('data/redeem.json').then(r=>r.json()))?.codes || [];
  } catch { redeemCodeList = []; }
  loadUserRedeemUsed();
}
function loadUserRedeemUsed() {
  userUsedRedeem = JSON.parse(localStorage.getItem('user_used_redeem') || '[]');
}
function saveUserRedeemUsed() {
  localStorage.setItem('user_used_redeem', JSON.stringify(userUsedRedeem));
}
// ป๊อปอัป "กรอกโค้ดรับรางวัล"
window.openRedeemPopup = function () {
  const html = `
    <div style="text-align:center;">
      <div style="font-size:1.16em;font-weight:600;margin-bottom:.88em;">🎁 กรอกโค้ดรับของรางวัล</div>
      <input id="redeemInputBox" placeholder="ใส่โค้ด (A-Z, 0-9)" style="width: 90%;" maxlength="32"/>
      <div style="margin:1.3em 0;"><button class="primary-btn" onclick="checkRedeemCode()">ยืนยันรับรางวัล</button></div>
      <div id="redeemResultHint" style="color:#ffc29a;font-size:.94em;margin-top:1em;"></div>
      <div style="color:#aee;margin-top:1.7em;font-size:.89em;">
        *โค้ด 1 คนใช้ได้ 1 ครั้ง, มีวันหมดอายุ, เฉพาะโค้ดที่ยังเปิดใช้งาน
      </div>
      <button class="secondary-btn" style="margin-top:2.2em;" onclick="closePopup()">ปิด</button>
    </div>
  `;
  window.openPopup('redeem', html, 'small', 'กรอกโค้ด');
  setTimeout(() => document.getElementById('redeemInputBox')?.focus(), 100);
};
// validate and ให้รางวัล
window.checkRedeemCode = async function () {
  await loadRedeemCodeList();
  const box = document.getElementById('redeemInputBox');
  if (!box) return;
  let code = box.value.trim().toUpperCase();
  let hintEl = document.getElementById('redeemResultHint');
  hintEl.innerText = "";
  if (!code.match(/^[A-Z0-9\-\_]+$/)) return hintEl.innerText = "กรุณากรอกโค้ดที่ถูกต้อง (A-Z, 0-9)";
  let redeem = redeemCodeList.find(c => c.id === code && c.enabled !== false);
  const now = Date.now();
  if (!redeem)
    return hintEl.innerText = "❌ ไม่พบโค้ดนี้ หรือโค้ดถูกปิด/หมดอายุแล้ว";
  if (redeem.start_time && now < redeem.start_time)
    return hintEl.innerText = "❌ โค้ดยังไม่เปิดให้ใช้";
  if (redeem.end_time && now > redeem.end_time)
    return hintEl.innerText = "❌ โค้ดนี้หมดอายุแล้ว";
  if (redeem.max_usage && redeem.used_count >= redeem.max_usage)
        return hintEl.innerText = "❌ โค้ดนี้ถูกใช้เต็มจำนวนแล้ว";
  // per user
  loadUserRedeemUsed();
  if (userUsedRedeem.some(u => u.code_id === code)) {
    return hintEl.innerText = "❌ คุณใช้โค้ดนี้ไปแล้ว 1 ครั้ง";
  }
  // ตรวจไอดีผู้เล่น (ควรล็อกอินก่อน, แต่ถ้าไม่มีก็จำลอง)
  let curUserId = localStorage.getItem('user_id') || 'guest';
  // ให้รางวัล (เพิ่มเข้า inventory/character)
  const rewardHtml = [];
  if (redeem.reward && Array.isArray(redeem.reward)) {
    for (let r of redeem.reward) {
      if (r.type === 'item') {
        window.addToInventory?.(r.id, r.qty || 1);
        rewardHtml.push(`<div>🎁 ได้รับ <b>${window.inventoryEngine?.findItemById(r.id)?.name || r.id} x${r.qty}</b></div>`);
      } else if (r.type === 'character') {
        window.collectCharacter?.(r.id);
        rewardHtml.push(`<div>🎴 ได้รับตัวละคร <b style="color:#84bcff;">${r.id}</b></div>`);
      }
    }
  }
  // เซฟ userUsedRedeem
  userUsedRedeem.push({ code_id: code, time: now, user: curUserId });
  saveUserRedeemUsed();
  // (ฝั่ง admin/หลังบ้านจะต้องเพิ่ม used_count เองในไฟล์ json)
  // แสดง popup ผลลัพธ์
  window.openPopup('redeemSuccess', `
    <div style="text-align:center;">
      <div style="font-size:1.15em;font-weight:700;color:#56f7ca;margin-bottom:9px;">รับรางวัลสำเร็จ!</div>
      ${rewardHtml.join('')}
      <button class="primary-btn" style="margin-top:1.2em;" onclick="closePopup();">โอเค</button>
    </div>
  `, 'small', 'ได้รับของรางวัล');
};

// Auto bind ปุ่มเมนู (ID: btnRedeem)
document.addEventListener('DOMContentLoaded', () => {
  let btn = document.getElementById('btnRedeem');
  if (btn) btn.onclick = window.openRedeemPopup;
});

// Expose export
window.redeemEngine = {
  open: window.openRedeemPopup,
  check: window.checkRedeemCode,
  reload: async () => { redeemCodeList = []; await loadRedeemCodeList(); }
};