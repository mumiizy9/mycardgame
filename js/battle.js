// js/battle.js - Epic Seven Card Battle NEW (2024/06 Rewrite By GPT-4)
// ระบบต่อสู้แบบ SPD BAR, AI Auto, Popup ดาเมจ/ฮีล, Event เชื่อม, รองรับโมดูลใหม่ (effect, passive, animation)

const CONFIG = { SPD_MAX: 100, SPD_FRAME: 120, MAX_HERO: 4, MAX_MON: 4 };
let Battle = {
    heroes: [],
    monsters: [],
    spdBar: [],
    auto: false,
    running: false,
};

// ----------------- LOAD TEAM & ENEMY -----------------
async function loadBattleTeams() {
    // Load user team
    let ids = JSON.parse(localStorage.getItem('userTeam') || "[]");
    Battle.heroes = [];
    for (let id of ids) {
        if (!id) continue;
        let c = await fetch(`data/char/${id}.json`).then(r => r.json());
        let meta = { ...c, currHp: c.hp, alive: true, buffs: [], debuffs: [], cooldowns: new Array((c.skills||[]).length).fill(0) };
        if (window.passiveEngine?.apply) await window.passiveEngine.apply(meta);
        Battle.heroes.push(meta);
    }
    // Load monsters ("monster_list" หรือ fallback)
    let mlist = [];
    try {
        mlist = JSON.parse(localStorage.getItem("monster_list") || '["slime_basic"]');
    } catch { mlist = ["slime_basic"]; }
    Battle.monsters = [];
    for (let i = 0; i < CONFIG.MAX_MON; i++) {
        let id = mlist[i % mlist.length];
        let c = null;
        try { c = await fetch(`data/monster/${id}.json`).then(r => r.json()); }
        catch { c = { id: "slime_basic", name: "Slime", hp: 300, atk: 18, def: 7, spd: 85, img: "slime_basic.png", skills: [] }; }
        let meta = { ...c, id: c.id + '_' + (i+1), currHp: c.hp, alive: true, buffs: [], debuffs: [], cooldowns: new Array((c.skills||[]).length).fill(0) };
        if (window.passiveEngine?.apply) await window.passiveEngine.apply(meta);
        Battle.monsters.push(meta);
    }
}

// ----------------- SPD BAR INIT -----------------
function initSpdBar() {
    Battle.spdBar = [];
    Battle.heroes.forEach((h,i) => Battle.spdBar.push(spdObject(h,i,"hero")));
    Battle.monsters.forEach((m,i) => Battle.spdBar.push(spdObject(m,i,"mon")));
}
function spdObject(c, idx, side) {
    return { id: `${side}${idx}`, idx, side, name:c.name, spd:c.spd, charge:0, dead:false, cooldowns:c.cooldowns, buffs:c.buffs, debuffs:c.debuffs };
}

