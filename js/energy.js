// js/energy.js
//
// Epic Seven Card Battle - Energy (Stamina) System (Frontend only)
//
// รองรับ energy bar, ลด/เพิ่มระหว่างเล่นดันเจี้ยน, รีเซ็ต, ใช้ item, ป็อปอัป เติม/แจ้งหมด, อัปเดต UI อัตโนมัติ
// สามารถ sync กับ LocalStorage หรือ API/JSON ในอนาคตได้

const DEFAULT_MAX_ENERGY = 45;     // cap ค่า default
const REGEN_INTERVAL_MIN = 12;     // 1 energy ต่อกี่นาที? (12 นาที = 5/ชม)
const REGEN_AMOUNT    = 1;
const REGEN_TICK_MS   = 60 * 1000; // 1 นาที/loop (ปรับเป็น 10 วิ/DEV ได้)
const ENERGY_ITEM_IDS = ['heal_potion']; // ใช้ heal_potion เติม energy ได้
let energy_config = { max: DEFAULT_MAX_ENERGY, regen_min: REGEN_INTERVAL_MIN };

// ===== 1. STATE =====
function getEnergy() {
    let e = Number(localStorage.getItem('user_energy'));
    if (isNaN(e)) e = energy_config.max;
    return e;
}

function setEnergy(val) {
    localStorage.setItem('user_energy', val);
    renderEnergyBar();
}

function getEnergyMax() {
    return energy_config.max || DEFAULT_MAX_ENERGY;
}

// เวลาเหลือจนเติม 1 energy อัตโนมัติ (timestamp)
function getNextRegenTs() {
    let ts = Number(localStorage.getItem('energy_next_ts'));
    if (!ts) {
        ts = Date.now() + energy_config.regen_min * 60 * 1000;
        localStorage.setItem('energy_next_ts', ts);
    }
    return ts;
}

function setNextRegenTs(ts) {
    localStorage.setItem('energy_next_ts', ts);
}

// ===== 2. REGEN AUTO PER TIME (เฉพาะออน/เปิดเกม) =====
function energyRegenTick() {
    let eNow = getEnergy();
    let eMax = getEnergyMax();
    if (eNow >= eMax) {
        setNextRegenTs(Date.now() + energy_config.regen_min * 60 * 1000);
        return;
    }
    let ts = getNextRegenTs();
    let now = Date.now();
    if (now >= ts) {
        setEnergy(Math.min(eMax, eNow + REGEN_AMOUNT));
        setNextRegenTs(now + energy_config.regen_min * 60 * 1000);
        renderEnergyBar();
    }
}

// ===== 3. Energy UI BAR (Footer, Header, หรือ Popup) =====
function renderEnergyBar() {
    let bar = document.getElementById('energyBarUI');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'energyBarUI';
        Object.assign(bar.style, {
            position: 'fixed',
            left: '18px',
            top: '82px',
            zIndex: '50',
            background: '#211d27e8',
            color: '#c8f8fd',
            borderRadius: '12px',
            padding: '7px 16px 5px 16px',
            fontFamily: 'inherit',
            fontWeight: 'bold',
            boxShadow: '0 3px 19px #14effa24',
            fontSize: '1.08em',
            minWidth: '110px',
            userSelect: 'none',
            cursor: 'pointer'
        });
        document.body.appendChild(bar);
        bar.onclick = openEnergyDetailPopup;
    }
    let energy = getEnergy();
    let eMax = getEnergyMax();
    let ts = getNextRegenTs();
    let minLeft = Math.max(0, Math.ceil((ts - Date.now()) / 60000));
    bar.innerHTML = `<span style="color:#71eaff;font-size:1.23em;">⚡ ENERGY</span> <span style="color:#fafd85;">${energy}</span>/<b>${eMax}</b><span style="font-size:.93em;color:#8ee;"> ${energy < eMax ? `(+1 ใน ${minLeft}นาที)` : ''}</span>`;
}

// Popup รายละเอียด
function openEnergyDetailPopup() {
    let energy = getEnergy();
    let max = getEnergyMax();
    let minLeft = Math.ceil((getNextRegenTs() - Date.now()) / 60000);
    let html = `
      <div style="padding:6px 11px;text-align:center;">
        <div style="font-size:1.1em;margin-bottom:8px;">⚡ <b>พลังงาน</b> (${energy} / ${max})</div>
        <div style="color:#bdf;">${energy < max ? `จะฟื้น +1 energy ในอีก <b>${minLeft}</b> นาที` : 'เต็มสูงสุดแล้ว'}</div>
        <hr style="margin:12px 0;" />
        <button class="primary-btn" style="margin-bottom:6px;" onclick="refillEnergyWithItem()">ใช้ Heal Potion เพิ่ม Energy</button>
        <div style="font-size:.95em;color:#7cf;">Heal Potion = +15 Energy</div>
        <hr style="margin:12px 0;" />
        <button class="secondary-btn" onclick="closePopup()">ปิด</button>
      </div>
    `;
    window.openPopup('energyDetail', html, 'small', 'พลังงาน Energy');
}

window.refillEnergyWithItem = function() {
    // ใช้ไอเท็ม (heal_potion) ใน inventory
    let inventory = window.inventoryEngine?.list() || [];
    let owned = inventory.find(i => ENERGY_ITEM_IDS.includes(i.id) && i.qty >= 1);
    if (!owned) {
        alert("ไม่มี Heal Potion ในคลัง");
        return;
    }
    let val = 15;
    let energy = getEnergy();
    let max = getEnergyMax();
    let after = Math.min(max, energy + val);
    setEnergy(after);
    window.inventoryEngine.remove(owned.id, 1);
    closePopup('energyDetail');
    setTimeout(() => renderEnergyBar(), 222);
    alert(`Energy +${after - energy}`);
};

// ===== 4. Energy ลด/เพิ่ม ระหว่างเล่นดันเจี้ยน/อื่นๆ =====
window.addEnergy = function(val) {
    let e = Math.min(getEnergyMax(), getEnergy() + val);
    setEnergy(e);
    renderEnergyBar();
};
window.reduceEnergy = function(val) {
    let e = Math.max(0, getEnergy() - val);
    setEnergy(e);
    renderEnergyBar();
};

// ===== 5. INIT (DOMContentLoaded) =====
document.addEventListener('DOMContentLoaded', () => {
    // โหลด config
    fetch('data/energy.json').then(r => r.json()).then(cfg => {
        if (cfg?.max) energy_config.max = cfg.max;
        if (cfg?.regen_min) energy_config.regen_min = cfg.regen_min;
    }).catch(() => {});

    // ถ้ายังไม่มี energy ให้เติมเต็ม
    if (!localStorage.getItem('user_energy')) setEnergy(energy_config.max);
    // ติด energy bar UI
    setTimeout(() => renderEnergyBar(), 350);

    // Loop regen ทุก REGEN_TICK_MS
    setInterval(energyRegenTick, REGEN_TICK_MS);

    // ทุกครั้งที่เล่นดันเจี้ยนหรืออื่น ๆ ต้องเรียก
    window.renderEnergyBar = renderEnergyBar;
    window.openEnergyDetailPopup = openEnergyDetailPopup;
});

// ===== 6. Export API สำหรับระบบอื่นเชื่อมใช้ =====
window.energyEngine = {
    get: getEnergy,
    set: setEnergy,
    max: getEnergyMax,
    add: window.addEnergy,
    reduce: window.reduceEnergy,
    render: renderEnergyBar,
    openDetail: openEnergyDetailPopup,
    config: energy_config,
};