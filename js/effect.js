// js/effect.js

/**
 * ระบบบัฟ/ดีบัฟ/ฮีล Auto Battle Engine (Epic Seven Version)
 * รองรับ: Buff, Debuff, Immunity, Stack, Countdown Turn, Remove, Tooltip
 * เรียกใช้ได้จาก battle.js, ai.js, animationEngine.js
 */

/**
 * เพิ่มสถานะ (Buff/Debuff) ให้กับ character
 * @param {Object} target - ตัวละครเป้าหมาย
 * @param {Array<Object>} effects - [{type, turn, [chance]}]
 * @param {string} effectType - 'buff' หรือ 'debuff'
 */
function addEffect(target, effects, effectType) {
    if (!effects || !Array.isArray(effects)) return;

    for (let eff of effects) {
        // Anti-stack: debuff/buff แบบ non-stack
        if (effectType === "buff") {
            if (target.buffs.some(b => b.type === eff.type)) continue;
        } else if (effectType === "debuff") {
            if (target.debuffs.some(b => b.type === eff.type)) continue;
        }
        // Immunity: หากติด immunity (multi N turn) จะกันดีบัฟ (ยกเว้น stun/burn ฯ)
        if (effectType === "debuff" && (target.buffs || []).some(b => b.type === "immune" && b.turn > 0)) {
            continue;
        }
        // Stackable Debuff (เช่น poison) *Option
        // เพิ่มสามารถ stack ได้หาก type เป็น poison/burn
        if (effectType === "debuff" && ["poison", "burn"].includes(eff.type)) {
            target.debuffs.push({...eff});
            continue;
        }
        // เพิ่มสถานะ
        if (effectType === "buff") target.buffs.push({...eff});
        else if (effectType === "debuff") target.debuffs.push({...eff});
    }
}

/**
 * ทุกครั้งที่เริ่ม turn หรือตัวละคร เขียนสำหรับลด countdown & remove state หมดอายุ
 * @param {Object} char - ตัวละคร
 */
function processStatusTurn(char) {
    ['buffs', 'debuffs'].forEach(listType => {
        if (!char[listType]) return;
        for (let i = char[listType].length - 1; i >= 0; i--) {
            let st = char[listType][i];
            // ลดจำนวน turn
            if (st.turn && st.turn > 0) st.turn--;
            // เอาออกถ้าหมดอายุ
            if (st.turn === 0) char[listType].splice(i, 1);
        }
    });
    // Heal Over Time (HoT)/Poison/Burn
    if (char.debuffs) {
        char.debuffs.forEach(df => {
            if (df.type === "poison") {
                let val = Math.round(char.hp * 0.05);
                char.currHp = Math.max(0, char.currHp - val);
                window.showDamage?.(char.index || 0, char.side || 'hero', val, "#ffd155");
            }
            if (df.type === "burn") {
                let val = Math.round(char.hp * 0.12);
                char.currHp = Math.max(0, char.currHp - val);
                window.showDamage?.(char.index || 0, char.side || 'hero', val, "#ff6633");
            }
        });
    }
    if (char.buffs) {
        char.buffs.forEach(bf => {
            if (bf.type === "heal_ot") { // Heal over time
                let val = Math.round(char.hp * 0.06);
                char.currHp = Math.min(char.hp, char.currHp + val);
                window.showDamage?.(char.index || 0, char.side || 'hero', -val, "#24eeba");
            }
        });
    }
}

/**
 * เช็คว่าตัวนี้โดน Stun หรือ Debuff Skip Turn อยู่หรือไม่
 */
function isStunnedOrSkipped(char) {
    return (char.debuffs || []).some(df => ["stun", "sleep", "freeze", "silence"].includes(df.type));
}

/**
 * ลบสถานะ buff/debuff ทั้งหมด (Cleanse/Purge) หรือกำหนด
 * @param {Object} char
 * @param {string} [type] "buff"/"debuff"/"all" (default: all)
 */
function removeStatus(char, type = "all") {
    if (!char) return;
    if (type === "all") {
        char.buffs = [];
        char.debuffs = [];
    }
    if (type === "buff") char.buffs = [];
    if (type === "debuff") char.debuffs = [];
}

/**
 * เรียกใน UI เพื่อแสดง icon + จำนวน turn ที่เหลือ ที่การ์ดบนสนาม
 * (ฟังก์ชันนี้ UI จะอ่าน char.buffs, char.debuffs [])
 */

/**
 * สำหรับใช้ใน battle.js:
 * - ก่อนเริ่ม turn, processStatusTurn()
 * - check ว่า stun/skip turn ไม่โจมตี
 * - หลัง heal/attack/addEffect ใช้ addEffect()
 * - ลบสถานะ removeStatus(char, type)
 */

// ---- Export (global assignment)
window.effectEngine = {
    addEffect,
    processStatusTurn,
    isStunnedOrSkipped,
    removeStatus
};