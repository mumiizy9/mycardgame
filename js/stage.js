// js/stage.js - EpicSeven Advance Stage System (Linear Unlock v2.1 / GPT-4 Enhanced)

// ---------------------------- CONFIG & STATE ----------------------------
let chapterData = [];
let stageProgress = {}; // { [stageId]: true }
let chapterFiles = [
    'data/stage/chapter1.json',
    'data/stage/chapter2.json',
    'data/stage/chapter3.json'
];

// โหลดทุก Chapter พร้อมกัน (รองรับ multi chapter)
async function loadChapters() {
    if (chapterData.length) return;
    chapterData = [];
    for (let fn of chapterFiles) {
        try {
            const ch = await fetch(fn).then(r => r.json());
            chapterData.push(ch);
        } catch (e) { /* ถ้าไฟล์ยังไม่มี จะข้ามอัตโนมัติ */ }
    }
}

function loadStageProgress() {
    try {
        stageProgress = JSON.parse(localStorage.getItem('stage_progress') || '{}');
    } catch { stageProgress = {}; }
}

function saveStageProgress() {
    localStorage.setItem('stage_progress', JSON.stringify(stageProgress));
}

// --------------------- UNLOCK LOGIC WITH CROSS-ZONE + ทีมเลเวล ------------------
function isStageUnlocked(chapterIdx, zoneIdx, stageIdx) {
    return true;
}

function isStageCleared(stageId) {
    return !!stageProgress[stageId];
}

// --------------------- STAGE MAP POPUP + ADVANCED RENDER ------------------
window.openStageMapPopup = async function () {
    await loadChapters();
    loadStageProgress();
    let html = '';
    chapterData.forEach((ch, chapterIdx) => {
        html += `<div style="margin-bottom:14px;">
            <h2 style="color:#6cfffa">${ch.name}</h2>
            <div style="color:#c8eee9">${ch.desc || ''}</div>
            ${ch.zones.map((zone, zoneIdx) => `
                <div style="margin:17px 0 7px 18px;">
                    <h3 style="color:#aff">${zone.name}</h3>
                    <div class="stage-list">
                    ${
                        zone.stages.map((stage, stageIdx) => {
                            let teamLvLocked = false;
                            if (stage.require_team_level) {
                                let team = [];
                                try { team = JSON.parse(localStorage.getItem('userTeam') || '[]'); } catch {}
                                let ok = team.some(cid => {
                                    try {
                                        let c = JSON.parse(localStorage.getItem('char_' + cid) || 'null');
                                        return c && c.level && c.level >= stage.require_team_level;
                                    } catch { return false; }
                                });
                                if (!ok) teamLvLocked = true;
                            }
                            let unlocked = isStageUnlocked(chapterIdx, zoneIdx, stageIdx);
                            let cleared = isStageCleared(stage.id);
                            return `<div style="margin:4px 0 7px 27px;
                                                padding:7px 13px;border-radius:11px;
                                                background:${cleared ? '#242c4a' : '#141d28ba'};
                                                display:flex;align-items:center;justify-content:space-between;">
                                    <div>
                                        <b>${stage.name}</b> <span style="color:#cde;">LV.${stage.recommended_level}</span>
                                        <div style="font-size:.96em;color:#afe;">${stage.desc || ''}</div>
                                        ${
                                            stage.require_team_level
                                            ? `<div style="font-size:.95em;color:#62f6e6;">🔓 ต้องมีตัวละครในทีม Lv.${stage.require_team_level} ขึ้นไปถึงจะเข้าเล่น</div>`
                                            : ''
                                        }
                                    </div>
                                    <div>
                                    ${
                                        teamLvLocked
                                        ? `<span style="color:#fa8;font-size:.98em;">🔒 ต้องมีตัวในทีม Lv.${stage.require_team_level}+</span>`
                                        : (unlocked
                                            ? `<button class="primary-btn" style="padding:.5em 1.7em;" onclick="startStageBattle('${ch.id}','${zone.id}','${stage.id}')" ${cleared ? '' : ''}>
                                                    ${cleared ? 'เล่นซ้ำ' : 'เข้าเล่น'}
                                                </button>`
                                            : `<span style="color:#fa8;font-size:.98em;">🔒 ต้องผ่านด่านก่อนหน้า</span>`)
                                    }
                                    </div>
                                    ${cleared ? '<span style="color:#93d;font-size:.96em;margin-left:13px;">✔ ผ่านแล้ว</span>' : ''}
                                </div>`;
                        }).join('')
                    }
                    </div>
                </div>
            `).join('')}
        </div>`;
    });
    html += `<div style="text-align:right;margin-top:14px;">
        <button class="secondary-btn" onclick="closePopup()">ปิด</button>
    </div>`;
    window.openPopup('stageMap', html, 'large', 'เลือกด่าน');
};

