/**
 * js/battle.js
 * Epic Seven Card Auto Battle Main Engine (Frontend 100%)
 * Full Modular, Responsive, AI, Animation, CD, Buff/Debuff, WIN/LOSE Result
 * By (yourname)
 */

/* ------------------ Config & State ------------------ */
const SPD_BAR_MAX = 100;    // SPD bar เต็ม
const SPD_FRAME = 120;      // ms ต่อ tick
const MAX_TEAM = 4, MAX_MON = 4;

let heroes = [];      // ฝั่งผู้เล่น (heroes: [{...}])
let monsters = [];    // ฝั่งศัตรู (monsters: [{...}])
let speedBars = [];   // SPD bar + Buff/Debuff refs
let autoOn = false;
let isBattling = false;

/* ------------------ 1. LOAD TEAM & ENEMY ------------------ */
async function loadBattleTeams() {
    // Load User Team
    let t = localStorage.getItem('userTeam');
    let myTeam = t ? JSON.parse(t) : [];
    heroes = [];
    for (let id of myTeam) {
        if (!id) continue;
        let c = await fetch(`data/char/${id}.json`).then(r => r.json());
        heroes.push({
            ...deepCopy(c),
            currHp: c.hp,
            alive: true,
            buffs: [],
            debuffs: [],
            cooldowns: Array((c.skills || []).length).fill(0)
        });
    }
    // Load Monsters (Mock: slime_basic N ตัว)
    monsters = [];
    for (let i = 0; i < MAX_MON; i++) {
        let c = await fetch(`data/char/slime_basic.json`).then(r => r.json());
        monsters.push({
            ...deepCopy(c),
            id: c.id + '_' + (i+1),
            currHp: c.hp,
            alive: true,
            buffs: [],
            debuffs: [],
            cooldowns: Array((c.skills || []).length).fill(0)
        });
    }
}

/* ------------------ 2. SPD BAR INIT ------------------ */
function initSpdBar() {
    speedBars = [];
    heroes.forEach((c, i) => {
        speedBars.push(makeSpeedObj(c, i, 'hero'));
        c.index = i; c.side = 'hero'; // Weak ref.
    });
    monsters.forEach((c, i) => {
        speedBars.push(makeSpeedObj(c, i, 'mon'));
        c.index = i; c.side = 'mon';
    });
}
function makeSpeedObj(c, i, side) {
    return {
        id: `${side}${i}`,
        side,
        name: c.name,
        spd: c.spd,
        charge: 0,
        dead: false,
        index: i,
        cooldowns: c.cooldowns,
        buffs: c.buffs,
        debuffs: c.debuffs
    };
}

/* ------------------ 3. RENDER FIELD ------------------ */
function renderBattlefield() {
    const heroRow = document.querySelector('.card-row.user');
    heroRow.innerHTML = '';
    heroes.forEach((c, idx) => {
        heroRow.appendChild(renderCard(c, idx, 'hero'));
    });
    const monRow = document.querySelector('.card-row.monster');
    monRow.innerHTML = '';
    monsters.forEach((c, idx) => {
        monRow.appendChild(renderCard(c, idx, 'mon'));
    });
    // SPD Bars
    const spdDiv = document.querySelector('.spd-bar-container');
    spdDiv.innerHTML = '';
    speedBars.forEach(bar => {
        let barWrap = document.createElement('div');
        barWrap.className = 'spd-bar';
        barWrap.title = `[${bar.side === 'hero' ? 'ทีมเรา':'ศัตรู'}] ${bar.name} SPD:${bar.spd}`;
        let fill = document.createElement('div');
        fill.className = 'spd-bar-fill';
        fill.style.width = Math.floor(Math.min(bar.charge, SPD_BAR_MAX)/SPD_BAR_MAX*100) + '%';
        barWrap.appendChild(fill);
        spdDiv.appendChild(barWrap);
    });
}

