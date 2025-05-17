// js/characterCollection.js

/**
 * Epic Seven - Character Collection System (Frontend Only)
 * - Card grid, search, sort, filter, responsive, upgrade, rune
 * - Data driven by: localStorage char_collection & data/char/*.json
 * - Connect: upgrade.js, rune.js, team.js, popupManager.js
 * (c) 2024
 */

let charCollection = [];  // Owned character IDs
let charMeta = [];        // All char meta loaded
let filters = { text: '', star: 0, element: 'all', class: 'all' };

// ------------ 1. Load user collection from localStorage ------------
function loadCharCollection() {
    let arr = JSON.parse(localStorage.getItem('char_collection') || "[]");
    charCollection = arr.filter((id, idx) => arr.indexOf(id) === idx); // unique
}

// ------------ 2. Load meta data for all owned characters ------------
async function loadCharMeta() {
    await loadCharCollection();
    charMeta = await Promise.all(charCollection.map(async id => {
        try {
            let res = await fetch(`data/char/${id}.json`);
            return await res.json();
        } catch (e) { return null; }
    }));
    charMeta = charMeta.filter(c => !!c);
}

// ------------ 3. Render main UI grid ------------
function renderCharGrid() {
    let area = document.getElementById('characterArea');
    if (!area) return;
    let cs = charMeta.slice();
    if (filters.star > 0) cs = cs.filter(c => (c.star || 0) === Number(filters.star));
    if (filters.element !== 'all') cs = cs.filter(c => (c.element || "") === filters.element);
    if (filters.class !== 'all') cs = cs.filter(c => (c.class || "") === filters.class);
    if (filters.text.length) cs = cs.filter(c => c.name.toLowerCase().includes(filters.text.toLowerCase()));
    cs.sort((a, b) => (b.star || 0) - (a.star || 0) || (a.name.localeCompare(b.name)));
    let isMobile = window.innerWidth < 650;
    let html = `<div style="display:grid;grid-template-columns:repeat(${isMobile ? 3 : 6},1fr);gap:16px;">` +
        (cs.length ? cs.map(c => charCardBox(c)).join('') : '<div style="color:#fff;">ไม่มีตัวละคร</div>') +
        `</div>`;
    area.innerHTML = `
      <div style="display:flex;gap:10px;margin-bottom:10px;">
        <input id="charSearchBox" placeholder="ค้นหาชื่อ..." style="flex:1;max-width:180px;" value="${filters.text || ''}"/>
        <select id="starFilter"><option value="0">★ ทั้งหมด</option><option value="3">★3</option><option value="4">★4</option><option value="5">★5</option></select>
        <select id="eleFilter"><option value="all">ทุกธาตุ</option><option value="fire">🔥 ไฟ</option><option value="water">💧 น้ำ</option><option value="earth">🌱 ดิน</option><option value="dark">🌑 มืด</option><option value="light">🌟 แสง</option></select>
        <select id="classFilter"><option value="all">ทุกคลาส</option><option value="knight">อัศวิน</option><option value="warrior">นักรบ</option><option value="mage">จอมเวทย์</option><option value="ranger">เรนเจอร์</option><option value="assassin">แอสซาซิน</option><option value="monster">มอนสเตอร์</option></select>
      </div>
      ${html}
    `;
    document.getElementById('starFilter').value = filters.star;
    document.getElementById('eleFilter').value = filters.element;
    document.getElementById('classFilter').value = filters.class;
    document.getElementById('charSearchBox').oninput = ev => { filters.text = ev.target.value.trim(); renderCharGrid(); };
    document.getElementById('starFilter').onchange = ev => { filters.star = ev.target.value; renderCharGrid(); };
    document.getElementById('eleFilter').onchange = ev => { filters.element = ev.target.value; renderCharGrid(); };
    document.getElementById('classFilter').onchange = ev => { filters.class = ev.target.value; renderCharGrid(); };
}

