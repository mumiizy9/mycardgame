// js/gacha.js - ระบบสุ่มกาชา Epic Seven Clone Frontend

let gachaList = [];
let gachaUserLog = [];
let gachaPity = {}; // {gachaId: <count>}

// โหลดข้อมูลกาชาทั้งหมด
async function loadGachaData() {
    if (gachaList.length) return;
    const res = await fetch('data/gacha.json').then(r => r.json());
    gachaList = res.gachas;
}

// โหลด log กาช่าของผู้ใช้
function loadGachaUserLog() {
    gachaUserLog = JSON.parse(localStorage.getItem('gacha_user_log') || '[]');
    gachaPity = JSON.parse(localStorage.getItem('gacha_pity') || '{}');
}
// เซฟ log/pity
function saveGachaLog() {
    localStorage.setItem('gacha_user_log', JSON.stringify(gachaUserLog));
    localStorage.setItem('gacha_pity', JSON.stringify(gachaPity));
}

// Render popup UI
async function openGachaPopup() {
    await loadGachaData(); loadGachaUserLog();
    // Render ทุกกาชาที่ enabled
    let avai = gachaList.filter(g => g.enabled);
    if (!avai.length) {
        window.openPopup('gacha', `<div>ไม่พบกาชาที่เปิดใช้งาน</div><button class="secondary-btn" onclick="closePopup()">ปิด</button>`, 'large', 'กาชา');
        return;
    }
    // Render banner + ปุ่มสุ่ม
    let html = avai.map(g => `
        <div style="background:#1b232e;padding:24px 1.5em;border-radius:18px;margin-bottom:24px;text-align:center;box-shadow:0 2px 18px #278ddf18;">
            <img src="img/gacha/${g.banner_img || 'noimg.png'}" style="width:100%;min-width:210px;max-width:330px;border-radius:9px;margin-bottom:7px;box-shadow:0 1px 40px #35cfff23;">
            <div style="font-size:1.14em;color:#7ffbfb;font-weight:600;margin-bottom:4px;">${g.name}</div>
            <div style="color:#aef;margin-bottom:1em;">${g.desc || ''}</div>
            <div style="font-size:.95em;margin-bottom:1em;"><b>ค่าใช้จ่าย: </b>
                <span style="color:goldenrod;font-weight:bold;">${g.cost.amount}</span> 
                <img src="img/item/${g.cost.item}.png" style="width:19px;vertical-align:middle;" />
            </div>
            <div><button class="primary-btn" onclick="gachaSummon('${g.id}',1)">สุ่ม 1 ครั้ง</button>
            <button class="primary-btn" onclick="gachaSummon('${g.id}',10)">สุ่ม 10 ครั้ง</button></div>
            <div style="margin-top:18px;font-size:.9em;">
                <a href="#" onclick="openGachaLogPopup('${g.id}');return false;" style="color:#85deff;text-decoration:underline;">ดูประวัติการสุ่ม</a>
                ${g.pity?.enabled ? `<span style="margin-left:2em;color:#ffa;">Pity: ${gachaPity[g.id]||0}/${g.pity.max}</span>` : ''}
            </div>
        </div>
    `).join('');
    window.openPopup('gacha', html, 'large', 'กาชา');
}

