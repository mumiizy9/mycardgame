// BattleUI.js - UI และ Logic การต่อสู้

let currentBattle = null;

async function initBattleUI(team = null, enemies = null) {
    const root = document.getElementById('battle-root');
    // ถ้ายังไม่มีทีม ให้ mock ข้อมูล
    if (!team || !enemies) {
        // โหลดจาก character.json เอา 4 ตัวแรก vs 2 ตัว
        const res = await fetch('./data/characters.json');
        const all = await res.json();
        team = all.slice(0, 4);
        enemies = [
            { ...all[3], stats: { ...all[3].stats }, name: "Grok (Boss)", level: 5 },
            { ...all[6], stats: { ...all[6].stats }, level: 4 }
        ];
        enemies.forEach(e => e.stats.hp += 700); // Boss hp โปร่งเล็กน้อย
    }
    currentBattle = new window.BattleEngine(team, enemies);

    renderBattleUI();
}

function renderBattleUI() {
    if (!currentBattle) return;
    const root = document.getElementById('battle-root');
    const state = currentBattle.getState();
    root.innerHTML = `
  <div class="battle-box">
    <h2>⚔️ Auto Battle</h2>
    <div class="battle-teams">
      <div class="battle-team">
        <h3>ทีมของฉัน</h3>
        ${state.team.map((c, i) => `
          <div class="battle-char${c.hp <= 0 ? ' fainted' : ''}">
            <span class="battle-icon">&#128100;</span>
            ${c.name} <span class="battle-hp">${c.hp} / ${c.maxhp} HP</span>
          </div>
        `).join('')}
      </div>
      <div class="battle-team">
        <h3>ฝ่ายศัตรู</h3>
        ${state.enemy.map((c, i) => `
          <div class="battle-char${c.hp <= 0 ? ' fainted' : ''}">
            <span class="battle-icon">&#128128;</span>
            ${c.name} <span class="battle-hp">${c.hp} / ${c.maxhp} HP</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="battle-control">
      <button onclick="battleNextTurn()" ${state.finished ? "disabled" : ""}>เทิร์นถัดไป</button>
      <button onclick="battleAuto()" ${state.finished ? "disabled" : ""}>ดำเนินถึงจบ</button>
      <button onclick="battleReset()">รีเซ็ต</button>
    </div>
    <div class="battle-log">
      <h4>บันทึกการต่อสู้</h4>
      <div id="battle-log-text"></div>
    </div>
    ${state.finished ? `<div class="battle-result">
      <h3>ผลการต่อสู้: ${state.result === 'win' ? "&#x1F389; ชัยชนะ" : state.result === 'lose' ? "&#10060; แพ้" : "&#9873; เสมอ"}</h3>
    </div>` : ''}
  </div>`;
    renderBattleLog();
}

function battleNextTurn() {
    currentBattle.nextTurn();
    renderBattleUI();
}
function battleAuto() {
    currentBattle.runAutoFull();
    renderBattleUI();
}
function battleReset() {
    initBattleUI(); // เริ่มใหม่
}
function renderBattleLog() {
    const logDiv = document.getElementById('battle-log-text');
    if (!logDiv) return;
    const logs = currentBattle.getLog();
    logDiv.innerHTML = logs.map(l => {
        if (l.type === 'attack') return `<div>🗡️ <b>${l.actor}</b> โจมตี <b>${l.target}</b> ด้วย "${l.skill}" ${l.effect ? `ผลพิเศษ:${l.effect}` : ""} <b>- ${l.value} HP</b></div>`;
        if (l.type === 'heal') return `<div>💚 <b>${l.actor}</b> ฟื้น HP <b>+${l.value}</b></div>`;
        if (l.type === 'aoe') return `<div>💥 <b>${l.actor}</b> ใช้ "${l.skill}" โจมตีหมู่ ทุกศัตรู -${l.value} HP</div>`;
        return `<div>${JSON.stringify(l)}</div>`;
    }).join('');
}

// export สำหรับ html
window.initBattleUI = initBattleUI;
window.battleNextTurn = battleNextTurn;
window.battleAuto = battleAuto;
window.battleReset = battleReset;
window.renderBattleUI = renderBattleUI;