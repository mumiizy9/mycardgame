// result.js (รีไรท์ใหม่หมด 2024/06, โค้ดไม่ซ้ำเดิม)
// Epic Seven Card Battle - Modular Result + Reward System

/*
  Design Objectives:
    - Single responsibility: จัดการผลลัพธ์หลังจบด่านอย่างเดียว
    - ง่ายต่อ test, ปรับ theme, ต่อกับ reward/inventory/character
    - ไม่ชนกับ UI บาท, ทุก event/การแจ้งเตือนผลลัพธ์ ต้อง popup เดียว, ไม่แจม slide ดาเมจ
    - ต่อกับระบบ core ผ่านฟังก์ชัน API เหมือนเดิม (window.renderBattleResult, rewardEngine.give ฯลฯ)
    - Customizable hook พร้อม afterClose/callback แบบ Promise
*/

// =================[ STATE + CONST ]=================

const RESULT_POPUP_ID = "battleResultV2";

// =================[ MAIN CONTROLLER ]=================

/**
 * รับผลการต่อสู้ หลัง battle/stage จบ เพื่อ popup exp, ดรอป, level up, ฯลฯ
 * @param {Object} params - { state, heroes, monsters, drops, exp, afterClose }
 */
window.renderBattleResult = async function (params = {}) {
  // Basic fields
  const result = Object.assign(
    { state: "lose", exp: null, drops: [], heroes: null },
    params
  );
  // 1. โหลดทีม user ข้ามลำดับเพื่อความมั่นใจ meta+exp sync
  const teamIds = loadUserTeam();
  const heroList = await getCharList(teamIds);
  // 2. Calculate EXP
  const exp = Number.isFinite(result.exp)
    ? result.exp
    : (result.state === "win"
        ? getCfg("exp.base_win", 60)
        : getCfg("exp.base_lose", 18));
  const dropItems = Array.isArray(result.drops) ? mergeRewards(result.drops) : [];
  // 3. จัดการเควสต์/mission เพิ่ม tracking หรือแก้ไขได้ผ่าน hook:
  if (typeof window.increaseQuestProgress === "function" && result.state === "win") {
    window.increaseQuestProgress("daily_login");
  }
  // 4. อัปเดต EXP/เลเวล พร้อม list ที่ up
  const levelUpNames = processLevel(heroList, exp);
  // 5. ให้รางวัล (item, char ลง inventory)
  giveReward(dropItems);
  // 6. Render popup
  const html = genResultHTML(result, heroList, exp, dropItems, levelUpNames);
  window.openPopup(
    RESULT_POPUP_ID,
    html,
    "large",
    result.state === "win" ? t("popup.result_win") : t("popup.result_lose"),
    {
      onClose: typeof result.afterClose === "function"
        ? result.afterClose
        : undefined,
    }
  );
  // เชื่อม stageEngine
  if (typeof window.stageEngine?.end === "function" && result.stage) {
    window.stageEngine.end(result.state);
  }
};

// =================[ CORE LOGIC + REWARDS ]=================

function processLevel(heroList, expUp) {
  let list = [];
  for (let i = 0; i < heroList.length; ++i) {
    const c = heroList[i];
    if (!c) continue;
    let baseLv = c.level || 1,
      baseExp = c.exp || 0,
      maxExp = c.exp_max || 99999;
    c.exp = baseExp + expUp;
    let up = false;
    while (c.exp >= maxExp) {
      c.exp -= maxExp;
      c.level = (c.level || 1) + 1;
      up = true;
    }
    if (up) list.push(c.name);
    // sync
    localStorage.setItem("char_" + c.id, JSON.stringify(c));
  }
  return list;
}

function giveReward(arr) {
  if (!arr || !arr.length) return;
  arr.forEach(rw => {
    if (rw.type === "item") window.addToInventory?.(rw.id, rw.qty);
    if (rw.type === "character") window.collectCharacter?.(rw.id);
  });
}

function mergeRewards(rew) {
  let byId = {};
  (rew || []).forEach(r => {
    if (!r || !r.id) return;
    let k = r.type + ":" + r.id;
    if (!byId[k]) byId[k] = { ...r, qty: r.qty || 1 };
    else byId[k].qty += r.qty || 1;
  });
  return Object.values(byId);
}

// =================[ HTML RENDER ]=================

