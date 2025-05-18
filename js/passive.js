// js/passive.js
//
// Epic Seven Card Battle - Passive Engine (Rewrite 2024/06/Full Modular By GPT)
//
// Features: 
// - Aura/Always/Trigger/Custom support
// - Centralized EventManager
// - Extendable PassiveEvent definition
// - Robust UI popup bind (showDamage, popupPassive)
//

(function () {
  // 1. State: passive list + ready flag
  let passiveMeta = [];
  let fetched = false;

  // 2. Load all passive config from /data/passive.json
  async function loadPassiveMeta() {
    if (fetched && passiveMeta.length) return;
    try {
      passiveMeta = await fetch('data/passive.json').then(r => r.json());
      fetched = true;
    } catch {
      passiveMeta = [];
    }
  }

  // 3. Interface: Passive object logic
  //    Use: passiveManager.applyAllOnInit(character)
  //         passiveManager.trigger('onDamaged', ...)
  class PassiveManager {
    constructor() {
      this._registeredEvents = {};
    }

    // Register all passive effects on char (eg. when start battle)
    async applyAllOnInit(char, context = {}) {
      await loadPassiveMeta();
      if (!char.passive) return;
      let assigned = Array.isArray(char.passive) ? char.passive : [char.passive];

      assigned.forEach(pid => {
        let meta = passiveMeta.find(p => p.id === pid);
        if (!meta) return;

        // 1. Aura/passive stat buff
        if (meta.type === "aura" && meta.effect) {
          Object.entries(meta.effect).forEach(([stat, val]) => {
            char[stat] = (char[stat] || 0) + val;
          });
          // Add passive tag for UI
          char._auraNotes = char._auraNotes || [];
          char._auraNotes.push({ icon: meta.icon, name: meta.name });
        }
        // 2. Apply always type flag (e.g. immunity)
        if (meta.type === "always" && meta.effect) {
          char._alwaysFlags = Object.assign({}, char._alwaysFlags || {}, meta.effect);
        }
        // 3. Register event-driven passive
        if (meta.type === "trigger") {
          char._passiveTriggers = char._passiveTriggers || [];
          char._passiveTriggers.push(meta);
        }
      });
    }

    // Centralized trigger for passive event ("onDamaged", "onHit", etc.)
    trigger(event, char, payload = {}) {
      if (!char?._passiveTriggers) return;
      char._passiveTriggers.forEach(pas => {
        // Matched event (eg. onDamaged), Chance roll
        if (pas.event === event && Math.random() * 100 < (pas.chance ?? 100)) {
          // Effect logic
          if (pas.effect) {
            Object.entries(pas.effect).forEach(([k, v]) => {
              // [Stat] instant gain (if exist)
              if (["hp", "atk", "def", "spd"].includes(k)) {
                char[k] = (char[k] || 0) + v;
                showPassivePopup(char, pas, `+${k.toUpperCase()} ${v}`);
              }
              // Heal
              else if (k === "heal") {
                let amount = typeof v === "number" ? Math.floor(char.hp * v) : 0;
                char.currHp = Math.min(char.hp, char.currHp + amount);
                showPassivePopup(char, pas, `Heal ${amount}`);
                if (window.showDamage) window.showDamage(char.index || 0, char.side || 'hero', -amount, "#5dfcb3");
              }
              // Buff/Debuff
              else if (k === "buff" && window.effectEngine) {
                window.effectEngine.addEffect(char, Array.isArray(v) ? v : [v], "buff");
                showPassivePopup(char, pas, t("popup.equip") + (pas.name ? ": " + pas.name : ''));
              }
              else if (k === "debuff" && window.effectEngine) {
                window.effectEngine.addEffect(char, Array.isArray(v) ? v : [v], "debuff");
                showPassivePopup(char, pas, "DEBUFF");
              }
            });
          }
          // Option: add more handling per game logic
          if (pas.showText) showPassivePopup(char, pas, pas.showText);
        }
      });
    }

    // Register global event hooks (optional for expansion)
    on(event, handler) {
      if (!this._registeredEvents[event]) this._registeredEvents[event] = [];
      this._registeredEvents[event].push(handler);
    }
    emit(event, ...args) {
      (this._registeredEvents[event] || []).forEach(fn => fn(...args));
    }

    // Utility: global filter, eg. check immunity
    static hasImmunity(char) {
      return !!(char?._alwaysFlags?.immune_all || (char.buffs || []).some(b => b.type === "immune"));
    }
  }

  // 4. Passive popup show logic for UI (dmg/heal/other)
  function showPassivePopup(char, pas, txt) {
    // Use UI function, fallback to alert
    let dom = document.getElementById(`${char.side || "hero"}${char.index || 0}`);
    if (dom) {
      let pop = document.createElement('span');
      pop.className = "damage-popup";
      pop.style.color = pas?.color || '#31ebdb';
      pop.innerHTML = `${pas?.icon ? pas.icon + " " : ""}<b>PASSIVE</b>: ${txt || pas?.name || ""}`;
      dom.appendChild(pop);
      setTimeout(() => pop.remove(), 1300);
    } else {
      // fallback for debug/dev
      // alert(`[Passive] ${char.name}: ${txt}`);
    }
  }

  // 5. Export public API
  const passiveEngine = {
    load:   loadPassiveMeta,
    apply:  (char, context) => (new PassiveManager()).applyAllOnInit(char, context),
    trigger: (event, char, payload) => (new PassiveManager()).trigger(event, char, payload),
    // Optional utilities for future
    hasImmunity: PassiveManager.hasImmunity
  };

  // Expose window.passiveEngine for global use
  window.passiveEngine = passiveEngine;

  // (Option) For all system auto-load
  window.addEventListener && window.addEventListener("DOMContentLoaded", () => loadPassiveMeta());

})();

/*
USAGE (like old version—compatible):
- await passiveEngine.apply(char, char.passive);      // at battle start
- passiveEngine.trigger('onDamaged', char, payload);  // eg. in doSkill/onHit
- (UI) showPassivePopup(char, passive, message)       // for display popup

Passive event types: onDamaged, onEndTurn, onHit, onHeal, onBattleInit, etc.
*/