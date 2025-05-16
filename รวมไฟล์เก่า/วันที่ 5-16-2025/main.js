// ส่วนประกาศตัวละครพื้นฐาน (ต้องมีโครงสร้างแบบเก่าเผื่อรองรับไม่โหลด part2)
window.characters = [
  { name: "อัศวินไฟ", hp: 200, atk: 55, skill: "ฟาดดาบรุนแรง", element: "ไฟ" },
  { name: "นักธนูน้ำ", hp: 150, atk: 70, skill: "ยิงทะลวง", element: "น้ำ" },
  { name: "ฮีลเลอร์แสง", hp: 170, atk: 40, skill: "ฟื้นฟูพลังชีวิต", element: "แสง" },
  { name: "นักเวทสายฟ้า", hp: 130, atk: 85, skill: "ช็อตสายฟ้า", element: "สายฟ้า" },
  { name: "แทงค์ไม้", hp: 220, atk: 35, skill: "ป้องกันแข็งแกร่ง", element: "ไม้" },
  { name: "สาวดาบมืด", hp: 160, atk: 60, skill: "วายุดำ", element: "มืด" }
];

window.getRandomEnemyTeam = function() {
  let chosen = [];
  let pool = [...window.characters];
  for (let i = 0; i < 4; i++) {
    let idx = Math.floor(Math.random() * pool.length);
    chosen.push({ ...pool[idx] });
    pool.splice(idx, 1);
  }
  return chosen;
};

window.playerTeam = [];
window.enemyTeam = [];

// อ้างอิงองค์ประกอบ DOM
window.gamedom = {
  playerSelect: document.getElementById("playerSelect"),
  playerTeam: document.getElementById("playerTeam"),
  enemyTeam: document.getElementById("enemyTeam"),
  startBtn: document.getElementById("startBtn"),
  log: document.getElementById("battleLog"),
};

// *** FIX: renderCharacterSelect ใช้ได้กับข้อมูลเก่า-ใหม่ ***
window.renderCharacterSelect = function() {
  gamedom.playerSelect.innerHTML = "";
  window.characters.forEach((char, idx) => {
    const card = document.createElement("div");
    card.className = "unit-card";
    if (window.playerTeam.includes(idx)) card.classList.add("selected");

    // เช็คถ้ามี maxHp/skills ให้ใช้ property แบบใหม่
    // ถ้าไม่มีก็ fallback ไปแบบเก่า
    const hp = typeof char.maxHp !== "undefined" ? char.maxHp : char.hp;
    const atk = typeof char.atk !== "undefined" ? char.atk : "-";
    const skillName = char.skills
      ? (char.skills[0] && char.skills[0].name ? char.skills[0].name : "undefined")
      : (char.skill || "undefined");

    card.innerHTML = `
      <strong>${char.name}</strong><br>
      <span>HP: ${typeof hp !== "undefined" ? hp : "undefined"} | Atk: ${atk}</span><br>
      <span>สกิล: ${skillName}</span>
    `;

    card.onclick = () => {
      if (window.playerTeam.includes(idx)) {
        window.playerTeam = window.playerTeam.filter(i => i !== idx);
      } else if (window.playerTeam.length < 4) {
        window.playerTeam.push(idx);
      }
      window.renderCharacterSelect();
      window.updateStartBtn();
      window.renderPlayerTeam();
    };

    gamedom.playerSelect.appendChild(card);
  });
};

window.updateStartBtn = function() {
  gamedom.startBtn.disabled = (window.playerTeam.length !== 4);
};

window.renderPlayerTeam = function() {
  gamedom.playerTeam.innerHTML = "";
  window.playerTeam.forEach((idx, i) => {
    const char = window.characters[idx];

    // ใช้ HP/Skill แบบเดียวกับด้านบน
    const hp = typeof char.maxHp !== "undefined" ? char.maxHp : char.hp;
    const atk = typeof char.atk !== "undefined" ? char.atk : "-";
    const skillName = char.skills
      ? (char.skills[0] && char.skills[0].name ? char.skills[0].name : "undefined")
      : (char.skill || "undefined");

    gamedom.playerTeam.innerHTML += `
      <div class="unit-card">
        <strong>${char.name}</strong>
        <div class="hp-bar"><div class="hp-bar-inner" style="width:100%"></div></div>
        <span>HP: ${typeof hp !== "undefined" ? hp : "undefined"}</span>
        <br><span>Atk: ${atk}</span>
        <br><span>Skill: ${skillName}</span>
      </div>
    `;
  });
};

window.renderEnemyTeam = function() {
  gamedom.enemyTeam.innerHTML = "";
  window.enemyTeam.forEach((char, i) => {
    // ใช้ HP/Skill แบบเดียวกับด้านบน
    const hp = typeof char.maxHp !== "undefined" ? char.maxHp : char.hp;
    const atk = typeof char.atk !== "undefined" ? char.atk : "-";
    const skillName = char.skills
      ? (char.skills[0] && char.skills[0].name ? char.skills[0].name : "undefined")
      : (char.skill || "undefined");
    gamedom.enemyTeam.innerHTML += `
      <div class="unit-card">
        <strong>${char.name}</strong>
        <div class="hp-bar"><div class="hp-bar-inner" style="width:100%"></div></div>
        <span>HP: ${typeof hp !== "undefined" ? hp : "undefined"}</span>
        <br><span>Atk: ${atk}</span>
        <br><span>Skill: ${skillName}</span>
      </div>
    `;
  });
};

window.startBattle = function() {
  gamedom.log.innerHTML = "";
  window.enemyTeam = window.getRandomEnemyTeam();
  window.renderPlayerTeam();
  window.renderEnemyTeam();
  gamedom.log.innerHTML = "ระบบต่อสู้ขั้นสูงจะถูกโหลด (ผ่าน battle-system.js)";
  gamedom.startBtn.disabled = true;
  setTimeout(() => {gamedom.startBtn.disabled = false}, 1600);
};

gamedom.startBtn.onclick = window.startBattle;

// โหลดหน้าแรก
window.renderCharacterSelect();
window.renderPlayerTeam();
window.enemyTeam = window.getRandomEnemyTeam();
window.renderEnemyTeam();
gamedom.log.innerHTML = "กรุณาเลือกทีม แล้วกดปุ่ม \"เริ่มต่อสู้!\"";

// จบ main.js //