/* ------------------ CARD DISPLAY utils ------------------ */
function renderCard(c, idx, side='hero') {
    let d = document.createElement('div');
    d.className = 'card'; d.id = `${side}${idx}`;
    d.setAttribute('data-idx', idx);
    d.setAttribute('data-side', side);

    // Image
    let img = document.createElement('img');
    img.className = side == 'hero' ? 'hero-img' : 'mon-img';
    img.src = `img/char/${c.img}`;
    img.alt = c.name;
    d.appendChild(img);
    // Name
    d.appendChild(createDiv('name', c.name));

    // HP BAR
    let statbar = document.createElement('div');
    statbar.className = 'statbar';
    let hpfill = document.createElement('div');
    hpfill.className = 'hp-fill';
    let hppercent = Math.max(0, Math.min(1, c.currHp/c.hp));
    hpfill.style.width = (hppercent*100) + '%';
    statbar.appendChild(hpfill);
    d.appendChild(statbar);

    // Buff/Debuff
    let statIcons = document.createElement('div');
    statIcons.className = 'stat-icons';
    (c.buffs||[]).forEach(b => statIcons.appendChild(renderStatusIcon(b, 'buff')));
    (c.debuffs||[]).forEach(dbb => statIcons.appendChild(renderStatusIcon(dbb, 'debuff')));
    d.appendChild(statIcons);

    d.appendChild(createDiv('', `HP ${Math.floor(c.currHp)}/${c.hp} SPD:${c.spd}`, {fontSize: ".82em"}));
    return d;
}

function createDiv(cn, txt, styleObj) {
    let d = document.createElement("div");
    if (cn) d.className = cn; d.innerText = txt;
    if (styleObj) Object.assign(d.style, styleObj);
    return d;
}

function renderStatusIcon(stat, type='buff') {
    let e = document.createElement('div');
    e.className = 'stat-icon '+type;
    e.innerHTML = getIcon(stat.type) ;
    e.title = stat.type.toUpperCase() + (stat.turn?" ("+stat.turn+"T)":"");
    let tt = document.createElement('span');
    tt.className = 'tooltip';
    tt.innerText = statusTooltip(stat.type, type, stat);
    e.appendChild(tt);
    if (stat.turn && stat.turn>0) {
        let lbl = document.createElement('small');
        Object.assign(lbl.style,{
            position:'absolute', fontSize:'.79em', fontWeight:'bold',
            right:'2px', bottom:'1px', color: type==='buff'?'#42fcc1':'#ffc3a3'
        });
        lbl.innerText = stat.turn; e.appendChild(lbl);
    }
    return e;
}
function statusTooltip(type, side, details) {
    const lib = {
        'def_break':'DEF ลดลง รับดาเมจเพิ่ม','def_up':'DEF เพิ่มขึ้น',
        'stun':'ติดสถานะมึน, ข้ามเทิร์น','poison':'โดนพิษ (ลดเลือด)',
        'burn':'เผาไฟ (ลดเลือดหนัก)','heal_ot':'ฟื้นฟูต่อเนื่อง',
        'spd_up':'SPD เพิ่มขึ้น','spd_down':'SPD ลดลง',
        'immune':'กันดีบัฟ','silence':'ใบ้ (ใช้สกิลไม่ได้)',
    };
    return (lib[type]||type)+((details.turn)?" ("+details.turn+" turn)":"");
}
function getIcon(type) {
    switch(type){
        case "def_break":return "🛠️"; case "def_up":return "🛡️";
        case "stun":return "💫"; case "heal_ot":return "💚";
        case "poison":return "☠️"; case "burn":return "🔥";
        case "spd_up":return "💨"; case "spd_down":return "🐢";
        case "immune":return "🔒"; case "silence":return "🔇";
        default:return "✨";
    }
}

// Window-wide Damage popup (as UI Function)
window.showDamage = function(idx, side, dmg, color='#ff5656') {
    let c = document.getElementById(`${side}${idx}`);
    if (!c) return;
    let dPop = document.createElement('span');
    dPop.className = 'damage-popup';
    dPop.innerText = (dmg<0?"+":"-")+Math.abs(dmg);
    dPop.style.color=color;
    c.appendChild(dPop);
    setTimeout(()=>{ dPop.remove(); }, 700);
};

/* ------------------ 4. SPD BAR LOOP & TURN SYSTEM------------------ */
function startBattle() {
    if (isBattling) return; isBattling = true; autoOn = true;
    async function battleLoop(){
        while(isBattling){
            for(let bar of speedBars){
                if(bar.dead) continue;
                // Refs
                let charArr = bar.side=='hero' ? heroes : monsters;
                let charPtr = charArr[bar.index];
                // 1. Process Buff/Debuff countdown&effects (HoT/Poison)
                window.effectEngine?.processStatusTurn?.(charPtr);
                if(charPtr.currHp<=0){ charPtr.alive=false; bar.dead=true; continue; }
                if(window.effectEngine?.isStunnedOrSkipped?.(charPtr)){
                    bar.cooldowns.forEach((v,i,arr)=>{ if(arr[i]>0) arr[i]--; });
                    continue;
                }
                if(!charPtr.alive) continue;
                // SPD charge
                bar.charge += getSpdCharge(bar);
                if(bar.charge >= SPD_BAR_MAX){
                    bar.charge = 0;
                    await doTurn(bar); // AI turn+animate+action
                    renderBattlefield(); // Render after turn
                    break; // sync (1 at a time)
                }
            }
            checkBattleResult();
            renderBattlefield();
            await (window.animationEngine?.sleep ?
                window.animationEngine.sleep(SPD_FRAME) :
                new Promise(r=>setTimeout(r, SPD_FRAME)));
        }
    }
    battleLoop();
}
function getSpdCharge(bar){
    let spdVal = bar.spd;
    let bonus = 1.0;
    if(bar.buffs?.some(b=>b.type=="spd_up")) bonus += 0.3;
    if(bar.debuffs?.some(b=>b.type=="spd_down")) bonus -= 0.3;
    return spdVal/10 * bonus;
}

