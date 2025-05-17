// js/shop.js - Epic Seven Clone Frontend Shop System

let shopData = [];
let purchaseHistory = {}; // Log per user/day: { shopId_itemId: numBought }

async function loadShopData() {
    if (shopData.length) return;
    let res = await fetch('data/shop.json').then(r => r.json());
    shopData = res.shops;
}

function loadShopHistory() {
    try {
        purchaseHistory = JSON.parse(localStorage.getItem('shop_purchase_history') || '{}');
    } catch { purchaseHistory = {}; }
}

function saveShopHistory() {
    localStorage.setItem('shop_purchase_history', JSON.stringify(purchaseHistory));
}

// ---------- Render UI ----------
async function openShopPopup(shopId = "main") {
    await loadShopData(); loadShopHistory();
    let shop = shopData.find(s => s.id === shopId && s.enabled);
    if (!shop) {
        window.openPopup('shop', `<div>ไม่พบร้านค้านี้ หรือร้านค้านี้ปิดอยู่</div><button class="secondary-btn" onclick="closePopup()">ปิด</button>`, 'large', 'ร้านค้า');
        return;
    }

    let html = `
      <div style="font-size:1.14em;color:#dac1ff;margin-bottom:6px;">${shop.desc || ''}</div>
      <div style="display:flex;gap:17px;flex-wrap:wrap;align-items:stretch;">
        ${shop.items.filter(i => i.enabled).map(item => renderShopItem(shop, item)).join('')}
      </div>
      <div style="text-align:right;margin-top:23px;">
        <button class="secondary-btn" onclick="closePopup()">ปิด</button>
      </div>
    `;

    window.openPopup('shop', html, 'large', shop.name);
    renderShopLiveUI(shop.id);
}

// Helper แสดงสินค้า 1 อัน
function renderShopItem(shop, item) {
    let inv = window.inventoryEngine?.list() || [];
    let priceOwned = inv.find(i => i.id === item.price_item)?.qty || 0;
    let itemData = window.inventoryEngine.findItemById(item.item_id) || {};
    // ซื้อไปแล้วกี่ครั้งวันนี้
    let key = `${shop.id}_${item.id}_${getTodayStr()}`;
    let bought = purchaseHistory[key] || 0;
    let canBuy = item.can_buy && bought < item.can_buy;
    let canBuyToday = item.daily_limit ? bought < item.daily_limit : true;
    let disabled = !canBuy || !canBuyToday || priceOwned < item.price_amount;

    return `
      <div style="background:#223246;border:2px solid #53a0fa5c;border-radius:13px;min-width:162px;flex:1 0 174px;padding:14px 12px 18px 12px;margin-bottom:.8em;display:flex;flex-direction:column;align-items:center;justify-content:space-between;">
        <img src="img/item/${itemData.img||'noimg.png'}" alt="${itemData.name||item.item_id}" style="width:38px;margin-bottom:7px;" />
        <div style="font-size:1.1em;font-weight:bold;">${itemData.name||item.item_id} x${item.amount}</div>
        <div style="color:#ffbe77;font-size:.98em;">${item.desc || (itemData && itemData.description)||''}</div>
        <div style="margin:.8em 0;font-size:.95em;">
          <b>ราคา:</b> <span style="color: gold;font-weight:bold;">${item.price_amount}</span> <img src="img/item/${item.price_item}.png" style="width:18px;vertical-align:middle" /> 
          <br/>
          <span style="font-size:.97em;color:#cdf;">คงเหลือ: ${priceOwned}</span>
        </div>
        ${item.daily_limit ? `<div style="color:#9eecff;font-size:.92em;margin:.4em 0;">วันนี้ซื้อแล้ว: ${bought} / ${item.daily_limit}</div>` : ''}
        <button class="primary-btn" style="padding:6px 1.4em;font-size:.97em;" onclick="buyShopItem('${shop.id}','${item.id}')" ${disabled?"disabled":""}>${disabled?'ซื้อไม่ได้':'ซื้อ'}</button>
      </div>
    `;
}

