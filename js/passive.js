// js/passive.js
//
// Epic Seven Auto Battle - Passive Engine
// รองรับ Passive ทุกรูปแบบ (Triggered / Aura / Always) Modular based
// (c) 2024

let passiveList = []; // loaded from passive.json

// Async โหลด passive config จาก passive.json
async function loadPassiveList() {
    if (passiveList.length) return;
    try {
        passiveList = await fetch('data/passive.json').then(r => r.json());
    } catch { passiveList = []; }
}

// ------------ Logic: Apply Passive ------------
/**
 * เพิ่ม passive effect ให้ตัวละคร ณ ตอน start battle
 * @param {Object} char ตัวละคร (obj)
 * @param {Array | string} passiveIds - ชื่อ passive (หรือหลายอัน)
 */
async function applyPassive(char, passiveIds) {
    await loadPassiveList();
    if (!passiveIds) return;
    let allIds = Array.isArray(passiveIds) ? passiveIds : [passiveIds];
    allIds.forEach(pid => {
        let pas = passiveList.find(p => p.id === pid);
        if (!pas) return;
        // aura (เพิ่ม stat/บัฟ)
        if (pas.type === "aura" && pas.effect) {
            Object.keys(pas.effect).forEach(stat => {
                char[stat] = (char[stat] || 0) + pas.effect[stat];
            });
            // optional: แจ้งเตือน/ไอคอน passive aura
            char._passiveNotes = char._passiveNotes || [];
            char._passiveNotes.push({ txt: pas.name, icon: pas.icon });
        }
        // always (flag/trace)
        if (pas.type === "always" && pas.effect) {
            char._passiveAlways = Object.assign({}, char._passiveAlways || {}, pas.effect);
        }
        // trigger passive รอ hook battle
        if (pas.type === "trigger") {
            char._passiveTrigger = char._passiveTrigger || [];
            char._passiveTrigger.push(pas);
        }
    });
}

/**
 * เรียกเมื่อเกิด event ระหว่าง battle เงื่อนไข trigger
 * เช่น "onHit", "onDamaged", "onDeath", "onAllyDeath"
 * @param {Object} char - target (obj)
 * @param {string} event - event name (เช่น onHit, onDamaged)
 * @param {Object} payload - option เพิ่มเติม
 */
function doPassiveEvent(char, event, payload = {}) {
    if (!char || !char._passiveTrigger) return;
    char._passiveTrigger.forEach(pas => {
        if (pas.event === event && Math.random() * 100 < (pas.chance || 100)) {
            // trigger buff/debuff/self effect
            if (pas.effect) {
                Object.keys(pas.effect).forEach(k => {
                    // เพิ่ม HP/ATK/DEF instant
                    if (["hp", "atk", "def", "spd"].includes(k)) {
                        char[k] += pas.effect[k];
                        popupPassive(char, pas, "+" + k.toUpperCase() + " " + pas.effect[k]);
                    }
                    // heal
                    if (k === "heal") {
                        let heal = Math.floor(char.hp * pas.effect[k]);
                        char.currHp = Math.min(char.hp, char.currHp + heal);
                        popupPassive(char, pas, "+HP " + heal);
                    }
                    // buff/debuff
                    if (k === "buff" && window.effectEngine)
                        window.effectEngine.addEffect(char, Array.isArray(pas.effect[k]) ? pas.effect[k] : [pas.effect[k]], "buff");
                    if (k === "debuff" && window.effectEngine)
                        window.effectEngine.addEffect(char, Array.isArray(pas.effect[k]) ? pas.effect[k] : [pas.effect[k]], "debuff");
                });
            }
            if (pas.showText) popupPassive(char, pas, pas.showText);
        }
    });
}

// ฝัง hook ใน battle.js, effect.js หรือ animation/callbacks
window.passiveEngine = {
    load: loadPassiveList,
    apply: applyPassive,
    doEvent: doPassiveEvent
};

/**
 * Show popup note passive บนการ์ด
 */
function popupPassive(char, pas, txt) {
    let c = document.getElementById(`${char.side || 'hero'}${char.index || 0}`);
    if (!c) return;
    let pop = document.createElement('span');
    pop.className = "damage-popup";
    pop.style.color = pas.color || '#22ffd8';
    pop.innerHTML = pas.icon ? pas.icon + ' ' : '';
    pop.innerHTML += '<b>PASSIVE</b>: ' + (txt || pas.name);
    c.appendChild(pop);
    setTimeout(() => pop.remove(), 1100);
}

// ตัวอย่างการใช้งาน
// ใน battle.js, หลังจากโหลด character แล้ว:
// await passiveEngine.apply(char, char.passive);
// doPassiveEvent(char, 'onDamaged', { ... });
