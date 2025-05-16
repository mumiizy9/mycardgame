// =============================================
// char-skill.js 
// ==========
// “โครงสร้างตัวละคร, สกิล, สถานะ (status/buff/debuff)”
// - กำหนดโครงสร้างตัวละครเต็มรูปแบบ, แปลง skill จาก string เดิมเป็น skills array
// - สร้าง/แปลง properties ตัวละครให้พร้อมใช้กับระบบ battle advance (ไม่ยุ่งกับ loop battle หรือ UI battle!)
// - สร้างฟังก์ชัน addStatus/removeStatus/getStatus/reduceStatusTurns
// - แนะนำใช้ต่อ battle-system.js
// =============================================

// 1. ข้อมูลตัวละครพร้อม skills, บัฟ, ซัพพอร์ต element&status
window.characters = [
  {
    name: "อัศวินไฟ",
    element: "ไฟ",
    maxHp: 200,
    atk: 55,
    skills: [{
      name: "ฟาดดาบรุนแรง",
      type: "damage",        // attack/debuff/buff/heal
      power: 1.2,
      effect: { burn: 2 },   // burn (2 turns)
      desc: "โจมตีแรง มีโอกาสติด burn ทุกเทิร์น"
    }]
  },
  {
    name: "นักธนูน้ำ",
    element: "น้ำ",
    maxHp: 150,
    atk: 70,
    skills: [{
      name: "ยิงทะลวง",
      type: "damage",
      power: 1.0,
      effect: { defenseDown: 2 }, 
      desc: "โจมตีและลด def เป้าหมาย"
    }]
  },
  {
    name: "ฮีลเลอร์แสง",
    element: "แสง",
    maxHp: 170,
    atk: 40,
    skills: [{
      name: "ฟื้นฟูพลังชีวิต",
      type: "heal-over-time-1", // ฮีลต่อเนื่อง 2 เทิร์น (1 ตัว)
      power: 1.1,
      effect: { healOverTimeSingle: 2 },
      desc: "ฮิลทีละ 1 ตัว/เทิร์น (2 เทิร์น)"
    }]
  },
  {
    name: "นักเวทสายฟ้า",
    element: "สายฟ้า",
    maxHp: 130,
    atk: 85,
    skills: [{
      name: "ช็อตสายฟ้า",
      type: "damage",
      power: 1.1,
      effect: { stun: 1 },
      desc: "โจมตี + stun 1 เทิร์น"
    }]
  },
  {
    name: "แทงค์ไม้",
    element: "ไม้",
    maxHp: 220,
    atk: 35,
    skills: [{
      name: "ฟาดไม้หนัก",
      type: "damage",
      power: 1.3,
      effect: { atkDown: 1 },
      desc: "โจมตี ลด atk ศัตรู"
    }]
  },
  {
    name: "สาวดาบมืด",
    element: "มืด",
    maxHp: 160,
    atk: 60,
    skills: [{
      name: "วายุดำ",
      type: "damage",
      power: 1.2,
      effect: { atkDown: 2 },
      desc: "โจมตี ลด atk เป้าหมาย 2 เทิร์น"
    }]
  }
];

// 2. ฟังก์ชัน compat (รองรับ gacha หรือไฟล์เก่ามา push ตัวละครใหม่)
window.characters.forEach(c => {
  // ถ้าถูก push จาก gacha หรือระบบอื่น แล้วยังไม่มี "skills" ให้แปลง
  if (!c.skills && c.skill) {
    c.skills = [{
      name: c.skill,
      type: "damage",
      power: 1.0,
      effect: {},
      desc: c.skill
    }];
  }
  if (!c.maxHp && c.hp) c.maxHp = c.hp;
  c.hp = undefined;
});

// 3. สร้าง utility function สำหรับการใช้งาน buff/debuff/status
window.addStatus = function(target, statusType, nTurn) {
  // ใส่สถานะใหม่ (เช่น stun, burn) หาก type เดิมซ้อน จะนับ max
  if (!target.status) target.status = [];
  const exist = target.status.find(s => s.type === statusType);
  if (exist) exist.remain = Math.max(exist.remain, nTurn);
  else target.status.push({ type: statusType, remain: nTurn });
};
window.removeStatus = function(target, statusType) {
  if (!target.status) return;
  target.status = target.status.filter(s => s.type !== statusType);
};
window.getStatus = function(target, statusType) {
  if (!target.status) return null;
  return target.status.find(s => s.type === statusType);
};
window.reduceStatusTurns = function(team) {
  team.forEach(unit => {
    if (!unit.status) return;
    unit.status.forEach(s => s.remain--);
    unit.status = unit.status.filter(s => s.remain > 0);
  });
};

// 4. กำหนดข้อมูล element สี/คำอธิบายเพิ่มเติม (ใช้กับ future UI ได้)
window.statusMeta = {
  stun:      { color: "#fdc300", label: "สตัน (ข้ามเทิร์น)" },
  healOverTimeSingle: { color: "#57ffa5", label: "ฟื้นฟู (ฮีลต่อเนื่อง)" },
  burn:      { color: "#e85656", label: "ไหม้ (เสีย HP ทุกเทิร์น)" },
  atkUp:     { color: "#f8f",    label: "พลังโจมตี +" },
  atkDown:   { color: "#ccc",    label: "พลังโจมตี -" },
  defenseDown: { color: "#17ffc1", label: "ป้องกัน -"}
};
window.elementMeta = {
  "ไฟ":   { color: "#ff624d", label: "Fire" },
  "น้ำ":  { color: "#4dcaff", label: "Water" },
  "แสง":  { color: "#fff43f", label: "Light" },
  "มืด":  { color: "#7373a7", label: "Dark" },
  "สายฟ้า": { color: "#beccff", label: "Lightning" },
  "ไม้":  { color: "#48b64a", label: "Wood" }
};

// ป้องกันซ้ำซ้อน, ไม่ต้องมี logic battle ในนี้, focus ที่โครงสร้างข้อมูลตัวละคร, skill, status, meta
// - battle-system.js จะ go next!

// char-skill.js //