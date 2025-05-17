// js/inventory.js

let itemData = [];
let inventory = [];

/** โหลดไอเท็มจาก data/item.json */
async function loadItemData() {
  if (itemData.length) return;
  itemData = await fetch('data/item.json').then(r => r.json());
}

/** โหลดคลังของผู้เล่น (จาก localStorage) */
function loadInventory() {
  let raw = localStorage.getItem('user_inventory');
  inventory = raw ? JSON.parse(raw) : [];
}

/** เซฟ inventory */
function saveInventory() {
  localStorage.setItem('user_inventory', JSON.stringify(inventory));
}

/** ค้นหาไอเท็มใน data/item.json */
function findItemById(id) {
  return itemData.find(i => i.id === id);
}

/** render UI คลังไอเท็ม */
function renderInventoryUI() {
  let html = `
    <div style="display:flex;flex-direction:column;gap:7px;max-height:420px;overflow-y:auto;">
      ${inventory.length === 0 ? '<div style="color:#bbb;text-align:center;">ยังไม่มีไอเท็ม</div>' :
        inventory.map(item => {
          let info = findItemById(item.id) || {};
          return `
          <div style="display:flex;align-items:center;background:#272b38;padding:10px 16px;border-radius:10px;gap:19px;">
            <div style="width:36px;height:36px;border-radius:8px;background:#201624;display:flex;justify-content:center;align-items:center;">
              ${info.img ? `<img src="img/item/${info.img}" alt="${info.name}" style="width:32px;">` : "🎒"}
            </div>
            <div style="flex-grow:1;">
              <b>${info.name || item.id}</b>
              <div style="font-size:.91em;color:#84ccff;margin-top:2px;">${info.description || ''}</div>
            </div>
            <div style="color:#aaffbe;font-weight:bold;font-size:1.07em;">x${item.qty}</div>
            ${info.usable ? `<button class="primary-btn" style="padding:5px 1em 5px 1em;font-size:.96em;" onclick="useItemPrompt('${item.id}')">ใช้เลย</button>` : ""}
          </div>`;
        }).join('')}
    </div>
  `;
  document.getElementById('inventoryArea').innerHTML = html;
}

/** ฟังก์ชัน popup ยืนยันการใช้ไอเท็ม */
window.useItemPrompt = function(itemId) {
  let info = findItemById(itemId);
  window.openPopup('useItem', `
    <div style="text-align:center;">
      <img src="img/item/${info.img}" style="width:52px;margin-bottom:8px;">
      <div style="font-size:1.09em;">${info.name}</div>
      <div style="margin:.6em 0 1.1em 0;font-size:.97em;color:#7cf;">${info.description}</div>
      <button class="primary-btn" style="margin:.8em .3em 0 .3em;padding:.5em 2.1em;" onclick="useItemNow('${itemId}')">ยืนยันใช้ไอเท็ม</button>
      <button class="secondary-btn" style="margin:.8em .3em 0 .3em;" onclick="closePopup()">ยกเลิก</button>
    </div>
  `, 'small', `ใช้ ${info.name}`);
}

/** ใช้ไอเท็มทันที (ลด qty, เรียก effect, update ui) */
window.useItemNow = function(itemId) {
  let idx = inventory.findIndex(i => i.id === itemId);
  let info = findItemById(itemId);
  if (idx === -1 || !info) return;
  if (inventory[idx].qty <= 0) return;
  // Effect (mock: อัปเดต character / heal / exp อัตโนมัติ)
  if (info.effect && info.effect.exp) {
    // เพิ่ม exp ตัวละครแรกใน team
    let t = JSON.parse(localStorage.getItem('userTeam') || "[]");
    if (t.length) {
      let cid = t[0];
      let cdata = JSON.parse(localStorage.getItem("char_" + cid) || '{}');
      if (cdata) {
        cdata.exp = (cdata.exp || 0) + info.effect.exp;
        localStorage.setItem("char_" + cid, JSON.stringify(cdata));
        alert(`เพิ่ม EXP ให้ ${cdata.name} +${info.effect.exp}`);
      }
    }
  }
  // Heal to selected: (Opt: implement in character select popup)
  // เพิ่ม energy bar (สำหรับ Heal Potion) 
  if (info.effect && info.effect.energy) {
    let energy = Number(localStorage.getItem("user_energy") || 0);
    let maxEnergy = 45; // default, สามารถโยง config/energy.js ได้
    let after = Math.min(maxEnergy, energy + info.effect.energy);
    localStorage.setItem("user_energy", after);
    alert(`เติม Energy +${after - energy}`);
    if (typeof renderEnergyBar === "function") renderEnergyBar();
  }
  inventory[idx].qty--;
  if (inventory[idx].qty === 0) inventory.splice(idx, 1);
  saveInventory();
  window.closePopup();
  renderInventoryUI();
}

/** เพิ่มไอเท็มเข้า inventory */
window.addToInventory = function(itemId, qty) {
  if (!itemId || !qty) return;
  let idx = inventory.findIndex(i => i.id === itemId);
  if (idx >= 0) inventory[idx].qty += qty;
  else inventory.push({ id: itemId, qty });
  saveInventory();
}

/** ลบไอเท็ม (admin, debug) */
window.removeFromInventory = function(itemId, qty) {
  let idx = inventory.findIndex(i => i.id === itemId);
  if (idx >= 0) {
    inventory[idx].qty -= qty;
    if (inventory[idx].qty <= 0) inventory.splice(idx, 1);
    saveInventory();
  }
}

// DOM integration, auto popup on menu
document.addEventListener('DOMContentLoaded', async () => {
  await loadItemData();
  loadInventory();
  // เชื่อม hook popup
  const showInvPopup = () => {
    window.openPopup('inventory', `
      <div id="inventoryArea"></div>
      <div style="text-align:right;"><button class="secondary-btn" onclick="closePopup()">ปิด</button></div>
    `, 'large', "คลังไอเท็ม");
    renderInventoryUI();
  };
  let btn = document.getElementById('btnInventory');
  if (btn) btn.onclick = showInvPopup;

  window.renderInventoryUI = renderInventoryUI;
});

/** เชื่อมต่อ API ให้ระบบอื่นเรียกใช้ */
window.inventoryEngine = {
  load: loadInventory,
  save: saveInventory,
  add: window.addToInventory,
  remove: window.removeFromInventory,
  list: () => inventory,
  findItemById,
  reloadAll: async () => { await loadItemData(); loadInventory(); },
}