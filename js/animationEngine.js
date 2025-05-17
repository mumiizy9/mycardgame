/* Epic Seven Card Auto Battle - Animation Engine */
/* วางใน /js/animationEngine.js */

window.animationEngine = (function () {
    /** Card slide animation to attack */
    async function animateAttackCard(fromIdx, toIdx, fromSide, toSide, type = 'single') {
        const fromCard = document.getElementById(`${fromSide}${fromIdx}`);
        const toCard = document.getElementById(`${toSide}${toIdx}`);
        if (!fromCard || !toCard) return;
        // สร้าง overlay
        const rectFrom = fromCard.getBoundingClientRect();
        const rectTo = toCard.getBoundingClientRect();
        // Absolute overlay clone
        const clone = fromCard.cloneNode(true);
        clone.style.position = "fixed";
        clone.style.left = rectFrom.left + 'px';
        clone.style.top = rectFrom.top + 'px';
        clone.style.width = rectFrom.width + 'px';
        clone.style.zIndex = "2000";
        clone.style.transition = 'all 0.35s cubic-bezier(.6,0,.2,1.4)';
        // Hide original
        fromCard.style.opacity = "0.4";
        document.body.appendChild(clone);
        await sleep(30);

        // เลื่อนการ์ดไปตำแหน่งเป้าหมาย
        clone.style.left = rectTo.left + 'px';
        clone.style.top = rectTo.top + 'px';
        clone.style.boxShadow = "0 0 32px #e7ff79c8, 0 0 80px #e3e37044";
        clone.style.transform = "scale(1.10) rotate(-3deg)";
        await sleep(330);

        // Flash/Shake เป้าหมาย
        shakeCard(toCard);
        // Remove overlay
        setTimeout(() => {
            clone.remove();
            fromCard.style.opacity = "1";
        }, 110);

        await sleep(180);
    }

    /** AoE Animation (wave blast) */
    async function animateAoEAttack(fromIdx, fromSide, toSide, targets) {
        const fromCard = document.getElementById(`${fromSide}${fromIdx}`);
        if (!fromCard) return;
        // Pulse the card
        pulseCard(fromCard, "#f2d13e");
        // Wave line to center
        targets.forEach((t) => {
            const tgt = document.getElementById(`${toSide}${t}`);
            if (tgt) {
                flashCard(tgt, "#ffd058");
                shakeCard(tgt);
            }
        });
        await sleep(340);
    }

    /** Heal effect (green glow, upward effect) */
    async function animateHeal(toIdx, toSide) {
        const tgt = document.getElementById(`${toSide}${toIdx}`);
        if (!tgt) return;
        glowCard(tgt, "#68eccc");
        // Heal "plus" popup up
        let plus = document.createElement('span');
        plus.textContent = "+HP";
        plus.style = "color:#68fdd8;font-weight:bold;font-size:1.18em;position:absolute;left:42%;top:17%;opacity:0;transition:top .4s,opacity .2s;";
        tgt.appendChild(plus);
        setTimeout(() => {
            plus.style.top = "-6%";
            plus.style.opacity = "1";
        }, 20);
        setTimeout(() => plus.remove(), 650);
        await sleep(390);
    }

    /** Buff/Debuff effect on card */
    async function animateBuffDebuff(toIdx, toSide, type = "buff") {
        const tgt = document.getElementById(`${toSide}${toIdx}`);
        if (!tgt) return;
        glowCard(tgt, type === "buff" ? "#98deff" : "#ff7b7b");
        await sleep(260);
    }

    // --- Utilities (Shake, Glow, Flash, Pulse) ---
    function shakeCard(card) {
        if (!card) return;
        card.animate([
            { transform: "translateX(0)" },
            { transform: "translateX(-12px)" },
            { transform: "translateX(13px)" },
            { transform: "translateX(-7px)" },
            { transform: "translateX(0)" }
        ], { duration: 320, easing: "ease-in" });
    }
    function glowCard(card, color) {
        if (!card) return;
        card.style.boxShadow = `0 0 15px 6px ${color}66`;
        setTimeout(() => (card.style.boxShadow = ""), 380);
    }
    function flashCard(card, color = "#fff") {
        if (!card) return;
        card.style.background = color;
        setTimeout(() => (card.style.background = ""), 170);
    }
    function pulseCard(card, color) {
        if (!card) return;
        card.animate([
            { boxShadow: `0 0 0px 0px ${color}40` },
            { boxShadow: `0 0 15px 8px ${color}bb` },
            { boxShadow: `0 0 0px 0px ${color}00` }
        ], { duration: 410 });
    }
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // --- Expose ---

    return {
        animateAttackCard,
        animateAoEAttack,
        animateHeal,
        animateBuffDebuff,
        shakeCard,
        glowCard,
        flashCard,
        pulseCard,
        sleep
    };
})();