/* ------------------ 5. TURN: AI เลือกเป้าหมาย/สกิล & Animation ------------------ */
async function doTurn(bar){
    let charArr = bar.side=='hero'?heroes:monsters;
    let oppArr = bar.side=='hero'?monsters:heroes;
    let idx = bar.index;
    let charPtr = charArr[idx];

    window.effectEngine?.processStatusTurn?.(charPtr);
    if(window.effectEngine?.isStunnedOrSkipped?.(charPtr)){
        bar.cooldowns.forEach((v,i,arr)=>{ if(arr[i]>0) arr[i]--; });
        return;
    }
    if(!charPtr.alive) return;

    // --- PICK SKILL (AI) ---
    let skill = window.aiPickSkill ? window.aiPickSkill(charPtr, bar.cooldowns, charArr, oppArr) : pickSkill(charPtr, bar);

    // --- PICK TARGET
    let targets = [];
    if(skill.type==='attack')
        targets = [window.aiPickTarget ? window.aiPickTarget(oppArr, skill) : aiPickTarget(oppArr, skill)];
    else if(skill.type==='buff')
        targets = charArr.filter(c=>c.alive);
    else if(skill.type==='heal')
        targets = [window.aiPickTarget ? window.aiPickTarget(charArr, skill) : aiPickTarget(charArr, skill)];
    else if(skill.type==='aoe' || (skill.type==='attack' && skill.multiplier>1.2)) // AoE
        targets = oppArr.filter(o=>o.alive);
    else
        targets = [window.aiPickTarget ? window.aiPickTarget(oppArr, skill) : aiPickTarget(oppArr, skill)];
    targets = targets.filter(Boolean);

    // --- Animation Section ---
    // Card slide / AOE / Buff / Heal
    if(skill.type==='attack' && targets[0]){
        let tidx = oppArr.indexOf(targets[0]);
        await window.animationEngine?.animateAttackCard?.(idx, tidx, bar.side, bar.side==='hero'?'mon':'hero');
    }
    if((skill.type==='aoe' || (skill.type==='attack' && skill.multiplier>1.2 && targets.length>1))) {
        let tgtIdxArr = targets.map(t=>oppArr.indexOf(t));
        await window.animationEngine?.animateAoEAttack?.(idx, bar.side, bar.side==='hero'?'mon':'hero', tgtIdxArr);
    }
    if(skill.type==='heal'){
        await window.animationEngine?.animateHeal?.(idx, bar.side);
    }
    if(skill.type==='buff'){
        await window.animationEngine?.animateBuffDebuff?.(idx, bar.side, "buff");
    }

    // --- APPLY SKILL ---
    await doSkill(charPtr, skill, targets, bar.side);

    // --- Increase Cooldown ---
    if(skill.cooldown)
        bar.cooldowns[charPtr.skills.findIndex(s=>s.id==skill.id)] = skill.cooldown+1;
    bar.cooldowns.forEach((v,i,arr)=>{ if(arr[i]>0) arr[i]--; });
}

// Fallback PickSkill, PickTarget ถ้าไม่มี ai.js
function pickSkill(char, bar){
    let order = [2,1,0];
    for(let i of order){
        if(!char.skills[i]) continue;
        if(bar.cooldowns[i]<=0) return char.skills[i];
    }
    return char.skills[0];
}
function aiPickTarget(arr, skill=null){
    // Heal: lowest HP, Buff: first, Default: hp lowest enemy
    arr = arr.filter(c=>c.alive);
    if(skill && skill.type==="heal")
        return arr.sort((a,b)=>a.currHp/a.hp - b.currHp/b.hp)[0];
    if(skill && skill.type==="buff") return arr[0];
    return arr.sort((a,b)=>a.currHp - b.currHp)[0];
}