// ----------------- RENDER FIELD + CARD -----------------
function renderBattlefield() {
    let heroRow = document.querySelector('.card-row.user');
    let monRow  = document.querySelector('.card-row.monster');
    if (heroRow) heroRow.innerHTML = '';
    if (monRow) monRow.innerHTML   = '';
    Battle.heroes.forEach((c, i) => heroRow?.appendChild(renderCardNew(c,i,"hero")));
    Battle.monsters.forEach((c, i) => monRow?.appendChild(renderCardNew(c,i,"mon")));
    // SPD Bars
    let bar = document.querySelector('.spd-bar-container');
    if (bar) bar.innerHTML = '';
    Battle.spdBar.forEach(obj=>{
        let wrap = document.createElement('div');
        wrap.className = 'spd-bar';
        wrap.title = `[${obj.side=="hero"?"Hero":"Monster"}] ${obj.name} SPD:${obj.spd}`;
        let fill = document.createElement('div');
        fill.className = 'spd-bar-fill';
        fill.style.width = Math.floor(Math.min(CONFIG.SPD_MAX, obj.charge)/CONFIG.SPD_MAX*100) + "%";
        wrap.appendChild(fill); bar?.appendChild(wrap);
    });
}
function renderCardNew(c, idx, side) {
    let d = document.createElement('div');
    d.className = 'card';
    d.id = `${side}${idx}`;
    d.setAttribute('data-idx', idx);
    d.setAttribute('data-side', side);
    let img = document.createElement('img');
    img.className = (side=="hero"?"hero-img":"mon-img");
    img.src = `img/char/${c.img}`;
    img.alt = c.name;
    d.appendChild(img);
    d.appendChild(divCls('name', c.name));
    // HP BAR
    let statbar = document.createElement('div');
    statbar.className = 'statbar';
    let hpfill = document.createElement('div');
    hpfill.className = 'hp-fill';
    let hpPer = Math.max(0, Math.min(1, c.currHp / c.hp));
    hpfill.style.width = (hpPer * 100) + "%";
    statbar.appendChild(hpfill);
    d.appendChild(statbar);
    // buffer and debuff icons
    let statIcons = document.createElement('div');
    statIcons.className = 'stat-icons';
    (c.buffs||[]).forEach(b => statIcons.appendChild(iconForStatus(b,"buff")));
    (c.debuffs||[]).forEach(b => statIcons.appendChild(iconForStatus(b,"debuff")));
    d.appendChild(statIcons);
    d.appendChild(divCls('', `HP ${Math.floor(c.currHp)}/${c.hp} SPD:${c.spd}`, {fontSize:".82em"}));
    return d;
}
function divCls(cls, txt, styleObj) {
    let d = document.createElement('div');
    if (cls) d.className = cls;
    d.innerText = txt;
    if (styleObj) Object.assign(d.style, styleObj);
    return d;
}
function iconForStatus(stat, type) {
    let e = document.createElement('div');
    e.className = 'stat-icon '+type;
    e.innerHTML = getStatEmoji(stat.type);
    e.title = (stat.type||"").toUpperCase()+(stat.turn?(" ("+stat.turn+"T)"):"");
    if (stat.turn && stat.turn > 0) {
        let lbl = document.createElement('small');
        lbl.style = "position:absolute;font-size:.79em;font-weight:bold;right:2px;bottom:1px;color:"+ (type=="buff"?"#42fcc1":"#ffc3a3");
        lbl.innerText = stat.turn;
        e.appendChild(lbl);
    }
    let tt = document.createElement('span');
    tt.className = 'tooltip';
    tt.innerText = statDesc(stat.type,type,stat);
    e.appendChild(tt);
    return e;
}
function statDesc(type, side, details) {
    // Short desc
    const lib = {def_break: 'DEF↓',def_up:'DEF↑',stun:'Stun',poison:'Poison',burn:'Burn',heal_ot:'HoT',spd_up:'SPD↑',spd_down:'SPD↓',immune:'Immune',silence:'Silence'};
    return (lib[type]||type) + (details.turn?(" ("+details.turn+" turn)"):"");
}
function getStatEmoji(t) {
    return {def_break:"🛠️",def_up:"🛡️",stun:"💫",heal_ot:"💚",poison:"☠️",burn:"🔥",spd_up:"💨",spd_down:"🐢",immune:"🔒",silence:"🔇"}[t] || "✨";
}

// ----------------- SHOW DAMAGE / HEAL popups -----------------
window.showDamage = function(idx, side, value, color='#ff5656') {
    let dom = document.getElementById(`${side}${idx}`);
    if (!dom) return;
    let pop = document.createElement('span');
    pop.className = 'damage-popup';
    pop.innerText = (value < 0 ? "+" : "-") + Math.abs(value);
    pop.style.color = color;
    dom.appendChild(pop);
    setTimeout(()=>pop.remove(), 900);
};