// ------------------- START/END STAGE BATTLE HOOKS ----------------------
window.startStageBattle = async function (chapterId, zoneId, stageId) {
    await loadChapters();

    let chapter = chapterData.find(ch => ch.id === chapterId);
    if (!chapter) return;
    let zone = chapter.zones.find(z => z.id === zoneId);
    if (!zone) return;
    let stage = zone.stages.find(s => s.id === stageId);
    if (!stage) return;

    // Check energy
    let energy = Number(localStorage.getItem("user_energy") || 0);
    if (energy < stage.require_energy) {
        alert("Energy ไม่พอ!");
        return;
    }
    localStorage.setItem("user_energy", energy - stage.require_energy);
    if (typeof renderEnergyBar === "function") renderEnergyBar();

    // เตรียม wave (แค่ wave[0] เสมอในระบบ simple นี้)
    let enemies = (stage.waves[0] && Array.isArray(stage.waves[0].enemies))
        ? stage.waves[0].enemies
        : [];

    // Save current stage context
    localStorage.setItem('current_stage_id', stage.id);
    localStorage.setItem('current_stage_zone', zone.id);
    localStorage.setItem('current_stage_chapter', chapter.id);
    closePopup();

    setTimeout(async () => {
        // Team user
        if (window.battleEngine && battleEngine.loadBattleTeams)
            await battleEngine.loadBattleTeams();

        // Monsters
        if (window.battleEngine && typeof battleEngine.monsters !== "undefined") {
            try {
                let arr = [];
                for (const enemy of enemies) {
                    let c = null;
                    // New: Try load meta from data/monster/{id}.json first
                    try {
                        c = await fetch(`data/monster/${enemy.id}.json`).then(r => r.json());
                    } catch {
                        // Fallback: support special boss or player-like monsters
                        try {
                            c = await fetch(`data/char/${enemy.id}.json`).then(r => r.json());
                        } catch (e) { c = null; }
                    }
                    if (!c) continue;
                    arr.push({
                        ...c,
                        id: enemy.id + "_" + ((Math.random() * 10000) | 0),
                        level: enemy.level || c.level || 1,
                        currHp: c.hp,
                        alive: true,
                        buffs: [],
                        debuffs: [],
                        cooldowns: Array((c.skills || []).length).fill(0),
                    });
                }
                battleEngine.monsters = arr;
            } catch {}
        }
        battleEngine?.initSpdBar?.();
        battleEngine?.renderBattlefield?.();
        document.getElementById('mainBattlefield')?.classList.remove('hide');
    }, 400);
};

// ------- เมื่อจบด่าน (win) - ปลดล็อกด่านถัดไปทีละด่าน (linear) -----
window.hookStageBattleEnd = function(state) {
    let curStageId = localStorage.getItem('current_stage_id');
    if (state === 'win' && curStageId) {
        loadStageProgress();
        stageProgress[curStageId] = true;
        saveStageProgress();
    }
    setTimeout(() => { openStageMapPopup(); }, 900);
};

window.updateStageProgress = function(stageId) {
    loadStageProgress();
    stageProgress[stageId] = true;
    saveStageProgress();
};

// (Exports)
window.stageEngine = Object.assign(window.stageEngine || {}, {
    end: window.hookStageBattleEnd,
    update: window.updateStageProgress,
    reload: loadChapters,
});