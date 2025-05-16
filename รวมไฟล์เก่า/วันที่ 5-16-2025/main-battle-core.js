// main-battle-core.js -- เวอร์ชั่นแก้ไข (no NaN bug, ทุกตัวละครและศัตรูมี maxHp/atk/skills แน่นอน)
// ทุกบรรทัดมีอธิบายภาษาไทยเพื่อการเรียนรู้!

// อัปเดตฟังก์ชัน getRandomEnemyTeam ให้ ensure field "maxHp", "atk", "skills", "equipSlots" ครบ
window.getRandomEnemyTeam = function() {
  // สุ่มตัวละครจาก pool เดิม window.characters (4 ตัวที่ไม่ซ้ำ)
  let chosen = [];
  let pool = [...window.characters];
  while (chosen.length < 4 && pool.length > 0) {
    let idx = Math.floor(Math.random() * pool.length);
    // Create a deep copy to avoid reference bugs
    let origin = pool[idx];
    let char = JSON.parse(JSON.stringify(origin));
    // Ensure all properties exist (สำคัญมาก)
    char.maxHp = char.maxHp || char.hp || 100;
    char.currentHp = char.maxHp;
    char.hp = undefined; // ไม่ใช้แล้ว
    char.atk = char.atk || 30;
    char.skills = char.skills || (char.skill ? [{
      name: char.skill,
      type: "damage",
      power: 1.0,
      effect: {},
      desc: char.skill
    }] : [{
      name: "โจมตีธรรมดา",
      type: "damage",
      power: 1.0,
      effect: {},
      desc: ""
    }]);
    // ส่งค่า equipSlots ให้มีครบ 2 ช่อง
    char.equipSlots = Array.isArray(char.equipSlots) ? char.equipSlots.slice() : [null, null];
    chosen.push(char);
    pool.splice(idx, 1); // Remove to prevent dup
  }
  return chosen;
};

// main-battle-core.js -- ล่าสุด (ป้องกัน bug ค่าศัตรูซ้ำ user) [TH]

// getFinalStatWithEquip: ป้องกัน bug ชื่อซ้ำ user/monster
window.getFinalStatWithEquip = function(charIdx, baseOverride = null) {
  // ใช้ baseOverride (กรณี monster) โดยตรง
  const base = baseOverride || window.characters[charIdx];
  // ถ้าเป็นมอนสเตอร์ (มี flag isMonster)
  if (base.isMonster) {
    return {
      maxHp: base.maxHp,
      atk: base.atk,
      def: base.def || 0,
      spd: base.spd || 0,
      heal: base.heal || 0
    };
  }
  // ถ้าเป็น user
  let stat = {
    maxHp: base.maxHp || 100,
    atk: base.atk || 30,
    def: base.def || 0,
    spd: base.spd || 0,
    heal: base.heal || 0, 
  };
  if(base && Array.isArray(base.equipSlots)) {
    base.equipSlots.forEach(equipId => {
      if (!equipId) return;
      let eq = window.equipInventory ? window.equipInventory.find(x => x.id === equipId) : null;
      if (!eq) return;
      for (let k in eq.mainStat) stat[k] = (stat[k] || 0) + eq.mainStat[k];
      for (let k in eq.bonus) stat[k] = (stat[k] || 0) + eq.bonus[k];
    });
  }
  return stat;
};