// ----------------- AUTO SPD BAR LOOP & TURNS -----------------
async function startBattle() {
    if (Battle.running) return; Battle.running = true; Battle.auto = true;
    async function loop() {
        while (Battle.running) {
            for (let i=0;i<Battle.spdBar.length;i++) {
                let bar = Battle.spdBar[i];
                if (bar.dead) continue;
                let charArr = (bar.side=="hero"?Battle.heroes:Battle.monsters);
                let char = charArr[bar.idx];
                // Process buffs/debuffs/HoT, before charge
                if (window.effectEngine?.processStatusTurn) window.effectEngine.processStatusTurn(char);
                if (char.currHp <= 0) { char.alive = false; bar.dead = true; continue; }
                if (window.effectEngine?.isStunnedOrSkipped?.(char)) {
                    bar.cooldowns.forEach((v, i, arr) => {if(arr[i]>0) arr[i]--;});
                    continue;
                }
                // Increase SPD
                bar.charge += spdChargeCurrent(bar);
                if (bar.charge >= CONFIG.SPD_MAX) {
                    bar.charge = 0;
                    await runTurn(bar);
                    renderBattlefield();
                    break; // pause, rerun
                }
            }
            checkBattleResult();
            renderBattlefield();
            await (window.animationEngine?.sleep ? window.animationEngine.sleep(CONFIG.SPD_FRAME) : new Promise(r=>setTimeout(r,CONFIG.SPD_FRAME)));
        }
    }
    loop();
}
function spdChargeCurrent(bar) {
    let spd = bar.spd, up=1.0;
    if (bar.buffs?.some(b => b.type=="spd_up")) up+=.3;
    if (bar.debuffs?.some(b => b.type=="spd_down")) up-=.3;
    return spd/10*up;
}
async function runTurn(bar) {
    let team = (bar.side=="hero"?Battle.heroes:Battle.monsters);
    let enemy = (bar.side=="hero"?Battle.monsters:Battle.heroes);
    let char = team[bar.idx];
    if (window.effectEngine?.processStatusTurn) window.effectEngine.processStatusTurn(char);
    if (window.effectEngine?.isStunnedOrSkipped?.(char)) {
        bar.cooldowns.forEach((v,i,arr)=>{if(arr[i]>0) arr[i]--;});
        return;
    }
    if (!char.alive) return;
    // AI pick skill+target
    let skill = window.aiPickSkill ? window.aiPickSkill(char, bar.cooldowns, team, enemy) : pickSkillFallback(char,bar);
    let targets = [];
    if (skill.type==="attack" && (skill.multiplier > 1.2 || skill.type==='aoe')) targets = enemy.filter(e=>e.alive);
    else if (skill.type==="attack") targets = [pickTargetFallback(enemy, skill)];
    else if (skill.type==="buff") targets = team.filter(c=>c.alive);
    else if (skill.type==="heal") targets = [pickTargetFallback(team, skill)];
    targets = (targets||[]).filter(Boolean);
    // Animation
    if (window.animationEngine) {
        if (skill.type==="attack" && targets[0]) {
            let ti = enemy.indexOf(targets[0]);
            await window.animationEngine.animateAttackCard(bar.idx, ti, bar.side, bar.side=="hero"?"mon":"hero");
        }
        if ((skill.type==="attack" && skill.multiplier>1.2 && targets.length>1) || skill.type==="aoe") {
            let tiarr = targets.map(t=>enemy.indexOf(t));
            await window.animationEngine.animateAoEAttack(bar.idx, bar.side, bar.side=="hero"?"mon":"hero", tiarr);
        }
        if (skill.type==="heal") await window.animationEngine.animateHeal(bar.idx, bar.side);
        if (skill.type==="buff") await window.animationEngine.animateBuffDebuff(bar.idx, bar.side, "buff");
    }
    // Apply skill
    await doSkillNew(char, skill, targets, bar.side);
    // Cooldown
    if (skill.cooldown) bar.cooldowns[char.skills.findIndex(s=>s.id==skill.id)] = skill.cooldown+1;
    bar.cooldowns.forEach((v,i,arr)=>{if(arr[i]>0) arr[i]--;});
}
function pickSkillFallback(char,bar) {
    let order = [2,1,0];
    for (let i of order) if (char.skills?.[i] && bar.cooldowns[i]<=0) return char.skills[i];
    return char.skills?.[0];
}
function pickTargetFallback(arr,skill) {
    arr = arr.filter(c=>c.alive);
    if (skill?.type==="heal") return arr.sort((a,b)=>a.currHp/a.hp-b.currHp/b.hp)[0];
    return arr.sort((a,b)=>a.currHp-b.currHp)[0];
}

