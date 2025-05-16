// adventure-stage.js
// Summoner x Epic Idle: Adventure ระบบเลือกด่าน / สุ่มศัตรู / รางวัล / เรียก battle-system.js auto
// =========================================

// 1. โครงสร้างข้อมูลด่าน—World/Stage/SubStage
window.stages = [
  {
    name: "ป่าเขียวชอุ่ม",
    desc: "เส้นทางแรก พบกับเหล่ามอนสเตอร์ป่าหลากหลายชนิด",
    world: 1,
    sub: [
      ...[1,2,3,4,5,6,7,8,9].map(num => ({
        name: `ป่าเขียวชอุ่ม-${num}`,
        reward: { exp: 7 + num, gold: 45 + num*8 },
        monsters: [
          { name: "หมาป่าอาละวาด", maxHp: 75 + num*2, atk: 13+num*1, element: "ดิน" },
          { name: "ผึ้งยักษ์", maxHp: 65 + num*2, atk: 12+num, element: "ลม" },
          { name: "เห็ดปีศาจ", maxHp: 70 + num*2, atk: 11+num, element: "น้ำ" },
          { name: "กบนักล่า", maxHp: 68 + num*2, atk: 13+num, element: "น้ำ" }
        ]
      })),
      {
        name: "บอส: พญาหมาป่าเพลิง",
        reward: { exp: 18, gold: 180, item: "wolf_claw" },
        monsters: [
          { name: "พญาหมาป่าเพลิง (Boss)", maxHp: 195, atk: 27, element: "ไฟ" },
          { name: "หมาป่าเหลือง", maxHp: 88, atk: 15, element: "ลม" },
          { name: "เห็ดพิษใหญ่", maxHp: 85, atk: 16, element: "น้ำ" },
          { name: "กบนักล่า", maxHp: 85, atk: 16, element: "น้ำ" }
        ]
      }
    ]
  },
  {
    name: "ถ้ำหินปริศนา",
    desc: "เจอลิงหิน ค้างคาวเงา และมังกรจิ๋วในถ้ำลึกลับ",
    world: 2,
    sub: [
      ...[1,2,3,4,5,6,7,8,9].map(num => ({
        name: `ถ้ำหินปริศนา-${num}`,
        reward: { exp: 19 + num, gold: 82 + num*11 },
        monsters: [
          { name: "ค้างคาวหิน", maxHp: 90 + num*3, atk: 16+num*2, element: "มืด" },
          { name: "ลูกลิงถ้ำ", maxHp: 105 + num*2, atk: 15+num, element: "ดิน" },
          { name: "แมงมุมหิน", maxHp: 96 + num*2, atk: 16+num, element: "ดิน" },
          { name: "กิ้งก่าหิน", maxHp: 93 + num*2, atk: 15+num, element: "ไฟ" }
        ]
      })),
      {
        name: "บอส: มังกรหินยักษ์",
        reward: { exp: 35, gold: 240, item: "dragon_scale" },
        monsters: [
          { name: "มังกรหินยักษ์ (Boss)", maxHp: 280, atk: 32, element: "ดิน" },
          { name: "ค้างคาวหิน", maxHp: 120, atk: 18, element: "มืด" },
          { name: "ลูกลิงถ้ำ", maxHp: 124, atk: 19, element: "ดิน" }
        ]
      }
    ]
  },
  {
    name: "แม่น้ำเวทย์มนต์",
    desc: "ปลาสู่สมรภูมิ กุ้งปีศาจ งูน้ำ ประจัญบาน",
    world: 3,
    sub: [
      ...[1,2,3,4,5,6,7,8,9].map(num => ({
        name: `แม่น้ำเวทย์มนต์-${num}`,
        reward: { exp: 28 + num, gold: 115 + num*13 },
        monsters: [
          { name: "ปลาปีศาจ", maxHp: 110 + num*3, atk: 19+num*2, element: "น้ำ" },
          { name: "กุ้งปีศาจ", maxHp: 119 + num*2, atk: 20+num*2, element: "น้ำ" },
          { name: "งูน้ำ", maxHp: 117 + num*3, atk: 19+num*3, element: "น้ำ" },
          { name: "เห็ดน้ำวิเศษ", maxHp: 109 + num*2, atk: 18+num, element: "น้ำ" }
        ]
      })),
      {
        name: "บอส: งูยักษ์น้ำเวทย์",
        reward: { exp: 47, gold: 300, item: "snake_fang" },
        monsters: [
          { name: "งูยักษ์น้ำเวทย์ (Boss)", maxHp: 330, atk: 38, element: "น้ำ" },
          { name: "ปลาปีศาจ", maxHp: 140, atk: 20, element: "น้ำ" },
          { name: "กุ้งปีศาจ", maxHp: 145, atk: 22, element: "น้ำ" }
        ]
      }
    ]
  },
  {
    name: "ภูเขาไฟลุกโชน",
    desc: "ปีศาจลาวา แมงป่องไฟ และบอสมังกรไฟดุเดือด",
    world: 4,
    sub: [
      ...[1,2,3,4,5,6,7,8,9].map(num => ({
        name: `ภูเขาไฟลุกโชน-${num}`,
        reward: { exp: 36 + num, gold: 148 + num*16 },
        monsters: [
          { name: "ปีศาจลาวา", maxHp: 125 + num*4, atk: 23+num*2, element: "ไฟ" },
          { name: "แมงป่องไฟ", maxHp: 120 + num*2, atk: 21+num*2, element: "ไฟ" },
          { name: "ตุ๊กแกเพลิง", maxHp: 126 + num*3, atk: 23+num*3, element: "ไฟ" },
          { name: "หนอนอมตะ", maxHp: 118 + num*2, atk: 21+num*1, element: "ไฟ" }
        ]
      })),
      {
        name: "บอส: มังกรไฟกลืนวิญญาณ",
        reward: { exp: 67, gold: 370, item: "flame_essence" },
        monsters: [
          { name: "มังกรไฟกลืนวิญญาณ (Boss)", maxHp: 415, atk: 44, element: "ไฟ" },
          { name: "ตุ๊กแกเพลิง", maxHp: 170, atk: 26, element: "ไฟ" },
          { name: "ปีศาจลาวา", maxHp: 162, atk: 24, element: "ไฟ" }
        ]
      }
    ]
  },
  {
    name: "ทุ่งคริสตัลระยิบระยับ",
    desc: "กระต่ายคริสตัล ลิงผลึกและราชินีคริสตัล",
    world: 5,
    sub: [
      ...[1,2,3,4,5,6,7,8,9].map(num => ({
        name: `ทุ่งคริสตัลระยิบระยับ-${num}`,
        reward: { exp: 47 + num, gold: 167 + num*20 },
        monsters: [
          { name: "กระต่ายคริสตัล", maxHp: 148 + num*4, atk: 21+num*3, element: "แสง" },
          { name: "ลิงผลึก", maxHp: 155 + num*2, atk: 23+num*2, element: "แสง" },
          { name: "แมลงระยิบระยับ", maxHp: 144 + num*2, atk: 23+num, element: "แสง" },
          { name: "นกผลึก", maxHp: 143 + num*3, atk: 22+num*2, element: "แสง" }
        ]
      })),
      {
        name: "บอส: ราชินีคริสตัล",
        reward: { exp: 90, gold: 420, item: "crystal_crown" },
        monsters: [
          { name: "ราชินีคริสตัล (Boss)", maxHp: 520, atk: 48, element: "แสง" },
          { name: "ลิงผลึก", maxHp: 192, atk: 30, element: "แสง" },
          { name: "กระต่ายคริสตัล", maxHp: 190, atk: 27, element: "แสง" }
        ]
      }
    ]
  },
  {
    name: "สุสานกลางคืน",
    desc: "ผีดิบ มัมมี่ ค้างคาวดำ เต็มไปหมด",
    world: 6,
    sub: [
      ...[1,2,3,4,5,6,7,8,9].map(num => ({
        name: `สุสานกลางคืน-${num}`,
        reward: { exp: 57 + num, gold: 195 + num*23 },
        monsters: [
          { name: "ผีดิบ", maxHp: 164 + num*4, atk: 23+num*3, element: "มืด" },
          { name: "มัมมี่", maxHp: 170 + num*2, atk: 25+num*2, element: "มืด" },
          { name: "ค้างคาวดำ", maxHp: 167 + num*2, atk: 20+num, element: "มืด" },
          { name: "หมาป่ามืด", maxHp: 162 + num*3, atk: 24+num*2, element: "มืด" }
        ]
      })),
      {
        name: "บอส: หลุมผีดิบผู้นำ",
        reward: { exp: 115, gold: 460, item: "dark_core" },
        monsters: [
          { name: "ผู้นำผีดิบ (Boss)", maxHp: 600, atk: 51, element: "มืด" },
          { name: "มัมมี่", maxHp: 220, atk: 32, element: "มืด" },
          { name: "ค้างคาวดำ", maxHp: 218, atk: 29, element: "มืด" }
        ]
      }
    ]
  },
  {
    name: "เกาะสายฟ้า",
    desc: "คางคกสายฟ้า หมีอ้วนวิ่งไว งูแสงฟาด",
    world: 7,
    sub: [
      ...[1,2,3,4,5,6,7,8,9].map(num => ({
        name: `เกาะสายฟ้า-${num}`,
        reward: { exp: 63 + num, gold: 225 + num*26 },
        monsters: [
          { name: "คางคกสายฟ้า", maxHp: 181 + num*6, atk: 28+num*3, element: "สายฟ้า" },
          { name: "หมีอ้วนไว", maxHp: 176 + num*3, atk: 26+num*2, element: "สายฟ้า" },
          { name: "งูแสงฟาด", maxHp: 182 + num*4, atk: 25+num, element: "สายฟ้า" },
          { name: "กระรอกไฟฟ้า", maxHp: 175 + num*3, atk: 24+num*2, element: "สายฟ้า" }
        ]
      })),
      {
        name: "บอส: เทพคางคกฟ้าร้อง",
        reward: { exp: 130, gold: 520, item: "thunder_frog_eye" },
        monsters: [
          { name: "เทพคางคกฟ้าร้อง (Boss)", maxHp: 720, atk: 58, element: "สายฟ้า" },
          { name: "หมีอ้วนไว", maxHp: 273, atk: 38, element: "สายฟ้า" },
          { name: "คางคกสายฟ้า", maxHp: 272, atk: 35, element: "สายฟ้า" }
        ]
      }
    ]
  },
  {
    name: "ปีกภูเขาน้ำแข็ง",
    desc: "เพนกวินปีศาจ มอสเย็น ฉลามน้ำแข็ง บอสหมีขั้วโลก",
    world: 8,
    sub: [
      ...[1,2,3,4,5,6,7,8,9].map(num => ({
        name: `ปีกภูเขาน้ำแข็ง-${num}`,
        reward: { exp: 72 + num, gold: 273 + num*29 },
        monsters: [
          { name: "เพนกวินปีศาจ", maxHp: 210 + num*7, atk: 33+num*4, element: "น้ำแข็ง" },
          { name: "มอสเย็น", maxHp: 205 + num*4, atk: 31+num*3, element: "น้ำแข็ง" },
          { name: "ปลาฉลามน้ำแข็ง", maxHp: 211 + num*6, atk: 34+num*2, element: "น้ำแข็ง" },
          { name: "แมวน้ำขั้วโลก", maxHp: 204 + num*4, atk: 29+num*2, element: "น้ำแข็ง" }
        ]
      })),
      {
        name: "บอส: หมีขั้วโลกน้ำแข็ง",
        reward: { exp: 172, gold: 630, item: "ice_fang" },
        monsters: [
          { name: "หมีขั้วโลกน้ำแข็ง (Boss)", maxHp: 850, atk: 65, element: "น้ำแข็ง" },
          { name: "มอสเย็น", maxHp: 330, atk: 44, element: "น้ำแข็ง" },
          { name: "เพนกวินปีศาจ", maxHp: 335, atk: 41, element: "น้ำแข็ง" }
        ]
      }
    ]
  },
  {
    name: "วิหารเทพเจ้า",
    desc: "ทหารเทพเจ้า สาวกแสง บอสเทพไททัน",
    world: 9,
    sub: [
      ...[1,2,3,4,5,6,7,8,9].map(num => ({
        name: `วิหารเทพเจ้า-${num}`,
        reward: { exp: 83 + num, gold: 320 + num*34 },
        monsters: [
          { name: "ทหารเทพ", maxHp: 235 + num*8, atk: 38+num*4, element: "แสง" },
          { name: "สาวกแสง", maxHp: 227 + num*5, atk: 36+num*3, element: "แสง" },
          { name: "ตุ๊กตาเทพ", maxHp: 240 + num*7, atk: 39+num*2, element: "แสง" },
          { name: "นักบวชเก่า", maxHp: 234 + num*5, atk: 35+num*2, element: "แสง" }
        ]
      })),
      {
        name: "บอส: เทพไททัน",
        reward: { exp: 200, gold: 750, item: "titan_crest" },
        monsters: [
          { name: "เทพไททัน (Boss)", maxHp: 1000, atk: 75, element: "แสง" },
          { name: "ทหารเทพ", maxHp: 390, atk: 52, element: "แสง" },
          { name: "ตุ๊กตาเทพ", maxHp: 382, atk: 53, element: "แสง" }
        ]
      }
    ]
  },
  {
    name: "หุบเขาแห่งเงา",
    desc: "ปีศาจเงา นักเวทดำและราชาเงาบอสสุดท้าย",
    world: 10,
    sub: [
      ...[1,2,3,4,5,6,7,8,9].map(num => ({
        name: `หุบเขาแห่งเงา-${num}`,
        reward: { exp: 101 + num, gold: 360 + num*40 },
        monsters: [
          { name: "ปีศาจเงา", maxHp: 260 + num*10, atk: 43+num*5, element: "มืด" },
          { name: "นักเวทดำ", maxHp: 252 + num*7, atk: 45+num*4, element: "มืด" },
          { name: "งูเงาดำ", maxHp: 258 + num*9, atk: 44+num*3, element: "มืด" },
          { name: "แมงมุมมืด", maxHp: 251 + num*6, atk: 42+num*2, element: "มืด" }
        ]
      })),
      {
        name: "บอส: ราชาแห่งเงานิรันดร์",
        reward: { exp: 270, gold: 900, item: "shadow_crown" },
        monsters: [
          { name: "ราชาแห่งเงานิรันดร์ (Boss)", maxHp: 1400, atk: 88, element: "มืด" },
          { name: "ปีศาจเงา", maxHp: 410, atk: 62, element: "มืด" },
          { name: "นักเวทดำ", maxHp: 405, atk: 59, element: "มืด" },
          { name: "งูเงาดำ", maxHp: 398, atk: 57, element: "มืด" }
        ]
      }
    ]
  }
];

