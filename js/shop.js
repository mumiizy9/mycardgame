// js/shop.js - UI Rewrite V2 (2024) - Epic Seven Clone Frontend Shop

let shopDataV2 = [];
let purchaseLog = {};
let shopFilter = { text: "", type: "all" };

// โหลดข้อมูลร้านค้าใหม่
async function loadShopDataV2() {
  if (shopDataV2.length) return;
  try {
    const raw = await fetch('data/shop.json').then(r => r.json());
    shopDataV2 = Array.isArray(raw.shops) ? raw.shops : [];
  } catch { shopDataV2 = []; }
}

// โหลดประวัติการซื้อ
function loadShopLog() {
  try {
    purchaseLog = JSON.parse(localStorage.getItem('shop_purchase_log') || '{}');
  } catch { purchaseLog = {}; }
}

// เซฟประวัติการซื้อ
function saveShopLog() {
  localStorage.setItem('shop_purchase_log', JSON.stringify(purchaseLog));
}

// =================== UI SHOP MAIN POPUP ====================

async function openShopCenter(shopId = "main") {
  await loadShopDataV2();
  loadShopLog();
  await window.inventoryEngine?.reloadAll?.();

  let shop = shopDataV2.find(s => s.id === shopId && s.enabled);
  if (!shop) {
    window.openPopup('shop', `<div>ไม่พบร้านค้านี้ หรือปิดอยู่</div><button class="secondary-btn" onclick="closePopup()">ปิด</button>`, 'large', 'ร้านค้า');
    return;
  }

  // Filter, search
  const types = Array.from(new Set(shop.items.map(i => i.type || ""))).filter(x=>!!x);
  let typeSel = `<option value="all">ประเภททั้งหมด</option>` +
      types.map(tp=>`<option value="${tp}">${tp}</option>`).join('');
  let filterHtml = `
    <div style="display:flex;gap:10px 21px;flex-wrap:wrap;margin-bottom:14px;">
      <input type="text" placeholder="ค้นหาชื่อไอเท็ม..." style="flex:2;min-width:170px" id="shopSearchBox" value="${shopFilter.text||""}"/>
      <select id="shopTypeFilter" style="flex:1;min-width:120px">${typeSel}</select>
      <button class="secondary-btn" onclick="resetShopFilter()" style="min-width:62px">รีเซ็ต</button>
    </div>
  `;

  // Filter items
  let items = shop.items.filter(x=>x.enabled);
  if (shopFilter.text) {
    items = items.filter(i=>{
      let info = window.inventoryEngine.findItemById(i.item_id) || {};
      return (info.name||i.item_id||"").toLowerCase().includes(shopFilter.text.toLowerCase());
    });
  }
  if (shopFilter.type && shopFilter.type !== "all") {
    items = items.filter(i => (i.type||"") === shopFilter.type);
  }
  // Sort by: rare first, price, name
  items = items.slice().sort((a, b)=>{
    let ait = window.inventoryEngine.findItemById(a.item_id) || {};
    let bit = window.inventoryEngine.findItemById(b.item_id) || {};
    return (bit.rarity||0)-(ait.rarity||0) || (a.price_amount||0)-(b.price_amount||0) || ((ait.name||a.item_id||"")+(bit.name||b.item_id||""));
  });

  let itemHtml = items.length
    ? items.map(item => renderShopCard(shop, item)).join("")
    : `<div style="color:#eee;text-align:center;padding:1.7em 0">ไม่พบสินค้าที่ต้องการ</div>`;
  
  let mainHtml = `
    ${filterHtml}
    <div style="display: grid;grid-template-columns: repeat(auto-fit,minmax(210px,1fr));gap:18px;" id="shopGridArea">
    ${itemHtml}
    </div>
    <div style="margin-top:17px;text-align:right">
      <button class="secondary-btn" onclick="closePopup()">ปิด</button>
    </div>
  `;
  window.openPopup('shop', mainHtml, 'large', shop.name);

  setTimeout(()=>{
    document.getElementById('shopSearchBox').oninput = ev=>{
      shopFilter.text = ev.target.value; openShopCenter(shopId);
    };
    document.getElementById('shopTypeFilter').value = shopFilter.type||"all";
    document.getElementById('shopTypeFilter').onchange = ev=>{
      shopFilter.type = ev.target.value; openShopCenter(shopId);
    };
  }, 100);
}
window.openShopCenter = openShopCenter;

