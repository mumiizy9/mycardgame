// js/reward.js

/**
 * RewardHandler สำหรับทุกระบบที่ต้องแจกของ (drop, quest, redeem, stage)
 * ใช้ร่วมกับ inventory.js, characterCollection.js
 */

window.rewardEngine = {
  /**
   * ให้รางวัลได้ทั้ง item/character/exp/gold ดูโครงสร้าง rewardObj:
   * rewardObj = [{type: "item"/"character"/"exp"/"gold", id: "item_id", qty: n}]
   */
  give: function (rewardObj = []) {
    if (!Array.isArray(rewardObj)) return;

    let htmlList = [];

    rewardObj.forEach(r => {
      if (r.type === "item") {
        window.addToInventory?.(r.id, r.qty || 1);
        htmlList.push(`<div>🎁 ได้รับ <b>${window.inventoryEngine?.findItemById(r.id)?.name || r.id} x${r.qty}</b></div>`);
      } else if (r.type === "character") {
        window.collectCharacter?.(r.id);
        htmlList.push(`<div>🎴 ตัวละคร <b style="color:#99d5ff">${r.id}</b> เข้าคลัง</div>`);
      } else if (r.type === "exp") {
        // +exp ตัวแรกใน team
        let t = JSON.parse(localStorage.getItem('userTeam') || "[]");
        if (t.length) {
          let cid = t[0];
          let cdata = JSON.parse(localStorage.getItem("char_" + cid) || '{}');
          cdata.exp = (cdata.exp || 0) + (r.qty || 1);
          localStorage.setItem("char_" + cid, JSON.stringify(cdata));
          htmlList.push(`<div>⭐ EXP +${r.qty} ให้ตัวแรกในทีม</div>`);
        }
      } else if (r.type === "gold") {
        window.addToInventory?.('gold', r.qty || 1);
        htmlList.push(`<div>💰 Gold +${r.qty}</div>`);
      }
    });

    // Immediate show popup (optional)
    if (htmlList.length) {
      window.openPopup('rewardResult',
        `<div style="text-align:center;color:#74fec9">${htmlList.join('')}
          <button class="primary-btn" style="margin-top:16px" onclick="closePopup()">ตกลง</button>
        </div>`, 'small', 'ได้รับรางวัล!'
      );
    }
  }
};