// 2. UI เลือก World
window.renderStageSelect = function () {
    document.body.querySelectorAll("#adventureUI").forEach(e => e.remove());
    const container = document.createElement("div");
    container.id = "adventureUI";
    container.style.background = "#252b39";
    container.style.color = "#fff";
    container.style.padding = "18px 28px";
    container.style.borderRadius = "14px";
    container.style.position = "fixed";
    container.style.left = "50px";
    container.style.top = "60px";
    container.style.zIndex = 100;
    container.innerHTML = `<h2>เลือกด่านผจญภัย (Adventure World)</h2>`;
    window.stages.forEach((w, worldIdx) => {
        const btnWorld = document.createElement("button");
        btnWorld.textContent = `${w.name}: ${w.desc}`;
        btnWorld.style.display = "block";
        btnWorld.style.marginBottom = "5px";
        btnWorld.onclick = () => window.renderSubStageSelect(worldIdx);
        container.appendChild(btnWorld);
    });
    const btnClose = document.createElement("button");
    btnClose.textContent = "ปิด";
    btnClose.onclick = () => container.remove();
    btnClose.style.marginTop = "18px";
    container.appendChild(btnClose);
    document.body.appendChild(container);
};

// 3. UI เลือก SubStage ใน World
window.renderSubStageSelect = function (worldIdx) {
    document.body.querySelectorAll("#subStageUI").forEach(e => e.remove());
    const wrap = document.createElement("div");
    wrap.id = "subStageUI";
    wrap.style.background = "#232834";
    wrap.style.padding = "19px 17px";
    wrap.style.borderRadius = "11px";
    wrap.style.position = "fixed";
    wrap.style.left = "380px";
    wrap.style.top = "90px";
    wrap.style.zIndex = 200;
    const world = window.stages[worldIdx];
    wrap.innerHTML = `<h3>${world.name} - เลือกด่านย่อย</h3>`;
    world.sub.forEach((stage, subIdx) => {
        const btn = document.createElement("button");
        btn.textContent = `${stage.name} | รางวัล EXP:${stage.reward.exp} Gold:${stage.reward.gold}${stage.reward.item ? " (" + stage.reward.item + ")" : ""}`;
        btn.style.display = "block";
        btn.style.marginBottom = "4px";
        btn.onclick = () => {
            window.startAdventureStage(worldIdx, subIdx);
            wrap.remove();
            document.getElementById("adventureUI")?.remove();
        };
        wrap.appendChild(btn);
    });
    const btnClose = document.createElement("button");
    btnClose.textContent = "กลับ";
    btnClose.onclick = () => wrap.remove();
    btnClose.style.marginTop = "9px";
    wrap.appendChild(btnClose);
    document.body.appendChild(wrap);
};

