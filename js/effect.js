// effect.js - Rewrite ver (by GPT-4, 2024)
// Epic Seven Card Battle: Effect System (Buff/Debuff/Heal/Process Turn/Stack)
// ออกแบบใหม่ ไม่ใช้โค้ดเดิม (คลีนและอ่านง่ายกว่าเดิม)
// ใช้ร่วมกับ: battle.js, ai.js, animationEngine.js

/**
 * เพิ่มสถานะ (Buff หรือ Debuff) ให้ character
 * @param {Object} target - ตัวละครเป้าหมาย
 * @param {Array|Object} effects - [{type, turn, chance}]
 * @param {String} effectType - 'buff' หรือ 'debuff'
 */
function addEffectV2(target, effects, effectType) {
  if (!target || !effects) return;
  if (!Array.isArray(effects)) effects = [effects];

  // Ensure buffs/debuffs field
  if (!target.buffs) target.buffs = [];
  if (!target.debuffs) target.debuffs = [];

  for (const effect of effects) {
    if (!effect || !effect.type) continue;

    // Immunity (debuff only)
    if (
      effectType === "debuff" &&
      Array.isArray(target.buffs) &&
      target.buffs.some(b => b.type === "immune" && b.turn && b.turn > 0)
    ) {
      // ยกเว้น stun/burn/poison ยังติด
      if (!["stun", "burn", "poison"].includes(effect.type)) continue;
    }

    // Non-stack (default), Stackable (burn/poison)
    let canStack = ["burn", "poison"].includes(effect.type);
    let existing =
      effectType === "buff"
        ? target.buffs.find(b => b.type === effect.type)
        : target.debuffs.find(d => d.type === effect.type);

    if (!canStack && existing) continue;

    // Chance
    if (typeof effect.chance === "number") {
      if (Math.random() * 100 > effect.chance) continue; // Failed to proc
    }

    let effObj = { ...effect };
    // (clone, so each has separate turn etc)
    if (effectType === "buff") target.buffs.push(effObj);
    else target.debuffs.push(effObj);
  }
}

/**
 * เมื่อเริ่ม turn ใหม่ หรือเปลี่ยนเทิร์น เรียกเพื่อลด turn & trigger effect
 * @param {Object} char
 */
function processStatusEachTurn(char) {
  if (!char) return;
  ["buffs", "debuffs"].forEach(group => {
    if (!Array.isArray(char[group])) return;
    // countdown
    for (let i = char[group].length - 1; i >= 0; i--) {
      let st = char[group][i];
      if (typeof st.turn === "number" && st.turn > 0) st.turn--;
      // Remove if expired
      if (st.turn === 0) char[group].splice(i, 1);
    }
  });

  // === ACTIVE EFFECTS ===
  // Debuff: Poison/Burn
  if (Array.isArray(char.debuffs)) {
    char.debuffs.forEach(d => {
      if (d.type === "poison") {
        let val = Math.max(1, Math.round(char.hp * 0.05));
        char.currHp = Math.max(0, char.currHp - val);
        showStatusPopup(char, -val, "#ffea80"); // yellow
      }
      if (d.type === "burn") {
        let val = Math.max(1, Math.round(char.hp * 0.12));
        char.currHp = Math.max(0, char.currHp - val);
        showStatusPopup(char, -val, "#ff6100");
      }
    });
  }
  // Buff: Heal Over Time
  if (Array.isArray(char.buffs)) {
    char.buffs.forEach(b => {
      if (b.type === "heal_ot") {
        let val = Math.max(1, Math.round(char.hp * 0.06));
        char.currHp = Math.min(char.hp, char.currHp + val);
        showStatusPopup(char, val, "#2ae5a4");
      }
    });
  }
}

/**
 * ตรวจสอบว่าตัวละครนี้โดน stun หรือ skip turn (เช่น stun, sleep, freeze, silence ฯลฯ)
 * @param {Object} char
 * @returns {Boolean}
 */
function isTurnSkipStatus(char) {
  if (!char || !char.debuffs) return false;
  const effectNames = ["stun", "sleep", "freeze", "silence"];
  return char.debuffs.some(b => effectNames.includes(b.type));
}

/**
 * ลบ buff หรือ debuff หรือทั้งหมด
 * @param {Object} char
 * @param {String} [type="all"] - 'buff'|'debuff'|'all'
 */
function clearStatus(char, type = "all") {
  if (!char) return;
  if (type === "all" || type === "buff") char.buffs = [];
  if (type === "all" || type === "debuff") char.debuffs = [];
}

/**
 * ฟังก์ชันแสดงดาเมจ/ฮีล เป็น popup (เชื่อมกับ window.showDamage)
 */
function showStatusPopup(char, value, color = "#ff7777") {
  // value > 0 : heal, <0 : dmg
  // Find side, index for rendering (if available)
  let side = char.side || "hero",
    idx = typeof char.index === "number" ? char.index : 0;
  if (window.showDamage) window.showDamage(idx, side, value, color);
}

// -- EXPORT: API Global --
window.effectEngine = {
  addEffect: addEffectV2,
  processStatusTurn: processStatusEachTurn,
  isStunnedOrSkipped: isTurnSkipStatus,
  removeStatus: clearStatus
};