function genResultHTML(result, heroList, exp, dropItems, levedNames) {
  let html = '';
  // Header/State
  html += `<div style="text-align:center;font-size:2em;margin:2px 0 14px 0;">
    ${result.state === "win"
      ? "🏆 <b style='color:#4ffcbb'>" + t("popup.result_win") + "</b>"
      : "❌ <b style='color:#fb6'>" + t("popup.result_lose") + "</b>"}
    </div>
    <div style="font-size:1.13em;text-align:center;color:#aef;margin-bottom:7px;">
      ${t('battle.exp_gain')} +${exp}
    </div>
    <hr style="margin:11px 0 17px 0;border-color:#1888b088;">
  `;
  // Team heroes
  html += `<table style="width:98%;margin:0 auto 1em auto;"><tr>`;
  html += heroList
    .map(
      h =>
        `<td style="text-align:center;">
         <img src="img/char/${h.img || "noimg.png"}" alt="${h.name}" style="width:34px;border-radius:50%;box-shadow:0 0 9px #5affb7ee;"><br>
         <b>${h.name || "-"}</b><br>
         Lv.${h.level || "-"} ${
           levedNames.includes(h.name)
             ? '<span style="color:#59ff32;"> ↑UP!</span>'
             : ""
         }
        </td>`
    )
    .join("");
  html += `</tr></table>`;

  // Rewards
  if (dropItems.length) {
    html += `<div style="margin:9px 0;font-size:1.08em;color:#fffdbe;">
      ${t('battle.drop_items')} :
    </div>`;
    html += `<div style="display:flex;flex-wrap:wrap;gap:13px 16px;margin-bottom:1em;">`;
    dropItems.forEach(rw => {
      if (rw.type === "item") {
        const meta = window.inventoryEngine?.findItemById(rw.id) || {};
        html += `<div style="background:#26293d;border-radius:9px;padding:9px 11px;">
          <img src="img/item/${meta.img || "noimg.png"}" style="width:25px;border-radius:7px;"><br>
          ${meta.name || rw.id} <br>
          <span style="color:#aff;font-weight:700;">x${rw.qty}</span>
        </div>`;
      } else if (rw.type === "character") {
        html += `<div style="background:#413d23bb;border-radius:9px;padding:8px 10px;">
          <img src="img/char/${rw.id}.png" style="width:27px;border-radius:7px;"><br>
          <span style="color:#acf;font-weight:bold;">${rw.id}</span> 🎴
        </div>`;
      }
    });
    html += `</div>`;
  } else {
    html += `<div style="color:#9df;text-align:center;margin-top:.6em;">${t('inventory.no_item')}</div>`;
  }

  // Button
  html += `<div style="margin:2em 0 0 0;text-align:center;">
      <button class="primary-btn" onclick="closeResultAndReturn()" style="padding:.73em 2.7em;font-size:1.1em;">${t("popup.ok")}</button>
    </div>`;
  return html;
}

// =================[ API: ปิด popup, รีเฟรช ]=================

window.closeResultAndReturn = function () {
  window.closePopup?.(RESULT_POPUP_ID);
  // Reload or return, depends on page/context
  if (
    window.location.pathname.endsWith("index.html") &&
    typeof window.renderBattlefield === "function"
  ) {
    window.renderBattlefield();
  }
  if (typeof window.openStageMapPopup === "function") {
    setTimeout(() => window.openStageMapPopup(), 900);
  }
};

// =================[ UTIL ]=================

function getCfg(key, fallback) {
  try {
    let data =
      window._game_config_cache ||
      JSON.parse(localStorage.getItem("game_config_cache") || "{}");
    let parts = (key || "").split(".");
    for (let k of parts) data = data[k];
    return typeof data !== "undefined" ? data : fallback;
  } catch {
    return fallback;
  }
}

function loadUserTeam() {
  try {
    const t = localStorage.getItem("userTeam");
    return t ? JSON.parse(t) : [];
  } catch {
    return [];
  }
}

async function getCharList(ids) {
  if (!Array.isArray(ids)) return [];
  const all = await Promise.all(
    ids.map(async id => {
      if (!id) return null;
      let cache = null;
      try {
        cache = localStorage.getItem("char_" + id);
      } catch {}
      if (cache) return JSON.parse(cache);
      try {
        const res = await fetch(`data/char/${id}.json`);
        return await res.json();
      } catch {
        return null;
      }
    })
  );
  return all.filter(Boolean);
}

// ===============[ Reward Engine: re-expose ]====================
// ให้โมดูลอื่น เรียก rewardEngine.give() (for popup summarization)
window.rewardEngine = {
  give(arr) {
    let items = Array.isArray(arr) ? arr : [arr];
    let merged = mergeRewards(items);
    giveReward(merged);
    // show summary popup
    const summary = `<div style="text-align:center;">
      <div style="font-size:1.18em;color:#39ffc2;margin-bottom:6px;">ได้รับรางวัล</div>
      ${merged
        .map(
          rw =>
            rw.type === "item"
              ? `<div style="color:#d4f;font-size:.99em;padding:3px;"><b>${window.inventoryEngine?.findItemById(rw.id)?.name || rw.id}</b> x${rw.qty}</div>`
              : `<div style="color:#7bd;font-size:.99em;padding:3px;"><b>${rw.id}</b> 🎴</div>`
        )
        .join("")}
      <button class="primary-btn" style="margin-top:1.1em;" onclick="closePopup();">${
        t("popup.ok") || "OK"
      }</button>
    </div>`;
    window.openPopup?.("rewardSummary", summary, "small", "รางวัล");
  },
};