// ฟังก์ชันสุ่ม gacha ([กดปุ่ม])
window.gachaSummon = async function(gachaId, times = 1) {
    await loadGachaData(); loadGachaUserLog();
    let g = gachaList.find(x => x.id === gachaId); if (!g) return;
    // ตรวจ inventory
    let inv = window.inventoryEngine?.list();
    let currency = inv?.find(i => i.id === g.cost.item);
    if (!currency || currency.qty < g.cost.amount * times) {
        alert(`คุณมี ${g.cost.item} ไม่เพียงพอ`);
        return;
    }
    // loop draw
    let poolFlat = [];
    g.pool.forEach(entry => {
        for (let i = 0; i < entry.rate; i++) poolFlat.push(entry.char_id);
    });
    let got = [], pityFlag = false;
    for (let t = 0; t < times; t++) {
        let pity = (g.pity?.enabled ? gachaPity[g.id] || 0 : 0);
        let pick;
        // pity trigger
        if (g.pity?.enabled && g.pity.max && pity+1 >= g.pity.max) {
            pick = g.pool.find(c => c.rarity === g.pity.guarantee_rarity)?.char_id || poolFlat[0];
            gachaPity[g.id] = 0;
            pityFlag = true;
        } else {
            pick = poolFlat[Math.floor(Math.random() * poolFlat.length)];
            // ถ้าได้การ์ดตาม pity reset
            let card = g.pool.find(c => c.char_id === pick);
            if (g.pity?.enabled) {
                if(card && card.rarity === g.pity.guarantee_rarity) gachaPity[g.id] = 0;
                else gachaPity[g.id] = (gachaPity[g.id] || 0) + 1;
            }
        }
        got.push(pick);
        // เพิ่มตัวละครเข้าคลัง (characterCollection / LocalStorage)
        window.collectCharacter?.(pick);
        // Log
        gachaUserLog.push({
            time: Date.now(),
            char: pick,
            gacha_id: g.id,
            rarity: g.pool.find(c => c.char_id === pick)?.rarity || 3
        });
    }
    // หักทุน
    window.inventoryEngine.remove(g.cost.item, g.cost.amount * times);
    saveGachaLog();
    // Show animation/result popup
    openGachaResult(g, got, pityFlag);
};

// Add character (เข้าคลัง ถ้าไม่มี)
window.collectCharacter = function(charId) {
    // เอาตัวละครลง localStorage/char_collection
    let chars = JSON.parse(localStorage.getItem('char_collection') || '[]');
    if(!chars.includes(charId)) chars.push(charId);
    localStorage.setItem('char_collection', JSON.stringify(chars));
}

// แสดงผลสุ่มกาชา (animationเล็กน้อย + รายละเอียด + เพิ่มตัวละคร)
function openGachaResult(gacha, resultArr, pityFlag) {
    let html = `<div style="text-align:center;">
        <div style="font-size:1.7em;margin-bottom:6px;">🎴 Gacha Result</div>
        <div style="color:#fcc;${pityFlag ? 'font-weight:bold;' : ''}">${pityFlag ? 'Pity Triggerd! การันตีได้รับระดับสูงสุด!' : ''}</div>
        <div style="display:flex;justify-content:center;gap:13px;flex-wrap:wrap;margin-top:1em;">` +
        resultArr.map(cid => {
            let imgSrc = `img/char/${cid}.png`;
            return `<div style="background:#223352;border:2px solid #35aaffb7;border-radius:13px;padding:8px 12px;display:flex;flex-direction:column;align-items:center;min-width:93px;">
                <img src="${imgSrc}" style="width:58px;margin-bottom:8px;border-radius:10px;box-shadow:0 0 17px #27508080;" />
                <b style="color:#aef;">${cid}</b>
            </div>`;
        }).join('') +
        `</div>
        <div style="margin-top:18px;">
            <button class="primary-btn" onclick="closePopup();openGachaPopup();">กลับหน้ากาชา</button>
        </div>
    </div>`;
    window.openPopup('gachaResult', html, 'large', 'สุ่มกาชาสำเร็จ');
}

// ดูประวัติกาชา
window.openGachaLogPopup = function(gachaId) {
    loadGachaUserLog();
    let logs = gachaUserLog.filter(x => x.gacha_id === gachaId).slice(-30).reverse();
    let html = logs.length ? `<div style="max-height:300px;overflow-y:auto;"><table style="width:100%;">
        <tr style="color:#aae;"><th>#</th><th>เวลา</th><th>ผลสุ่ม</th><th>Rarity</th></tr>
        ${logs.map((l,i) => `<tr>
            <td>${i+1}</td>
            <td>${(new Date(l.time)).toLocaleString()}</td>
            <td>${l.char}</td>
            <td><span style="color:${l.rarity>=5?'gold':'#fff'};">★${l.rarity}</span></td>
        </tr>`).join('')}
        </table></div>` : `<div style="text-align:center">ยังไม่ได้สุ่มกาชา</div>`;
    window.openPopup('gachaLog'+gachaId, html, 'large', "ประวัติกาชา");
}

// auto hook ปุ่ม
document.addEventListener('DOMContentLoaded', () => {
    let btn = document.getElementById('btnGacha');
    if(btn) btn.onclick = openGachaPopup;
});

// สำหรับระบบ/admin เรียก
window.gachaEngine = {
    open: openGachaPopup,
    log: openGachaLogPopup,
    summon: window.gachaSummon
};