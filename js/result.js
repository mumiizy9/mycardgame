// js/result.js

/**
 * Epic Seven Auto Battle - Battle Result Handler (Frontend Only)
 * ฟังก์ชันนี้ออกแบบสำหรับ popup หน้าบอกผลการต่อสู้, อัปเดต EXP, เพิ่ม/ดรอปไอเท็ม, อัปเลเวล, แจ้งเตือน ฯลฯ
 * ใช้ได้ทันที รองรับการเชื่อม inventory.js, team.js, battle.js, popupManager.js และ system อื่น
 * Author: <yourname> (2024)
 */

// ---------- Option: CONFIGURATION (customize หรือต่อ database ได้ในอนาคต) ----------
const EXP_PER_WIN = 60;     // Exp ทุกตัว (ชนะ)
const EXP_PER_LOSE = 18;    // Exp ทุกตัว (แพ้)
const BASIC_DROP_LIST = [
    { id: 'exp_potion', name: 'EXP Potion', qty_range: [1, 2], chance: 55 },
    { id: 'gold', name: 'Gold', qty_range: [200, 500], chance: 80 },
    { id: 'rune_shard', name: 'Rune Shard', qty_range: [1, 1], chance: 20 },
    // เพิ่ม drop type ได้ใน inventory/item.json
];

