// ================= Summoner x Epic Idle - battle-system.js ==================
// รองรับ auto-battle ระหว่าง playerTeam VS enemyTeam
// อิง window.characters / window.enemyTeam / window.playerTeam ที่มีอยู่แล้ว
// รองรับโหมด Arena (PvP), Adventure, ปกติ, และ callback หลังจบ (reward, event)

(function () {

// เช็คว่ามีการแก้ไข arena หรือกำลังแข่งอยู่ไหม
window._arenaBattleActive = window._arenaBattleActive || false;

// ================== ฟังก์ชันใช้สกิลสำหรับ 1 Unit ======================
window.useSkill = function(source, skill, teamSelf, teamEnemy, actLog, srcIdx = 0, teamType = "player") {
  // ข้าม turn ถ้าติด stun
  if (window.getStatus(source, "stun")) {
    actLog.push(`<span style="color:orange">${source.name} ติดสตัน ข้ามเทิร์น!</span>`);
    return;
  }

  // เลือกเป้าหมายแรกสุดที่ยังไม่ตาย
  let targetIdx = teamEnemy.findIndex(e => (e.currentHp > 0));
  if (targetIdx === -1) return; // ไม่มีเป้าหมาย (ศัตรูตายจนหมด)
  let target = teamEnemy[targetIdx];

  // Skill type: damage
  if (skill.type === "damage") {
    let atkVal = source.atk;
    if (window.getStatus(source, "atkUp")) atkVal = Math.floor(atkVal * 1.25);
    if (window.getStatus(source, "atkDown")) atkVal = Math.floor(atkVal * 0.78);

    let multi = skill.power || 1.0;
    if (window.getStatus(target, "defenseDown")) multi += 0.2;

    let dmg = Math.floor(atkVal * multi + Math.random() * 13);
    target.currentHp -= dmg;
    if (target.currentHp < 0) target.currentHp = 0;

    actLog.push(`<span style="color:#fdc300;">${source.name} ใช้สกิล ${skill.name} โจมตี ${target.name} ${dmg} dmg</span>`);

    // ผลสกิล (Burn, Stun, debuff)
    if (skill.effect) {
      for (const eff in skill.effect) {
        if (eff === "burn") {
          window.addStatus(target, "burn", skill.effect[eff]);
          actLog.push(`<span style="color:#fd3142;">${target.name} ติด Burn!</span>`);
        }
        if (eff === "stun") {
          window.addStatus(target, "stun", skill.effect[eff]);
          actLog.push(`<span style="color:#5146fd;">${target.name} ถูกสตัน!</span>`);
        }
        if (eff === "defenseDown") {
          window.addStatus(target, "defenseDown", skill.effect[eff]);
          actLog.push(`<span style="color:#17ffc1;">${target.name} พลังป้องกันลดลง!</span>`);
        }
        if (eff === "atkDown") {
          window.addStatus(target, "atkDown", skill.effect[eff]);
          actLog.push(`<span style="color:grey;">${target.name} พลังโจมตีลดลง!</span>`);
        }
      }
    }

    if (target.currentHp <= 0)
      actLog.push(`<span style="color:#fa6268;">${target.name} ถูกกำจัด!</span>`);
  }

  // Heal over time (ฮีลทีมทีละ 1 ตัว/เทิร์น)
  else if (skill.type === "heal-over-time-1") {
    let t = (skill.effect && skill.effect.healOverTimeSingle) || 2;
    teamSelf.forEach(u => window.addStatus(u, "healOverTimeSingle", t));
    actLog.push(`<span style="color:#57ffa5;">ทีมได้รับสถานะฟื้นฟู HP ต่อเนื่องทีละตัว/เทิร์น (${t} เทิร์น)</span>`);
  }
  // ... สามารถขยายสกิลประเภทอื่นที่นี่ ...
};

// ================== applyTurnBuffDebuff: ดำเนินการ dot-บัฟต่างๆ ท้ายเทิร์น ============
window.applyTurnBuffDebuff = function(team, log) {
  // Heal over time: เลือกคน HP ต่ำสุดที่มี Heal, Heal 8%+9
  let toHeal = team.reduce((lowest, unit) => {
    if (!unit.status) return lowest;
    if (unit.status.some(s => s.type === "healOverTimeSingle" && s.remain > 0)) {
      if (!lowest || unit.currentHp / unit.maxHp < lowest.currentHp / lowest.maxHp) return unit;
    }
    return lowest;
  }, null);

  if (toHeal) {
    let hot = Math.floor(toHeal.maxHp * 0.08) + 9;
    let before = toHeal.currentHp;
    toHeal.currentHp = Math.min(toHeal.currentHp + hot, toHeal.maxHp);
    let healed = toHeal.currentHp - before;
    log.push(`<span style="color:lime;">${toHeal.name} ฟื้น HP จาก Heal Over Time +${healed}</span>`);
  }

  // Burn: เสีย HP ตาม turn
  team.forEach(unit => {
    if (!unit.status) return;
    unit.status.forEach(s => {
      if (s.type === "burn" && unit.currentHp > 0) {
        let baseMaxHp = unit.maxHp || unit.maxHP || 1;
        let dot = Math.floor(baseMaxHp * 0.09) + 10;
        unit.currentHp -= dot;
        if (unit.currentHp < 0) unit.currentHp = 0;
        log.push(`<span style="color:#e85656;">${unit.name} ถูก Burn เสีย ${dot} HP!</span>`);
      }
    });
  });
};

// ================== renderTeam UI (Player/Enemy) พร้อม Status ====================
window.renderPlayerTeam = function(state = null) {
  window.gamedom.playerTeam.innerHTML = "";
  window.playerTeam.forEach((idx, i) => {
    const char = window.characters[idx];
    let c = state ? state.player[i] : char;
    let currHP = state ? c.currentHp : char.maxHp;
    let statusTxt = '';
    if (c.status && c.status.length > 0) {
      statusTxt = '<div style="margin-top:4px;font-size:0.9em;">';
      c.status.forEach(s => {
        let meta = window.statusMeta[s.type] || {};
        let color = meta.color || "#aaa";
        statusTxt += `<span style="color:${color};margin-right:5px;">${s.type}(${s.remain})</span>`;
      });
      statusTxt += '</div>';
    }
    window.gamedom.playerTeam.innerHTML += `
      <div class="unit-card${currHP <= 0 ? ' dead' : ''}">
        <strong>${char.name}</strong>
        <div class="hp-bar"><div class="hp-bar-inner" style="width:${Math.max(0, currHP / char.maxHp * 100)}%"></div></div>
        <span>HP: ${Math.max(0, currHP)} / ${char.maxHp}</span>
        <br><span>Atk: ${char.atk}</span>
        <br><span>Skill: ${char.skills[0].name}</span>
        ${statusTxt}
      </div>
    `;
  });
};

window.renderEnemyTeam = function(state = null) {
  window.gamedom.enemyTeam.innerHTML = "";
  window.enemyTeam.forEach((char, i) => {
    let c = state ? state.enemy[i] : char;
    let currHP = state ? c.currentHp : char.maxHp;
    let statusTxt = '';
    if (c.status && c.status.length > 0) {
      statusTxt = '<div style="margin-top:4px;font-size:0.9em;">';
      c.status.forEach(s => {
        let meta = window.statusMeta[s.type] || {};
        let color = meta.color || "#aaa";
        statusTxt += `<span style="color:${color};margin-right:5px;">${s.type}(${s.remain})</span>`;
      });
      statusTxt += '</div>';
    }
    window.gamedom.enemyTeam.innerHTML += `
      <div class="unit-card${currHP <= 0 ? ' dead' : ''}">
        <strong>${char.name}</strong>
        <div class="hp-bar"><div class="hp-bar-inner" style="width:${Math.max(0, currHP / char.maxHp * 100)}%"></div></div>
        <span>HP: ${Math.max(0, currHP)} / ${char.maxHp}</span>
        <br><span>Atk: ${char.atk}</span>
        <br><span>Skill: ${char.skills[0].name}</span>
        ${statusTxt}
      </div>
    `;
  });
};

// ================== ฟังก์ชัน startBattle (core) =====================


// สามารถ Hook callback ได้ (onBattleEnd)
window.onBattleEnd = null;
/**
 * startBattle ทำหน้าที่เป็นแกนหลักทั้ง Adventure และ Arena
 * - Auto สลับ Turn player/enemy
 * - ตรวจสอบโมด arena (PvP)
 * - Call Callback/award เมื่อจบ
 */
window.startBattle = function (battleOpt = {}) {
  window.gamedom.log.innerHTML = "";

  // Prepare - copy state ทั้ง player/enemy
  let state = {
    player: window.playerTeam.map(idx => {
      let c = JSON.parse(JSON.stringify(window.characters[idx]));
      c.currentHp = c.maxHp;
      c.status = [];
      return c;
    }),
    enemy: window.enemyTeam.map(char => {
      let base = JSON.parse(JSON.stringify(char));
      base.currentHp = base.maxHp;
      base.status = [];
      return base;
    })
  };

  let turn = 1, log = [];
  function getAlive(t) { return t.filter(x => x.currentHp > 0); }
  window._arenaBattleActive = !!battleOpt.arena || window._arenaBattleActive;

  // ===== LOOP เทิร์น (interval) =====
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

        // Arena award/callback (และ Adventure)
        if (typeof window.onBattleEnd === "function") {
          window.onBattleEnd({
            playerWin: playerAlive > 0,
            arena: !!window._arenaBattleActive,
            playerAlive, enemyAlive,
            state, log
          });
        }

        // Arena state reset
        if (window._arenaBattleActive) {
          window._arenaBattleActive = false;
          // อีกทั้งสามารถเพิ่มให้ award, นับสถิติ, popup ฯลฯ ตรงนี้
          // เช่น window.arenaWinCount = (window.arenaWinCount||0) + (playerAlive>0?1:0);
        }

      }, 500);

      return;
    }

    log.push(`<span style="color:#fdc300;">--- เทิร์น ${turn} ---</span>`);
    // Player turn
    state.player.forEach((p, pi) => {
      if (p.currentHp <= 0) return;
      let skill = p.skills[0] || { type: "damage", name: "โจมตีธรรมดา", power: 1.0, effect: {}, desc: "" };
      window.useSkill(p, skill, state.player, state.enemy, log, pi, "player");
    });

    // Enemy turn
    state.enemy.forEach((e, ei) => {
      if (e.currentHp <= 0) return;
      let skill = e.skills ? e.skills[0] : { type: "damage", name: "โจมตีธรรมดา", power: 1.0, effect: {}, desc: "" };
      window.useSkill(e, skill, state.enemy, state.player, log, ei, "enemy");
    });

    window.applyTurnBuffDebuff(state.player, log);
    window.applyTurnBuffDebuff(state.enemy, log);
    window.reduceStatusTurns(state.player);
    window.reduceStatusTurns(state.enemy);

    window.renderPlayerTeam(state);
    window.renderEnemyTeam(state);
    window.gamedom.log.innerHTML = log.join('<br>');

    turn++;
  }, 1700);

  window.gamedom.startBtn.disabled = true;
};

})(); 

// END battle-system.js