// 4. startAdventureStage: สร้าง enemyTeam, เรียก startBattle, เตรียมแจกของ
window.startAdventureStage = function (worldIdx, subIdx) {
    // ข้อมูล stage/sub
    const stage = window.stages[worldIdx].sub[subIdx];
    window._stageRewardOnClear = stage.reward; // ให้ battle-system ใช้หลังจบ (เช่นแจก gold, exp, item)
    // สร้าง enemyTeam (deep copy)
    window.enemyTeam = stage.monsters.map(m => {
        const c = JSON.parse(JSON.stringify(m));
        c.skills = [{
            name: c.name + " โจมตี",
            type: "damage",
            power: 1.0,
            effect: {},
            desc: c.name + " โจมตี"
        }];
        c.equipSlots = [null, null];
        c.currentHp = c.maxHp;
        return c;
    });
    alert(`เข้าสู่ "${stage.name}"`);
    // เรียก startBattle (จาก battle-system.js)
    window.startBattle && window.startBattle();

    // Hook แจกของ+exp+quest milestone (หลังจบเทิร์น)
    let battleEndHandler = function () {
        let domTxt = window.gamedom && window.gamedom.log && window.gamedom.log.innerHTML;
        if (!!domTxt && (domTxt.includes("คุณชนะ!") || domTxt.includes("เสมอ!") || domTxt.includes("คุณแพ้!"))) {
            clearInterval(_interval_);
            if (domTxt.includes("คุณชนะ!")) {
                window.claimStageReward && window.claimStageReward(window._stageRewardOnClear);
                window.addExpToTeam && window.addExpToTeam(window._stageRewardOnClear.exp);
            }
            // Hook quest/mission เช่น milestone
            window.addProgressToMilestone && window.addProgressToMilestone("clear_5_stage");
        }
    };
    var _interval_ = setInterval(battleEndHandler, 700);
};