// ---------- MAIN FUNCTION ----------
window.renderBattleResult = function (resultObj = {}) {
    // resultObj: { state: 'win'|'lose', heroes: [], monsters: [], drops: [] } (บาง field optional)

    // Load user team (reload for update exp)
    let team = [];
    let raw = localStorage.getItem('userTeam');
    if (raw) team = JSON.parse(raw);

    // ปกติจะมี id ตัวละครใน team
    let heroDatas = [];
    if (team.length > 0) {
        // ดึงข้อมูลตัวละครจากไฟล์ data/char/*.json
        heroDatas = team.map(id => {
            if (!id) return null;
            try {
                let cache = localStorage.getItem('char_' + id);
                if (cache) return JSON.parse(cache);
            } catch { }
            // Fallback fetch (sync โปรดักชันใช้ async แล้วค่อย render)
            let obj = null;
            let xhr = new XMLHttpRequest();
            xhr.open('GET', `data/char/${id}.json`, false);
            xhr.send();
            if (xhr.status === 200) {
                obj = JSON.parse(xhr.responseText);
            }
            return obj;
        });
        heroDatas = heroDatas.filter(c => c);
    }

    // 1. EXP/LEVEL UP
    const expGet = (resultObj.state === 'win') ? EXP_PER_WIN : EXP_PER_LOSE;
    let levelUps = [];
    heroDatas.forEach((c, i) => {
        if (!c) return;
        c.exp = (c.exp || 0) + expGet;
        let up = false;
        while (c.exp >= (c.exp_max || 99999)) {
            c.exp -= c.exp_max;
            c.level = (c.level || 1) + 1;
            up = true;
            // อัป cap = เพิ่ม exp_max? เพิ่ม config ได้
        }
        if (up) levelUps.push(c.name);
        // บันทึก state cache เผื่อ future ใช้เร็ว
        localStorage.setItem('char_' + c.id, JSON.stringify(c));
    });

    // 2. DROP SYSTEM (Mock)
    let dropItems = [];
    if (resultObj.state == 'win') {
        BASIC_DROP_LIST.forEach(d => {
            if (Math.random() * 100 < d.chance) {
                let qty = randomInt(d.qty_range[0], d.qty_range[1]);
                dropItems.push({
                    id: d.id,
                    name: d.name,
                    qty: qty
                });
                // เพิ่มเข้าคลังไอเท็ม (ถ้ามี)
                addToInventory(d.id, qty);
            }
        });
    }

    // 3. Save Update ของ Hero กลับ (option รวม cache ตาม system จริง)
    // (ฟังก์ชันเพิ่มของใน inventory ปกติอยู่ใน inventory.js, แต่ที่นี่จะ simulate if not loaded)

    // 4. Render HTML Popup
    let popupHtml = `
    <div class="popup large">
      <button class="close" onclick="closePopup()">×</button>
      <h2 style="margin-bottom:0.4em;">${resultObj.state === "win" ? "🏆 <b style='color:#54e0be'>ชนะ!</b>" : "❌ <b style='color:#f47'>แพ้</b>"}</h2>
      <div style="font-size:1.2em;color:#bdf;">${resultObj.state === "win" ? "คุณผ่านด่านและได้รับรางวัล" : "คุณได้รับ EXP ปลอบใจ"}</div>
      <hr style="margin:10px 0 10px 0; border:1px solid #234a76;">
      <div style="margin-bottom:8px;"><b>🎖 EXP ได้รับ:</b> <span style="color:#7cffda">${expGet}</span> / ตัว</div>
      <table style="width:98%;margin:10px 0 18px 0;background:#222a38;border-radius:12px;">
        <tr>
          ${heroDatas.map(c => `<td style="text-align:center;">
            <img src="img/char/${c?.img||'noimg.png'}" alt="${c?.name}" style="width:37px;border-radius:50%;box-shadow:0 0 10px #57faf840;">
            <div style="font-size:.97em;margin-top:7px;">${c?.name}</div>
            <div style="font-size:.9em;margin-top:2px;">LV. <b>${c?.level||'-'}</b> <span style="color:${levelUps.includes(c?.name) ? '#45ff77' : '#aaa'}">${levelUps.includes(c?.name) ? '↑ UP!' : ''}</span></div>
          </td>`).join('')}
        </tr>
      </table>
      ${dropItems.length > 0 ? `
      <div style="margin-bottom:7px;"><b>🎁 ไอเท็มที่ได้รับ</b>:</div>
      <div style="display:flex;gap:15px;flex-wrap:wrap;">
        ${dropItems.map(d => 
          `<div style="background:#23343b;padding:11px 18px;border-radius:8px;box-shadow:0 2px 15px #25f3f026;">
              <b style="font-size:1.17em;">${d.name}</b><br>
              <span style="font-size:.93em;color:#81e6ae;">x${d.qty}</span>
          </div>`
        ).join('')}
      </div>
      ` : ''}
      <div style="margin-top:24px;text-align:center;">
        <button class="primary-btn" onclick="closePopupAndReturn()">กลับสู่หน้าหลัก</button>
      </div>
    </div>
    `;

    // Push popup to #popupLayer (use popupManager)
    let popupLayer = document.getElementById('popupLayer');
    if (!popupLayer) {
        popupLayer = document.createElement('div');
        popupLayer.id = 'popupLayer';
        document.body.appendChild(popupLayer);
    }
    popupLayer.innerHTML = popupHtml;
    popupLayer.classList.add('active');

    // Special: ปิด popup และ refresh field (กลับไปเมนูหลัก/refresh battlefield)
    window.closePopupAndReturn = function() {
        // ซ่อน popup, กลับ index.html
        closePopup();
        if (window.location.pathname.indexOf('index.html') === -1) {
            window.location.href = 'index.html';
        } else {
            // reload team or UI if needed
            if (window.renderBattlefield) window.renderBattlefield();
        }
    }
};

// ---------- INVENTORY ADD HELPER ----------
/**
 * เพิ่มของเข้าคลัง (เรียก inventory.js จริงได้เลย ถ้ามีระบบ)
 * ฟังก์ชันนี้ mock ไว้เผื่อ inventory.js ยังไม่ได้โหลด
 */
function addToInventory(itemId, qty) {
    let items = [];
    try {
        let raw = localStorage.getItem('user_inventory') || '[]';
        items = JSON.parse(raw);
    } catch { items = []; }
    let item = items.find(x => x.id === itemId);
    if (item) {
        item.qty += qty;
    } else {
        items.push({ id: itemId, qty: qty });
    }
    localStorage.setItem('user_inventory', JSON.stringify(items));
}

// ---------- UTILS ----------
function randomInt(min, max) {
    if (min === max) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------- END OF FILE ----------
/**
 * วิธีทดสอบ:
 * - ให้เรียก window.renderBattleResult({ state: "win" }) หลังจบการต่อสู้
 * - ดู popup แสดง exp, ไอเท็ม, อัปเลเวล, สามารถ "กลับ" ไปหน้าหลักได้
 * - ตรวจสอบ LocalStorage: char_*, user_inventory, userTeam
 */