/* ------------------ 6. Apply Damage/Effect ------------------ */
async function doSkill(source, skill, targets, sourceSide){
    if(!targets) return;
    for(let t of targets){
        if(!t.alive) continue;
        if(skill.type=="heal"){
            let healVal = Math.floor(source.atk * 0.7 + source.level * 1.5);
            t.currHp = Math.min(t.hp, t.currHp + healVal);
            window.showDamage?.(t.index, t.side, -healVal, '#59f495');
            t.alive = t.currHp>0;
            continue;
        }
        if(skill.type=="buff" && skill.effect && skill.effect.buff){
            window.effectEngine?.addEffect(t, skill.effect.buff, "buff");
            continue;
        }
        // Attack / AoE
        let dmg = Math.floor(source.atk * (skill.multiplier || 1) * (1 + (source.crit_rate || 0) / 100));
        let defReduce = t.debuffs?.some(d=>d.type=="def_break") ? 1.4 : 1;
        let defVal = t.def * defReduce;
        dmg = Math.max(Math.floor(dmg - defVal/3), 1);
        if(Math.random()*100 < (source.crit_rate||0)) dmg = Math.floor(dmg*((source.crit_dmg||150)/100));

        t.currHp = Math.max(0, t.currHp - dmg);
        t.alive = t.currHp>0;
        if(t.currHp<=0) t.alive = false;
        window.showDamage?.(t.index, t.side, dmg, '#ff5656');
        // Debuff
        if(skill.effect?.debuff) {
            window.effectEngine?.addEffect(t, skill.effect.debuff, "debuff");
        }
        // TODO: Cleanse, Remove buff/debuff future
    }
}

/* ------------------ 7. RESULT ------------------ */
function checkBattleResult(){
    let mySurvive = heroes.some(c=>c.alive);
    let monSurvive = monsters.some(c=>c.alive);
    if(!mySurvive || !monSurvive){
        isBattling = false;
        showBattleResult(mySurvive ? 'win' : 'lose');
    }
}
function showBattleResult(state){
    // ใช้ popupManager ถ้ามี (หรือ renderBattleResult)
    if(window.renderBattleResult){
        window.renderBattleResult({state});
    }else{
        setTimeout(()=>{
            openPopup('battleResult', {state});
        },800);
    }
}

/* ------------------ 8. INIT (START) ------------------ */
document.addEventListener('DOMContentLoaded', ()=>{
    const btnStartAuto = document.getElementById('btnStartAuto');
    if(btnStartAuto)
        btnStartAuto.onclick = async ()=>{
            autoOn = true;
            await loadBattleTeams();
            initSpdBar();
            renderBattlefield();
            startBattle();
        };
    // if battlefield already open
    if(document.getElementById('mainBattlefield') && 
            !document.getElementById('mainBattlefield').classList.contains('hide')) {
        loadBattleTeams().then(() => {
            initSpdBar();
            renderBattlefield();
        });
    }
});

/* ------------------ 9. Utilities ------------------ */
function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/* 
   สำหรับ Dev/Test หรือการเชื่อม UI 
   - สามารถรีเซ็ตสถานะ/ทีมใหม่, หรือเพิ่มปุ่ม debug ได้
*/

/* ------------------ 10. Export Global ฟังก์ชัน (ถ้าต้องใช้) ------------------ */
window.battleEngine = {
    loadBattleTeams, initSpdBar, renderBattlefield, startBattle, heroes, monsters, speedBars
};

/* ------------------ Custom BattleResult Popup (แสดงผล) ------------------ */
(function () {
    const origRenderPopup = window.renderPopup;
    window.renderPopup = function(type, data) {
        if(type === "battleResult") {
            return `<div class="popup large"><button class="close" onclick="closePopup()">×</button>
                <h2>ผลลัพธ์การต่อสู้</h2>
                <div style="font-size:2em;text-align:center;margin-bottom:12px;">
                  ${data.state === "win" ? "🏆 <b style='color:#54e0be'>ชนะ!</b>" : "❌ <b style='color:#f47'>แพ้</b>"}
                </div>
                <button class="primary-btn" onclick="closePopup()">โอเค</button>
            </div>`;
        }
        return origRenderPopup(type, data);
    };
})();

/* 
 หมายเหตุ:
 - หากจะเชื่อมผลลัพธ์จริง (EXP, ดรอป, เลเวลอัพ) ใช้ window.renderBattleResult จาก result.js แทน
 - หากไม่มีให้ fallback popup นี้ได้เลย
*/