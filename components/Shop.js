// Shop.js - ระบบ Shop สมบูรณ์ (เชื่อม userGold, localStorage, Inventory)

let shopItems = [];
let shopStock = {};
let shopToday = null;

function getShopDayStr() {
  // ใช้วันที่ปัจจุบันเป็น key
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// โหลด store/stock (reset daily)
function loadShopStock() {
  const day = getShopDayStr();
  if (shopToday !== day) {
    localStorage.removeItem('shopStock');
    shopToday = day;
  }
  shopStock = JSON.parse(localStorage.getItem('shopStock') || '{}');
  if (!shopStock.day || shopStock.day !== day) {
    shopStock = { day, stock: {} };
    localStorage.setItem('shopStock', JSON.stringify(shopStock));
  }
}

function saveShopStock() {
  localStorage.setItem('shopStock', JSON.stringify(shopStock));
}

async function initShop() {
  loadShopStock();
  const res = await fetch('./data/shop.json');
  shopItems = await res.json();
  renderShopUI();
}

function renderShopUI() {
  const root = document.getElementById('shop-root');
  if (!root) return;

  const gold = (window.userGold !== undefined ? window.userGold : 0);
  let content = `
    <div class="shop-box">
      <h2>🛒 ร้านค้า</h2>
      <div class="shop-gold">Gold ของคุณ: <span id="shop-user-gold">${gold}</span> 🪙</div>
      <div class="shop-items-list">
        ${shopItems.map(item => {
          const left = item.limit_per_day - (shopStock.stock[item.id] || 0);
          return `
            <div class="shop-item-card">
              <span class="shop-item-icon">${item.icon}</span>
              <b>${item.name}</b>
              <div class="shop-item-desc">${item.desc}</div>
              <div>ราคา: <b>${item.price} 🪙</b></div>
              <div>ซื้อได้วันนี้: <b>${left}/${item.limit_per_day}</b></div>
              <button onclick="buyShopItem('${item.id}')" ${left <= 0 || gold < item.price ? 'disabled' : ''}>
                ซื้อ
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  root.innerHTML = content;
}

window.buyShopItem = function(id) {
  const item = shopItems.find(i => i.id === id);
  if (!item) return;

  let left = item.limit_per_day - (shopStock.stock[item.id] || 0);
  let gold = (window.userGold !== undefined ? window.userGold : 0);

  if (left <= 0) {
    alert("หมดจำนวนซื้อวันนี้");
    return;
  }
  if (gold < item.price) {
    alert("Gold ไม่พอ");
    return;
  }
  // หัก Gold
  window.userGold -= item.price;
  // เพิ่มจำนวนที่ซื้อวันนี้
  shopStock.stock[item.id] = (shopStock.stock[item.id] || 0) + 1;
  saveShopStock();

  // เพิ่มของเข้ากระเป๋า หรือดำเนิน event
  // สำหรับตัวอย่างนี้ ใช้ localStorage และ window.inventory
  window.inventory = window.inventory || {};
  if (item.id.startsWith('item_gold')) {
    // Gold bundle
    let give = 0;
    if (item.id === "item_gold_5000") give = 5000;
    window.userGold += give;
    alert(`🎉 คุณได้รับ +${give} Gold!`);
  } else {
    window.inventory[item.id] = (window.inventory[item.id] || 0) + 1;
    alert(`🎉 คุณได้ ${item.name}`);
  }

  // update Gold ในทุกจุด
  document.getElementById('shop-user-gold').textContent = window.userGold;

  // update UI (shop / gacha / ฯลฯ)
  renderShopUI();
  if (window.renderGachaUI) window.renderGachaUI();
  if (window.renderQuestsUI) window.renderQuestsUI();
};

window.initShop = initShop;