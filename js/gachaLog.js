// js/gachaLog.js - Epic Seven Card System: Gacha Log ระบบล็อกประวัติการสุ่มกาชา

// Log: { user_id, time, gacha_id, char_id, rarity }
let gachaLogList = [];
let gachaLogLoaded = false;

// โหลด log กาชา (จาก localStorage หรือ data/gacha_log.json สำหรับ admin)
async function loadGachaLog() {
    if (gachaLogLoaded) return;
    try {
        gachaLogList = JSON.parse(localStorage.getItem('gacha_log') || '[]');
    } catch { gachaLogList = []; }

    // ถ้าเป็น admin สามารถโหลดทุก log จากไฟล์ (read-only)
    if (window.isAdmin && window.isAdmin()) {
        try {
            let allLog = await fetch('data/gacha_log.json').then(r => r.json());
            gachaLogList = allLog.logs || [];
        } catch { /* skip if unavailable */ }
    }
    gachaLogLoaded = true;
}

// เซฟ log ลง localStorage ผู้ใช้ (เก็บ 200 รายการล่าสุด)
function saveGachaLog() {
    localStorage.setItem('gacha_log', JSON.stringify(gachaLogList));
}

// เพิ่ม log ใหม่ (ทุกครั้งสุ่ม)
window.addGachaLog = function({ user_id, gacha_id, char_id, rarity }) {
    const entry = {
        user_id: user_id || (localStorage.getItem('user_id') || 'guest'),
        gacha_id,
        char_id,
        rarity,
        time: Date.now()
    };
    gachaLogList.push(entry);
    gachaLogList = gachaLogList.slice(-200);
    saveGachaLog();
};

// ดู log ย้อนหลังเฉพาะของ user ปัจจุบัน
window.queryMyGachaLog = async function(limit = 50) {
    await loadGachaLog();
    const user_id = localStorage.getItem('user_id') || 'guest';
    return gachaLogList.filter(l => l.user_id === user_id).slice(-limit).reverse();
};

// (Admin) ดู log ทุกคน
window.queryAllGachaLog = async function(limit = 1000) {
    await loadGachaLog();
    if (!window.isAdmin || !window.isAdmin()) {
        alert("ต้องเป็นแอดมินจึงจะดู log ทั้งหมดได้");
        return [];
    }
    return gachaLogList.slice(-limit).reverse();
};

// Render Popup แสดง log กาชา user
window.openMyGachaLogPopup = async function() {
    const log = await window.queryMyGachaLog(60);
    let html = `
        <div style="font-size:1.14em;font-weight:bold;margin-bottom:7px;">ประวัติการสุ่มกาชาล่าสุด</div>
        <div style="max-height:340px;overflow-y:auto;">
        <table style="background:#1a2637;width:99%;border-radius:13px;">
        <tr style="color:#7dd;"><th>#</th><th>วัน/เวลา</th><th>กาชา</th><th>ตัวละคร</th><th>★</th></tr>
        ${
            log.length ? 
            log.map((l, i) => `<tr>
                <td>${i+1}</td>
                <td>${(new Date(l.time)).toLocaleString()}</td>
                <td>${l.gacha_id}</td>
                <td>${l.char_id}</td>
                <td style="color:${l.rarity>=5?'gold':'#bee'};">★${l.rarity}</td>
            </tr>`).join("") 
            : `<tr><td colspan="5" style="color:#faa;text-align:center;">ยังไม่มีกาชา</td></tr>`
        }
        </table>
        </div>
        <div style="text-align:right;margin-top:13px;">
            <button class="secondary-btn" onclick="closePopup()">ปิด</button>
        </div>
    `;
    window.openPopup('gachaLog', html, 'large', "ประวัติสุ่มกาชา");
};

// (Admin) Render Log ทั้งหมด popup
window.openAdminAllGachaLogPopup = async function() {
    const log = await window.queryAllGachaLog(500);
    let html = `
        <div style="font-size:1.14em;font-weight:bold;margin-bottom:7px;">[ADMIN] ประวัติการสุ่มกาชาทุกผู้ใช้</div>
        <div style="max-height:370px;overflow-y:auto;">
        <table style="background:#19263a;width:99%;border-radius:8px;">
        <tr style="color:#7dd;"><th>#</th><th>วัน/เวลา</th><th>User</th><th>กาชา</th><th>ตัวละคร</th><th>★</th></tr>
        ${
            log.length ? 
            log.map((l, i) => `<tr>
                <td>${i+1}</td>
                <td>${(new Date(l.time)).toLocaleString()}</td>
                <td>${l.user_id}</td>
                <td>${l.gacha_id}</td>
                <td>${l.char_id}</td>
                <td style="color:${l.rarity>=5?'gold':'#bee'};">★${l.rarity}</td>
            </tr>`).join("") 
            : `<tr><td colspan="6" style="color:#faa;">ไม่มี log</td></tr>`
        }
        </table>
        </div>
        <div style="text-align:right;margin-top:13px;">
            <button class="secondary-btn" onclick="closePopup()">ปิด</button>
        </div>
    `;
    window.openPopup('allGachaLog', html, 'large', "Gacha Log (ADMIN)");
};

// Auto menu: เพิ่มใน admin panel หรือเมนู profile
document.addEventListener('DOMContentLoaded', ()=>{
    if (document.getElementById('btnGachaLog')) {
        document.getElementById('btnGachaLog').onclick = window.openMyGachaLogPopup;
    }
});

// Export ให้ระบบอื่นเชื่อม
window.gachaLogEngine = {
    add: window.addGachaLog,
    mylog: window.queryMyGachaLog,
    all: window.queryAllGachaLog,
    open: window.openMyGachaLogPopup
};