// 5. ปุ่มเมนูด่าน adventure (add หากยังไม่มี)
(function() {
    if (document.getElementById("stageMenuBtn")) return;
    const btn = document.createElement("button");
    btn.id = "stageMenuBtn";
    btn.textContent = "เลือกด่านผจญภัย";
    btn.onclick = window.renderStageSelect;
    document.querySelector('.game-container').appendChild(btn);
})();

// 6. Claim reward หลังชนะ (ถ้ามีระบบ inventory)
window.inventory = window.inventory || { gold:0, exp:0, items:{} };
window.claimStageReward = function(reward){
    if(!reward) return;
    if(reward.gold) { window.inventory.gold = (window.inventory.gold||0) + reward.gold; }
    if(reward.item) { window.inventory.items[reward.item] = (window.inventory.items[reward.item]||0) + 1; }
    alert(`รับรางวัล EXP+${reward.exp||0} Gold+${reward.gold||0}${reward.item?` (item: ${reward.item})`:""}`);
    // สามารถ trigger ระบบแสดง inventory, log, หรือ UI เพิ่มเติมที่นี่ได้
};
// 7. แจก EXP ให้ทั้งทีม (เพิ่ม point เพื่ออัปเกรด) — function ที่ใช้ร่วม
window.addExpToTeam = function(exp){
    // ใช้ร่วมกับระบบอัปเกรด point/gacha
    window.addPoints && window.addPoints(3); // อัปเกรด point 3 แต้มทุกการผ่าน
    // ในอนาคต: เพิ่ม exp/lv แต่ละคนได้
};

// END adventure-stage.js //