// ------------ 4. Card box HTML ------------
function charCardBox(c) {
    let lock = isCharLocked(c.id);
    return `
      <div class="card" data-chrid="${c.id}" style="position:relative;">
        <img src="img/char/${c.img}" class="hero-img" alt="${c.name}" />
        <div class="name">${c.name}</div>
        <div style="font-size:.93em;color:#d9d;line-height:1.2em;">Lv. ${c.level || '-'} ★${c.star || '-'}</div>
        <div style="font-size:.89em;color:#cff;">ธาตุ: ${elIcon(c.element)} | ${classIcon(c.class)}</div>
        <div style="margin:6px 0;">
            <button class="primary-btn" style="padding:3px 1.1em;font-size:.97em;" onclick="showCharDetailPopup('${c.id}')">รายละเอียด</button>
            <button class="secondary-btn" style="padding:3px 1.1em;font-size:.97em;" onclick="upgradeCharPopup('${c.id}')">อัปเกรด</button>
            <button class="primary-btn" style="padding:3px 1em;font-size:.93em;" onclick="runeEngine.openEquipPopup('${c.id}')">ใส่รูน</button>
        </div>
        <button style="position:absolute;top:7px;right:14px;opacity:.8;background:none;border:0;color:#fa8;font-size:1.5em;outline:none;z-index:7"
            onclick="toggleCharLock('${c.id}');event.stopPropagation()" title="${lock ? 'ปลดล็อก' : 'ล็อก'}">
            ${lock ? '🔒' : '🔓'}
        </button>
      </div>`;
}
function elIcon(el) {
    return { fire: '🔥', water: '💧', earth: '🌱', dark: '🌑', light: '🌟' }[el] || '❔';
}
function classIcon(cls) {
    return { knight: '🛡️', warrior: '⚔️', mage: '🦉', ranger: '🏹', assassin: '🗡️', monster: '👾' }[cls] || '👽';
}

// ------------ 5. Lock/Unlock ------------
function isCharLocked(chid) {
    let ll = JSON.parse(localStorage.getItem('char_lock') || "[]");
    return ll.includes(chid);
}
function toggleCharLock(chid) {
    let ll = JSON.parse(localStorage.getItem('char_lock') || "[]");
    let idx = ll.indexOf(chid);
    if (idx >= 0) ll.splice(idx, 1); else ll.push(chid);
    localStorage.setItem('char_lock', JSON.stringify(ll));
    renderCharGrid();
}

// ------------ 6. Popup: Char Detail ------------
window.showCharDetailPopup = async function (charId) {
    let c = charMeta.find(c => c.id === charId);
    if (!c) return;
    let html = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:7px;">
            <img src="img/char/${c.img}" class="hero-img" style="width:82px;margin:0 auto 9px auto;" />
            <div style="font-size:1.22em;font-weight:600">${c.name}</div>
            <div style="color:#b6deff;">Lv.${c.level || '-'} / ★${c.star||'-'} | ${elIcon(c.element)} ${classIcon(c.class)}</div>
            <hr style="width:86%;border:1px solid #234;" />
            <div>HP <b>${c.hp}</b> | ATK <b>${c.atk}</b> | DEF <b>${c.def}</b> | SPD <b>${c.spd}</b></div>
            <div>CRIT <b>${c.crit_rate}%</b> | CRIT DMG <b>${c.crit_dmg}%</b> | EFF <b>${c.effectiveness}%</b></div>
            <div>Skills: <ul>${(c.skills || []).map(s => `<li><b>${s.name}</b>: ${s.desc || ''}</li>`).join('')}</ul></div>
            <div style="margin-top:7px;">
                <button class="primary-btn" onclick="upgradeCharPopup('${c.id}')">อัปเกรด</button>
                <button class="primary-btn" onclick="runeEngine.openEquipPopup('${c.id}')">ใส่รูน</button>
                <button class="secondary-btn" onclick="closePopup()" style="margin-left:11px;">ปิด</button>
            </div>
        </div>`;
    window.openPopup('charDetail', html, 'large', c.name);
}

// ------------ 7. INIT [DOM Ready, bind menu] ------------
document.addEventListener('DOMContentLoaded', async () => {
    let btn = document.getElementById('btnCharacter');
    if (btn)
        btn.onclick = async () => {
            await loadCharMeta();
            renderCharGrid();
            window.openPopup('characterCollection', `<div id="characterArea"></div>`, 'large', 'คลังตัวละคร');
            renderCharGrid();
        };
});

// ให้ระบบอื่นเชื่อมต่อ (upgrade, rune)
window.characterEngine = {
    load: loadCharMeta,
    render: renderCharGrid
};