// Shop Card - 1 รายการ
function renderShopCard(shop, item) {
  let invList = window.inventoryEngine?.list() || [];
  let itemMeta = window.inventoryEngine.findItemById(item.item_id) || {};
  let haveQty = invList.find(i=>i.id===item.item_id)?.qty || 0;
  let priceQty = invList.find(i=>i.id===item.price_item)?.qty || 0;

  let buyKey = `${shop.id}_${item.id}_${todayKey()}`;
  let bought = purchaseLog[buyKey] || 0;
  // ซื้อได้สูงสุด?
  let leftDaily  = item.daily_limit ? (item.daily_limit-bought) : "∞";
  let maxBuyOK = ((!item.daily_limit)||bought<item.daily_limit) && ((!item.can_buy)||bought<item.can_buy);
  let enoughtCash = priceQty >= (item.price_amount||0);
  let canBuy = maxBuyOK && enoughtCash;

  let badge = "";
  if(itemMeta.rarity>=4) badge = `<div style="position:absolute;top:8px;right:13px;color:gold;padding:.1em .8em;background:#3334">★${itemMeta.rarity}</div>`;
  if(haveQty>0) badge += `<div style="position:absolute;bottom:9px;left:13px;background:#71fa9c;color:#202;padding:.09em .7em;font-size:.92em">มีอยู่: ${haveQty}</div>`;

  let outStock = !canBuy;
  let img = itemMeta.img || "noimg.png";

  return `
    <div class="shop-card" style="position:relative;border:2px solid #286af677;border-radius:15px;background:#20253799;padding:14px 11px;margin-bottom:6px;min-height:181px;box-shadow:${outStock ? "0 2px 19px #f2242320":"0 2px 13px #1acf8327"};overflow:hidden;">
      ${badge}
      <div style="text-align:center;"><img src="img/item/${img}" style="width:38px;height:38px" alt="${itemMeta.name||item.item_id}"/></div>
      <div style="font-weight:700;font-size:1.1em;text-align:center;margin:.5em 0 .13em 0;">${itemMeta.name||item.item_id}</div>
      <div style="color:#ade;font-size:.94em;margin-bottom:2px;text-align:center;">${item.desc||itemMeta.description||''}</div>
      <div style="text-align:center;color:#ffd25c;font-size:.95em">จำนวน: <b>${item.amount}</b></div>
      <div style="text-align:center;margin-top:.3em;">
        <span style="color:gold;font-size:1.13em;font-weight:bold;">${item.price_amount}</span>
        <img src="img/item/${item.price_item}.png" style="width:16px;vertical-align:middle" />
        <span style="color:#aef;font-size:.97em;">(คงเหลือ: ${priceQty})</span>
      </div>
      <div style="margin:.37em 0 .17em 0;text-align:center;">
        ${item.daily_limit ? `<span style="color:#b4f6b3;font-size:.95em;">เหลือวันนี้: ${leftDaily}</span>` : ""}
      </div>
      <button class="primary-btn" style="width:100%;padding:.55em 0;font-size:1em;" onclick="promptBuyShopItem('${shop.id}','${item.id}')" ${!canBuy?"disabled":""}>${canBuy?"ซื้อ":"ซื้อไม่ได้"}</button>
    </div>
  `;
}