// ฟังก์ชัน Render Player/Enemy Team (ไม่มี NaN)
window.renderPlayerTeam = function(state = null) {
  gamedom.playerTeam.innerHTML = "";
  window.playerTeam.forEach((idx, i) => {
    let c = (state ? state.player[i] : window.characters[idx]);
    let stat = window.getFinalStatWithEquip(idx, c);
    let currHP = (state ? c.currentHp : stat.maxHp);
    let equipsTxt = '';
    if (c.equipSlots) {
      equipsTxt = '<div style="margin-top:2px;font-size:0.93em">';
      c.equipSlots.forEach((eqId, slot) => {
        if (!eqId) equipsTxt += `[${slot + 1}] <span style="opacity:0.6">ว่าง</span> `;
        else {
          let eqObj = window.equipInventory ? window.equipInventory.find(x => x.id === eqId) : null;
          equipsTxt += `[${slot + 1}] <span style="color:#53f">${eqObj ? eqObj.name : "??"}</span> `;
        }
      });
      equipsTxt += '</div>';
    }
    // แสดงสถานะ/บัพ/ดีบัพ
    let statusTxt = "";
    if (c.status && c.status.length > 0) {
      statusTxt = '<div style="margin-top:4px;font-size:0.9em;">';
      c.status.forEach(s => {
        let color = "#aaa";
        if (s.type === "stun") color = "#fdc300";
        if (s.type === "healOverTime" || s.type === "healOverTimeSingle") color = "#57ffa5";
        if (s.type === "burn") color = "#e85656";
        if (s.type === "atkUp") color = "#f8f";
        if (s.type === "atkDown") color = "#ccc";
        if (s.type === "defenseDown") color = "#17ffc1";
        statusTxt += `<span style="color:${color};margin-right:5px;">${s.type}(${s.remain})</span>`;
      });
      statusTxt += '</div>';
    }
    // exp/level
    let expBar = "";
    if (c.level) {
      let exp = c.exp ?? 0, lvl = c.level, maxLv = c.maxLevel ?? 20;
      let nextLvExp = lvl * 40;
      expBar = `<div style="height:6px;background:#222;border-radius:3px;"><div style="background:#36f;height:6px;width:${Math.min(100,exp/nextLvExp*100)}%;border-radius:3px;"></div></div>
<span style="font-size:0.93em;">Lv.${lvl} | EXP: ${exp}/${nextLvExp}</span><br>`;
    }
    gamedom.playerTeam.innerHTML += `
      <div class="unit-card${currHP <= 0 ? ' dead' : ''}">
        <strong>${c.name}</strong><br>
        ${expBar}
        <div class="hp-bar">
          <div class="hp-bar-inner" style="width:${Math.max(0, currHP / stat.maxHp * 100)}%"></div>
        </div>
        <span>HP: ${Math.max(0, currHP)} / ${stat.maxHp}</span>
        <br><span>Atk: ${stat.atk}</span>
        <br><span style="font-size:0.93em">Skill: ${c.skills && c.skills[0] ? c.skills[0].name : ""}</span>
        ${equipsTxt}
        ${statusTxt}
      </div>
    `;
  });
};

window.renderEnemyTeam = function(state = null) {
  gamedom.enemyTeam.innerHTML = "";
  window.enemyTeam.forEach((char, i) => {
    let c = state ? state.enemy[i] : char;
    let idx = window.characters.findIndex(x => x.name === c.name);
    let stat = window.getFinalStatWithEquip(idx, c);
    let currHP = state ? c.currentHp : stat.maxHp;
    let statusTxt = '';
    if (c.status && c.status.length > 0) {
      statusTxt = '<div style="margin-top:4px;font-size:0.9em;">';
      c.status.forEach(s => {
        let color = "#aaa";
        if (s.type === "stun") color = "#fdc300";
        if (s.type === "healOverTime" || s.type === "healOverTimeSingle") color = "#57ffa5";
        if (s.type === "burn") color = "#e85656";
        if (s.type === "atkUp") color = "#f8f";
        if (s.type === "atkDown") color = "#ccc";
        if (s.type === "defenseDown") color = "#17ffc1";
        statusTxt += `<span style="color:${color};margin-right:5px;">${s.type}(${s.remain})</span>`;
      });
      statusTxt += '</div>';
    }
    gamedom.enemyTeam.innerHTML += `
      <div class="unit-card${currHP <= 0 ? ' dead' : ''}">
        <strong>${c.name}</strong>
        <div class="hp-bar">
          <div class="hp-bar-inner" style="width:${Math.max(0, currHP / stat.maxHp * 100)}%"></div>
        </div>
        <span>HP: ${Math.max(0, currHP)} / ${stat.maxHp}</span>
        <br><span>Atk: ${stat.atk}</span>
        <br><span style="font-size:0.93em">Skill: ${c.skills && c.skills[0] ? c.skills[0].name : ""}</span>
        ${statusTxt}
      </div>
    `;
  });
};

