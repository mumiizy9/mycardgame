// js/ai.js
/**
 * Epic Seven - AI Auto Battle Engine (แยก Module)
 * ใช้เลือก skill และ target ใน battle.js
 */

/**
 * Pick skill ที่ควรใช้ (เลือกโดย AI) - แบบ modular
 * @param {Object} char - (obj) ตัวละคร
 * @param {Array<number>} cooldowns - cooldown แต่ละ skill [s1, s2, s3...]
 * @param {Array<Object>} allies - ฝั่งเดียวกัน (obj)
 * @param {Array<Object>} enemies - ฝั่งตรงข้าม (obj)
 * @return {Object} skill ที่จะใช้
 */
function aiPickSkill(char, cooldowns, allies, enemies) {
    // ถ้ามีบัฟ, heal, ใช้ skill aoe ก่อน (ลำดับ: AoE > Heal/Buff > Single)
    // ใช้เงื่อนไข HP ต่ำ, ศัตรูมาก/น้อย, หรือ CD climate
    let skills = char.skills || [];
    let usable = skills.map((s, i) => ({...s, cd: cooldowns[i] || 0, idx: i }))
        .filter(s => s.cd === 0);

    // (1) Heal/Buff - ใช้ทันทีถ้ามีใน usable skill
    for (let s of usable) {
        if (s.type === 'heal' && needHeal(allies)) return s;
        if (s.type === 'buff' && needBuff(allies, s)) return s;
    }

    // (2) AoE - ถ้า AoE และฝั่งศัตรูมี 2 ตัว+ (หรือ priority)
    for (let s of usable) {
        if ((s.type === 'attack' || s.type === 'aoe') && s.multiplier > 1.5 && (living(enemies) > 1)) {
            return s;
        }
    }

    // (3) Debuff - ตีเป้าที่บัฟแข็งแกร่ง (def break/stun)
    for (let s of usable) {
        if (s.effect && s.effect.debuff) return s;
    }

    // (4) Single Attack - เลือก default
    if (usable.length > 0) return usable[0];
    // fallback: skill 1
    return skills[0];
}

/**
 * Pick target ที่ควรโจมตี (AI)
 * @param {Array<Object>} arr - เป้าหมาย (obj)
 * @param {Object} skill - skill ที่จะใช้
 * @return {Object}
 */
function aiPickTarget(arr, skill = null) {
    // ตีตัว HP น้อยสุดก่อน เว้นถ้า skill เป็น heal/buff
    arr = arr.filter(c => c.alive);
    // Heal: หาเป้าคือฝั่งเรา (lowest HP)
    if (skill && skill.type === 'heal') {
        return arr.sort((a, b) => a.currHp / a.hp - b.currHp / b.hp)[0];
    }
    // Buff: เลือกตัวฝั่งเรา alive
    if (skill && skill.type === 'buff') {
        // แล้วแต่ logic   --> ใส่ให้ทุกคน เลือก index 0
        return arr[0];
    }
    // AoE: ทุกตัวเลย
    if (skill && (skill.type === 'aoe' || (skill.type === 'attack' && skill.multiplier > 1.5))) {
        return arr; // ทั้งแถว enemy
    }
    // Debuff: ตี tank ก่อน (defense/high HP), ถ้าไม่เน้น หา HP น้อยสุด
    let sorted = arr.sort((a, b) => a.currHp - b.currHp);
    return sorted[0];
}

/**
 * ใครในทีม HP ต่ำกว่า 60% ให้ heal
 * @param {Array<Object>} team
 */
function needHeal(team) {
    for (let c of team) {
        if (c.alive && c.currHp / c.hp < 0.6) return true;
    }
    return false;
}

/**
 * เช็คว่าบัฟที่ skill นี้ให้ มีอยู่ในทีมแล้วหรือยัง (ถ้ามีแล้วข้าม)
 * @param {Array<Object>} team
 * @param {Object} skill
 */
function needBuff(team, skill) {
    let buffs = (skill && skill.effect && skill.effect.buff) || [];
    for (let btype of buffs.map(b => b.type)) {
        // ถ้า buff นี้ทุกคนในทีมมีอยู่แล้วหมด ไม่ต้องใช้
        let count = team.filter(c => c.alive && c.buffs && c.buffs.some(bf => bf.type === btype)).length;
        if (count < team.length) return true; // ยังมีคนไม่ได้ buff นี้
    }
    return false;
}

/**
 * จำนวนเป้าหมายที่ยังไม่ตาย
 */
function living(arr) {
    return arr ? arr.filter(c => c.alive).length : 0;
}

// ---- สำหรับใช้งานกับ battle.js ----
// Expose เป็น global เพื่อเรียกใช้
window.aiPickSkill = aiPickSkill;
window.aiPickTarget = aiPickTarget;