// Buy: ยืนยัน
window.promptBuyShopItem = function(shopId, itemId) {
  let shop = shopDataV2.find(s=>s.id==shopId);
  let item = shop?.items.find(i=>i.id==itemId);
  if(!shop||!item) return;
  let itemMeta = window.inventoryEngine.findItemById(item.item_id) || {};

  let invList = window.inventoryEngine?.list() || [];
  let priceQty = invList.find(i=>i.id===item.price_item)?.qty || 0;
  let haveQty = invList.find(i=>i.id===item.item_id)?.qty || 0;

  let buyKey = `${shop.id}_${item.id}_${todayKey()}`;
  let bought = purchaseLog[buyKey] || 0;
  let canBuy = ((item.daily_limit ? bought<item.daily_limit:true) && (item.can_buy?bought<item.can_buy:true) && priceQty >= (item.price_amount||0));
  if(!canBuy) return alert("ไม่สามารถซื้อสินค้านี้");

  window.openPopup("shopConfirm", `
    <div style="text-align:center;">
      <img src="img/item/${itemMeta.img||'noimg.png'}" style="width:47px;margin-bottom:8px;" /><br>
      <div style="font-size:1.11em;font-weight:700">${itemMeta.name||item.item_id}</div>
      <div style="margin-bottom:6px;color:#fcf090">${item.desc||itemMeta.description||""}</div>
      <div>ต้องการใช้ <b style="color:gold">${item.price_amount}</b> <img src="img/item/${item.price_item}.png" style="width:16px;vertical-align:middle"/> ซื้อ <b>${itemMeta.name} x${item.amount}</b> ?</div>
      <hr style="margin:11px 0;">
      <button class="primary-btn" onclick="doBuyShopAction('${shop.id}','${item.id}')" style="padding:.5em 2.1em;">ยืนยันซื้อ</button>
      <button class="secondary-btn" style="margin-left:1.1em;" onclick="closePopup()">ยกเลิก</button>
    </div>
  `, 'small', 'ยืนยันสั่งซื้อ');
}

// Buy Action
window.doBuyShopAction = function(shopId,itemId) {
  let shop = shopDataV2.find(s=>s.id==shopId);
  let item = shop?.items.find(i=>i.id==itemId);
  if(!shop||!item) return;
  let buyKey = `${shop.id}_${item.id}_${todayKey()}`;
  let bought = purchaseLog[buyKey]||0;

  let invList = window.inventoryEngine?.list() || [];
  let priceQty = invList.find(i=>i.id===item.price_item)?.qty || 0;
  // Double check
  if(item.daily_limit && bought>=item.daily_limit) return alert("ครบจำกัดรายวันแล้ว");
  if(item.can_buy && bought>=item.can_buy) return alert("ครบโควต้าซื้อแล้ว");
  if(priceQty<item.price_amount) return alert("ทรัพยากรไม่พอ");

  // ลบเงิน, เพิ่มของ
  window.inventoryEngine.remove(item.price_item, item.price_amount);
  window.inventoryEngine.add(item.item_id, item.amount);
  purchaseLog[buyKey] = bought+1;
  saveShopLog();
  closePopup('shopConfirm');

  window.openPopup("shopResult", `
    <div style="color:#19e6b4;font-weight:bold;text-align:center;font-size:1.1em">
      ซื้อสำเร็จ!<br>
      ได้รับ ${window.inventoryEngine.findItemById(item.item_id)?.name||item.item_id} x${item.amount}
    </div>
    <div style="margin:1.5em auto 0 auto;text-align:center;">
      <button class="primary-btn" onclick="closePopup();openShopCenter('${shopId}')">หน้าร้าน</button>
    </div>
  `, "small", "ซื้อสำเร็จ");
}

function resetShopFilter() {
  shopFilter = { text:"", type:"all" }; openShopCenter();
}

function todayKey() {
  let d = new Date();
  return d.getFullYear()+("0"+(d.getMonth()+1)).slice(-2)+("0"+d.getDate()).slice(-2);
}

// =========== MENU BIND ===============
document.addEventListener('DOMContentLoaded', () => {
  let btn = document.getElementById('btnShop');
  if(btn) btn.onclick = ()=>openShopCenter();
});

// Export API
window.shopEngine = {
  open: openShopCenter,
  reload: loadShopDataV2
};