// ----------------- APPLY SKILL -----------------
async function doSkillNew(user, skill, targets, side) {
    if (!targets) return;
    for (let t of targets) {
        if (!t.alive) continue;
        // Heal
        if (skill.type=="heal") {
            let val = Math.floor(user.atk*0.7 + user.level*1.5);
            t.currHp = Math.min(t.hp, t.currHp + val);
            window.showDamage?.(t.index, t.side, -val, "#59f495"); // heal popup
            t.alive = t.currHp > 0;
            continue;
        }
        // Buff
        if (skill.type=="buff" && skill.effect?.buff)
        {
            window.effectEngine?.addEffect?.(t, skill.effect.buff, "buff");
            continue;
        }
        // Attack/AoE
        let dmg = Math.floor(user.atk * (skill.multiplier||1) * (1 + (user.crit_rate||0)/100));
        let defReduce = t.debuffs?.some(d=>d.type=="def_break") ? 1.4 : 1;
        let defVal = t.def*defReduce;
        dmg = Math.max(Math.floor(dmg - defVal/3), 1);
        if (Math.random()*100 < (user.crit_rate||0)) dmg = Math.floor(dmg * ((user.crit_dmg||150)/100));
        t.currHp = Math.max(0, t.currHp - dmg);
        t.alive = t.currHp > 0;
        window.showDamage?.(t.index, t.side, dmg, "#ff5656");
        // Debuff
        if (skill.effect?.debuff) {
            window.effectEngine?.addEffect?.(t, skill.effect.debuff, "debuff");
        }
        // Passive: onDamaged
        if (window.passiveEngine?.trigger) window.passiveEngine.trigger("onDamaged", t, {attacker:user,skill});
    }
}

// ----------------- RESULT CHECK ----------------
function checkBattleResult() {
    let aliveH = Battle.heroes.some(c=>c.alive);
    let aliveM = Battle.monsters.some(c=>c.alive);
    if (!aliveH || !aliveM) {
        Battle.running = false;
        showBattleResultPop(aliveH ? "win" : "lose");
    }
}
function showBattleResultPop(state) {
    if (window.renderBattleResult)
        window.renderBattleResult({ state });
    else setTimeout(()=>{
        openPopup('battleResult', {
            state
        });
    },800);
}

// ----------- DOM STARTUP: START/RENDER -----------
document.addEventListener('DOMContentLoaded', ()=>{
    let btn = document.getElementById('btnStartAuto');
    if (btn) btn.onclick = async()=>{
        Battle.auto = true;
        await loadBattleTeams();
        initSpdBar();
        renderBattlefield();
        startBattle();
    };
    if(document.getElementById('mainBattlefield') && !document.getElementById('mainBattlefield').classList.contains('hide')) {
        loadBattleTeams().then(()=>{
            initSpdBar();
            renderBattlefield();
        });
    }
});

// ----------- HELPER: deepcopy for char/monster -----------
function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }

// ----------- EXPORT Global API -----------
window.battleEngine = {
    loadBattleTeams, initSpdBar, renderBattlefield, startBattle,
    get heroes() { return Battle.heroes; },
    get monsters() { return Battle.monsters; },
    get speedBars() { return Battle.spdBar; }
};