// ฟังก์ชันเริ่มต้นต่อสู้ (startBattle) ใช้มาตรฐานเดียวกัน
window.startBattle = function () {
  window.enemyTeam = window.getRandomEnemyTeam();
  let state = {
    player: window.playerTeam.map(idx => {
      let c = JSON.parse(JSON.stringify(window.characters[idx]));
      c.status = [];
      c.currentHp = window.getFinalStatWithEquip(idx, c).maxHp;
      c.shieldPoint = 0;
      return c;
    }),
    enemy: window.enemyTeam.map((c, i) => {
      let idx = window.characters.findIndex(x => x.name === c.name);
      let base = (idx !== -1) ? JSON.parse(JSON.stringify(window.characters[idx])) : JSON.parse(JSON.stringify(c));
      base.status = [];
      base.currentHp = window.getFinalStatWithEquip(idx, base).maxHp;
      base.shieldPoint = 0;
      return base;
    })
  };
  let turn = 1, log = [];
  window.gamedom.log.innerHTML = "";

  function getAlive(t) {
    return t.filter(x => x.currentHp > 0);
  }
  let interval = setInterval(() => {
    let playerAlive = getAlive(state.player).length;
    let enemyAlive = getAlive(state.enemy).length;
    if (playerAlive === 0 || enemyAlive === 0) {
      clearInterval(interval);
      setTimeout(() => {
        if (playerAlive === 0 && enemyAlive === 0)
          window.gamedom.log.innerHTML += `<br><strong style="color:#fbc02d;">เสมอ!</strong>`;
        else if (playerAlive > 0)
          window.gamedom.log.innerHTML += `<br><strong style="color:#40ff5c;">คุณชนะ!</strong>`;
        else
          window.gamedom.log.innerHTML += `<br><strong style="color:#ff4444;">คุณแพ้!</strong>`;
        window.gamedom.startBtn.disabled = false;
      }, 500);
      return;
    }
    log.push(`<span style="color:#fdc300;">--- เทิร์น ${turn} ---</span>`);
    // --- ฝั่งผู้เล่น ---
    state.player.forEach((p, pi) => {
      if (p.currentHp <= 0) return;
      let skill = p.skills[0] || {type: "damage", name: "โจมตีธรรมดา", power: 1.0, effect: {}, desc: ""};
      window.useSkill(p, skill, state.player, state.enemy, log, pi, "player");
    });
    // --- ฝั่งศัตรู ---
    state.enemy.forEach((e, ei) => {
      if (e.currentHp <= 0) return;
      let skill = e.skills[0] || {type: "damage", name: "โจมตีธรรมดา", power: 1.0, effect: {}, desc: ""};
      window.useSkill(e, skill, state.enemy, state.player, log, ei, "enemy");
    });
    // --- apply buff/debuff ---
    if (window.applyTurnBuffDebuff) {
      window.applyTurnBuffDebuff(state.player, log);
      window.applyTurnBuffDebuff(state.enemy, log);
    }
    // --- status ลดเทิร์น ---
    if (window.reduceStatusTurns) {
      window.reduceStatusTurns(state.player);
      window.reduceStatusTurns(state.enemy);
    }
    window.renderPlayerTeam(state);
    window.renderEnemyTeam(state);
    window.gamedom.log.innerHTML = log.join('<br>');
    turn++;
  }, 1700);
  window.gamedom.startBtn.disabled = true;
};

// ตรวจสอบฟังก์ชันที่เรียก window.getRandomEnemyTeam และ window.startBattle แล้วใช้โค้ดนี้แทน

// *** END main-battle-core.js เวอร์ชั่นแก้ไข ***