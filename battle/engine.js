// engine.js - Battle Engine (Auto Battle แบบ Turn-based รองรับการเชื่อมต่อกับ character/team/stat/skill)

class BattleEngine {
    constructor(team, enemies) {
        // team และ enemies: array [{...stat...}]
        this.team = team.map((c, i) => ({ ...JSON.parse(JSON.stringify(c)), side: 'player', currentHP: c.stats.hp, index: i }));
        this.enemies = enemies.map((c, i) => ({ ...JSON.parse(JSON.stringify(c)), side: 'enemy', currentHP: c.stats.hp, index: i }));
        this.turnOrder = [];
        this.history = [];
        this.finished = false;
        this.result = null; // 'win', 'lose', 'draw'
        this._buildTurnOrder();
    }

    _buildTurnOrder() {
        // รวมเลย ทั้งหมดเรียง spd จากมากไปน้อย (สุ่มเล็กน้อยป้องกัน SPD เท่ากัน)
        this.turnOrder = [...this.team, ...this.enemies]
            .filter(e => e.currentHP > 0)
            .sort((a, b) => b.stats.spd + Math.random() - (a.stats.spd + Math.random()));
        this.turnIndex = 0;
    }

    _oppositeSide(actor) {
        return actor.side === 'player' ? this.enemies : this.team;
    }

    nextTurn() {
        if (this.finished) return;
        // เลือกคนที่จะเดิน
        if (this.turnOrder.length === 0) this._buildTurnOrder();
        if (!this.turnOrder.length) return;
        const actor = this.turnOrder[this.turnIndex % this.turnOrder.length];
        if (actor.currentHP <= 0) {
            this._buildTurnOrder();
            this.turnIndex++;
            return;
        }
        // Auto: เลือกเป้าหมาย HP ต่่ำสุดของฝั่งตรงข้ามที่มีชีวิต
        const targets = this._oppositeSide(actor).filter(t => t.currentHP > 0);
        // พิเศษ: Heal ถ้ามีสกิล heal แล้ว HP ต่ำกว่า 50% ให้ heal ก่อน
        let didHeal = false;
        if (actor.skills && actor.skills.some(s => s.toLowerCase().includes('heal'))) {
            if (actor.currentHP < actor.stats.hp / 2) {
                // Heal = basic +20%maxHP
                const healAmt = Math.round(actor.stats.hp * 0.2 + 100);
                actor.currentHP = Math.min(actor.currentHP + healAmt, actor.stats.hp);
                this.history.push({ type: 'heal', actor: actor.name, value: healAmt });
                didHeal = true;
            }
        }
        if (!didHeal) {
            // โจมตี (สกิลเลือก atk ปกติ)
            if (targets.length) {
                // อาจสุ่ม skill ถ้ามี (สมมติใช้ skill 50% หรือถ้าไม่มีใช้ ATK ปกติ)
                const useSkill = actor.skills && Math.random() < 0.5;
                let skillUsed = "โจมตีธรรมดา";
                let effect = '';
                let baseDMG = actor.stats.atk + Math.round(Math.random() * 10);
                if (useSkill) {
                    // สมมติ: skill 1 = buff, skill 2 = debuff, skill 3 = AoE
                    if (actor.skills[0]?.toLowerCase().includes('burn')) {
                        baseDMG += 30;
                        effect = 'burn';
                        skillUsed = actor.skills[0];
                    } else if (actor.skills[0]?.toLowerCase().includes('stun')) {
                        skillUsed = actor.skills[0];
                        effect = 'stun';
                    } else if (actor.skills && actor.skills.length > 2 && Math.random() < 0.45) {
                        // AoE: โจมตีทุกคน
                        const damage = Math.round(baseDMG * 0.75);
                        for (const tar of targets) {
                            tar.currentHP = Math.max(tar.currentHP - damage, 0);
                        }
                        this.history.push({
                            type: 'aoe',
                            actor: actor.name,
                            value: damage,
                            targets: targets.map(t => t.name),
                            skill: actor.skills[2]
                        });
                        this._checkBattleEnd();
                        this._buildTurnOrder();
                        this.turnIndex++;
                        return;
                    }
                }
                // Single target
                let target = targets[Math.floor(Math.random() * targets.length)];
                // Damage/Heal scale, add buff/debuff if needed
                // ธาตุแพ้ทาง: Fire > Wind > Earth > Water > Fire, Light <--> Dark
                let adv = 0;
                if (this._isAdvantage(actor.element, target.element)) baseDMG = Math.round(baseDMG * 1.3);
                if (this._isDisadvantage(actor.element, target.element)) baseDMG = Math.round(baseDMG * 0.77);
                // โจมตี - กัน (def)
                let realDMG = Math.max(baseDMG - Math.round(target.stats.def * (effect === 'burn' ? 0.25 : 0.36)), 10);
                target.currentHP = Math.max(target.currentHP - realDMG, 0);
                this.history.push({
                    type: 'attack',
                    actor: actor.name,
                    target: target.name,
                    value: realDMG,
                    skill: skillUsed,
                    effect
                });
            }
        }
        this._checkBattleEnd();
        this._buildTurnOrder();
        this.turnIndex++;
    }

    _isAdvantage(a, b) {
        const map = { 'Fire': 'Wind', 'Wind': 'Earth', 'Earth': 'Water', 'Water': 'Fire', 'Light': 'Dark', 'Dark': 'Light' };
        return map[a] === b;
    }
    _isDisadvantage(a, b) {
        const map = { 'Fire': 'Water', 'Water': 'Earth', 'Earth': 'Wind', 'Wind': 'Fire', 'Light': 'Light', 'Dark': 'Dark' };
        return map[a] === b || (a === b && (a === 'Light' || a === 'Dark'));
    }

    _checkBattleEnd() {
        if (this.team.every(c => c.currentHP <= 0) && this.enemies.every(c => c.currentHP <= 0)) {
            this.finished = true; this.result = 'draw';
        } else if (this.team.every(c => c.currentHP <= 0)) {
            this.finished = true; this.result = 'lose';
        } else if (this.enemies.every(c => c.currentHP <= 0)) {
            this.finished = true; this.result = 'win';
        }
    }

    runAutoFull() {
        // วิ่ง auto แตะจนจบ
        let loopCount = 0;
        while (!this.finished && loopCount < 150) {
            this.nextTurn();
            loopCount++;
        }
    }

    getLog() { return this.history; }
    getResult() { return this.result; }
    getState() {
        return {
            team: this.team.map(c => ({ name: c.name, hp: c.currentHP, maxhp: c.stats.hp })),
            enemy: this.enemies.map(c => ({ name: c.name, hp: c.currentHP, maxhp: c.stats.hp })),
            finished: this.finished, result: this.result
        };
    }
}

// สำหรับ browser global
window.BattleEngine = BattleEngine;

// end engine.js