// ---------- Buy flow ----------
window.buyShopItem = function(shopId, itemId) {
    let shop = shopData.find(s => s.id === shopId);
    if (!shop) return;
    let item = shop.items.find(i => i.id === itemId);
    if (!item) return;
    let key = `${shopId}_${itemId}_${getTodayStr()}`;
    let bought = purchaseHistory[key] || 0;
    if (item.can_buy && bought >= item.can_buy) return alert("ถึงจำนวนรอบสูงสุดแล้ว");
    if (item.daily_limit && bought >= item.daily_limit) return alert("ถึงจำนวนจำกัดรายวันแล้ว");
    let inv = window.inventoryEngine?.list() || [];
    let owned = inv.find(i => i.id === item.price_item)?.qty || 0;
    if (owned < item.price_amount) return alert("ทรัพยากรไม่เพียงพอ");
    // confirm popup
    let itemInfo = window.inventoryEngine.findItemById(item.item_id) || {};
    window.openPopup('confirmBuy', `
      <div style="text-align:center;">
        <img src="img/item/${itemInfo.img||'noimg.png'}" style="width:49px;margin-bottom:8px;">
        <div style="font-size:1.14em;font-weight:bold;margin-bottom:7px;">${itemInfo.name || item.item_id}</div>
        <div style="margin-bottom:8px;">${item.desc || ''} <br> <b>x${item.amount}</b></div>
        <div style="color:gold;font-size:.98em;">ราคา ${item.price_amount} <img src="img/item/${item.price_item}.png" style="width:17px;vertical-align:middle" /> </div>
        <button onclick="confirmShopBuy('${shopId}','${item.id}')" class="primary-btn" style="margin:.7em 1em 0 1em;">ยืนยันซื้อ</button>
        <button onclick="closePopup()" class="secondary-btn" style="margin:.7em 0 0 0;">ยกเลิก</button>
      </div>
    `, 'small', 'ยืนยันสั่งซื้อ');
}

// ดำเนินการซื้อจริง
window.confirmShopBuy = function(shopId, itemId) {
    let shop = shopData.find(s => s.id === shopId);
    if (!shop) return;
    let item = shop.items.find(i => i.id === itemId);
    let key = `${shopId}_${itemId}_${getTodayStr()}`;
    let bought = purchaseHistory[key] || 0;
    if (item.can_buy && bought >= item.can_buy) return alert("ถึงจำนวนสูงสุดแล้ว");
    if (item.daily_limit && bought >= item.daily_limit) return alert("ถึงจำนวนจำกัดรายวันแล้ว");
    let inv = window.inventoryEngine?.list() || [];
    let own = inv.find(i => i.id === item.price_item);
    if (!own || own.qty < item.price_amount) return alert("ทรัพยากรไม่พอ");

    window.inventoryEngine.remove(item.price_item, item.price_amount);
    window.inventoryEngine.add(item.item_id, item.amount);
    purchaseHistory[key] = (bought || 0) + 1;
    saveShopHistory();
    closePopup('confirmBuy');
    // popup สรุป
    window.openPopup('shopResult', `
      <div style="text-align:center;color:#53fdc2;">
        <div style="font-size:1.15em;margin:11px 0;"><b>ซื้อสำเร็จ        !</b></div>
        <img src="img/item/${item.item_id}.png" style="width:47px;" />
        <div>ได้รับ <b>${window.inventoryEngine.findItemById(item.item_id)?.name || item.item_id} x${item.amount}</b></div>
        <div style="margin-top:13px;"><button class="primary-btn" onclick="closePopup();openShopPopup('${shopId}')">กลับหน้าร้าน</button></div>
      </div>
    `, 'small', 'ซื้อสำเร็จ');
}

// Helper: date string ต่อวัน
function getTodayStr() {
    let d = new Date();
    return d.getFullYear().toString() + (d.getMonth()+1).toString().padStart(2,"0") + d.getDate().toString().padStart(2,"0");
}

// Render shop item area live
function renderShopLiveUI(shopId) {
    // สามารถ refresh ปริมาณเงิน, จำนวนรอบในแต่ละปุ่มหลังซื้อได้ถ้าต้องการ
}

// Auto menu bind
document.addEventListener('DOMContentLoaded', () => {
    let btn = document.getElementById('btnShop');
    if (btn) btn.onclick = () => openShopPopup('main');
});

// Expose global
window.shopEngine = {
    open: openShopPopup,
    reload: loadShopData
};
