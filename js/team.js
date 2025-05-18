// js/team.js

const maxTeam = 4;
const baseCharIds = ['astra', 'slime_earth', 'slime_fire', 'slime_water'];

let allChars = []; // All user-owned char (metadata, not just id)
let team = [];     // Current team (ids, max length 4)

/**
 * Ensure user has at least 4 base characters in their collection.
 * If there's no char_collection, or empty, will add defaults.
 */
function ensureBaseCollection() {
    let stored = localStorage.getItem('char_collection');
    let arr = [];
    if (stored && stored.startsWith('[')) {
        try { arr = JSON.parse(stored); } catch { arr = []; }
    }
    let changed = false;
    if (!Array.isArray(arr)) arr = [];
    baseCharIds.forEach(id => { if (!arr.includes(id)) { arr.push(id); changed = true; } });
    if (!stored || changed) localStorage.setItem('char_collection', JSON.stringify(arr));
    return arr;
}

/**
 * Load character meta from user collection (char_collection)
 */
async function loadCharacters() {
    let charIds = ensureBaseCollection();
    const metas = await Promise.all(
        charIds.map(id => fetch(`data/char/${id}.json`).then(r => r.json()).catch(() => null))
    );
    allChars = metas.filter(Boolean); // only those found in meta
}

/**
 * Load team from LocalStorage
 */
function loadTeam() {
    let t = localStorage.getItem('userTeam');
    if (!t) team = [];
    else team = JSON.parse(t);
    // Remove team member if not in current owned char
    let userCharIds = allChars.map(c => c.id);
    team = team.filter(id => userCharIds.includes(id));
}

/**
 * Save team to LocalStorage (max 4, only ids in collection)
 */
function saveTeam() {
    team = team.filter(id => id && allChars.some(c => c.id === id));
    localStorage.setItem('userTeam', JSON.stringify(team));
    alert("บันทึกทีมสำเร็จ!");
}

/**
 * Render team slot bar
 */
function renderTeamBar() {
    const el = document.getElementById('teamSlotBar');
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < maxTeam; i++) {
        let char = allChars.find(c => c.id === team[i]);
        let slot = document.createElement('div');
        slot.className = 'card';
        slot.style.minHeight = "140px";
        slot.dataset.idx = i;
        if (char) {
            slot.innerHTML = `
                <img src="img/char/${char.img}" class="hero-img" alt="${char.name}">
                <div class="name">${char.name}</div>
                <button class="primary-btn" style="margin:7px 0 4px 0;font-size:.93em;" onclick="removeFromTeam(${i})">นำออก</button>
            `;
        } else {
            slot.innerHTML = `<div style="opacity:.44;margin-top:30px;text-align:center;">ว่าง</div>`;
            slot.style.background = '#262a39b2';
        }
        el.appendChild(slot);
    }
}

/**
 * Render character collection below the team area, drag-to-add
 */
function renderCharCollection() {
    const el = document.getElementById('charCollection');
    if (!el) return;
    el.innerHTML = '';
    allChars.forEach(c => {
        let inTeam = team.includes(c.id);
        let div = document.createElement('div');
        div.className = 'card';
        div.draggable = !inTeam;
        div.style.opacity = inTeam ? '.34' : '1.0';
        div.style.cursor = inTeam ? "not-allowed" : "grab";
        div.innerHTML = `
            <img src="img/char/${c.img}" class="hero-img" alt="${c.name}" >
            <div class="name">${c.name}</div>
            <div style="font-size:.92em;margin-bottom:3px;">Lv.${c.level} &nbsp; <small class="stat-bar">${c.hp} HP</small></div>
        `;
        // Show popup info on click
        div.addEventListener('click', e => { openCharInfoPopup(c); });

        // Drag: เลือกใส่ทีม
        div.addEventListener('dragstart', ev => {
            ev.dataTransfer.setData("text/plain", c.id);
        });

        el.appendChild(div);
    });

    // Team slot: drag over/drop
    const teamSlots = document.querySelectorAll('#teamSlotBar .card');
    teamSlots.forEach(slot => {
        slot.ondragover = e => { e.preventDefault(); slot.style.borderColor = '#49cfffa8'; };
        slot.ondragleave = e => { slot.style.borderColor = ''; };
        slot.ondrop = function(e) {
            e.preventDefault();
            let dragId = e.dataTransfer.getData("text/plain");
            let idx = Number(slot.dataset.idx);
            // only if not in team and exists in collection
            if (!team.includes(dragId) && allChars.some(ch => ch.id === dragId)) {
                team[idx] = dragId;
                saveTeam();
                renderTeamBar();
                renderCharCollection();
            }
        }
    });
}

/**
 * Remove character from team by slot index
 */
window.removeFromTeam = function(idx) {
    team[idx] = undefined;
    renderTeamBar();
    renderCharCollection();
}

/**
 * Popup: Character info
 */
function openCharInfoPopup(char) {
    closePopup();
    window.openPopup('charInfo', {
        char
    });
}

// Patch: Add charInfo popup template for UI
(function () {
    const origRenderPopup = window.renderPopup;
    window.renderPopup = function (type, data) {
        if (type === "charInfo" && data && data.char) {
            const c = data.char;
            return `<div class="popup" style="min-width:285px;">
                <button class="close" onclick="closePopup()">×</button>
                <img src="img/char/${c.img}" class="hero-img" style="margin:auto;display:block;" />
                <div class="name" style="text-align:center;">${c.name}</div>
                <div style="margin-top:8px;font-size:.97em;color:#87cdff;">Lv.${c.level} ★${c.star} <span> (${c.class})</span></div>
                <hr style="margin:8px 0 8px 0;border-color:#234;">
                <div><b>HP</b> ${c.hp} &nbsp; <b>ATK</b> ${c.atk} &nbsp; <b>DEF</b> ${c.def}</div>
                <div><b>SPD</b> ${c.spd} &nbsp; <b>CRIT%:</b> ${c.crit_rate}</div>
                <div><b>Skills</b>:</div>
                <ul>${c.skills.map(s => `<li><b>${s.name}</b>: ${s.desc}</li>`).join('')}</ul>
            </div>`;
        }
        return origRenderPopup(type, data);
    }
})();

/**
 * Save team button
 */
document.addEventListener('DOMContentLoaded', () => {
    const btnSaveTeam = document.getElementById('btnSaveTeam');
    if (btnSaveTeam) btnSaveTeam.onclick = saveTeam;
});

/**
 * Back button - return to homepage
 */
const btnBack = document.getElementById('btnBack');
if (btnBack) btnBack.onclick = () => { window.location.href = 'index.html'; }

/**
 * Initialize: load all step
 */
(async () => {
    await loadCharacters();
    loadTeam(); // after allChars loaded
    renderTeamBar();
    renderCharCollection();
})();