/****************************************
 * admin.js - Card Game Backoffice Admin
 * ---------
 * ฟังก์ชัน CRUD + Render JS Pure
 * รองรับ Characters, Gacha, Equipment, Stages, Quests, Shop, Notify
 * ใช้งานได้ทันทีหน้า dashboard.html (หลังล็อกอิน)
 ****************************************/

const DATA_PATH = '../data/';
const JSON_FILES = {
  characters: 'characters.json',
  gacha: 'gacha.json',
  equipment: 'equipment.json',
  stage: 'stages.json',
  quest: 'quests.json',
  shop: 'shop.json'
};

let adminStore = {
  characters: [],
  gacha: { gacha_pool: [], gacha_cost: 1000 },
  equipment: [],
  stage: [],
  quest: { main: [], daily: [], side: [] },
  shop: [],
  notify: []
};

/* --------- Fetch all initial data ----------- */
async function adminLoadAll() {
  // Characters
  adminStore.characters = await fetch(DATA_PATH + JSON_FILES.characters).then(r=>r.json()).catch(()=>[]);
  // Gacha (special)
  adminStore.gacha = await fetch(DATA_PATH + JSON_FILES.gacha).then(r=>r.json()).catch(()=>({gacha_pool:[],gacha_cost:1000}));
  // Equipment
  adminStore.equipment = await fetch(DATA_PATH + JSON_FILES.equipment).then(r=>r.json()).catch(()=>[]);
  // Stage
  adminStore.stage = await fetch(DATA_PATH + JSON_FILES.stage).then(r=>r.json()).catch(()=>[]);
  // Quest
  adminStore.quest = await fetch(DATA_PATH + JSON_FILES.quest).then(r=>r.json()).catch(()=>({main:[],daily:[],side:[]}));
  // Shop
  adminStore.shop = await fetch(DATA_PATH + JSON_FILES.shop).then(r=>r.json()).catch(()=>[]);
  // Notify (local, for admin use only)
  adminStore.notify = JSON.parse(localStorage.getItem('adminNotify') || '[]');
  adminIfEmptyNotify();
  // Render all
  renderAllDataTables();
}
window.onload = adminLoadAll;

/* -------- Helper: Default Notify --------- */
function adminIfEmptyNotify() {
  if (!adminStore.notify.length) adminStore.notify = [
    { type: "announce", icon: "📢", msg: "อัปเดตระบบหลังบ้าน", time: "วันนี้" },
    { type: "reward", icon: "🎁", msg: "แจกไอเทมพิเศษ เข้าร่วม!", time: "เดือนนี้" }
  ];
}

/* --------- Render (master) -------- */
function renderAllDataTables() {
  renderCharTable();
  renderGachaTable();
  renderEquipTable();
  renderStageTable();
  renderQuestTable();
  renderShopTable();
  renderNotifyTable();
}

/* ===============================
   Characters (Table + CRUD)
   =============================== */
function renderCharTable() {
  const arr = adminStore.characters;
  const list = arr.map((v,i)=>`
  <tr>
    <td><input class="input-text" type="text" value="${v.id}"></td>
    <td><input class="input-text" type="text" value="${v.name}"></td>
    <td><input class="input-text" type="text" value="${v.job}"></td>
    <td>
      <select>${['Fire','Water','Earth','Wind','Light','Dark'].map(e=>`<option${v.element===e?" selected":""}>${e}</option>`)}</select>
    </td>
    <td><input class="input-text" type="number" min="1" max="99" value="${v.level||1}"></td>
    <td><input class="input-text" type="number" min="1" max="6" value="${v.rarity||1}"></td>
    <td>
      <input class="input-text" type="number" min="1" value="${v.stats.hp||0}" style="width:65px;"> HP &nbsp;
      <input class="input-text" type="number" min="0" value="${v.stats.atk||0}" style="width:65px;"> ATK&nbsp;
      <input class="input-text" type="number" min="0" value="${v.stats.def||0}" style="width:65px;"> DEF&nbsp;
      <input class="input-text" type="number" min="0" value="${v.stats.spd||0}" style="width:65px;"> SPD
    </td>
    <td><input class="input-text" type="text" value="${(v.skills||[]).join(', ')}"></td>
    <td>
      <button class="admin-save-btn" onclick="saveChar(${i})">💾</button>
      <button class="admin-del-btn" onclick="delRow('characters',${i})">🗑️</button>
    </td>
  </tr>
  `).join('');
  document.getElementById('table-characters').innerHTML = `
  <table>
    <thead><tr>
      <th>ID</th><th>Name</th><th>Job</th><th>Element</th><th>LV</th><th>Rarity</th>
      <th>Stats</th><th>Skills</th><th>Action</th>
    </tr></thead>
    <tbody>${list}</tbody>
  </table>
  `;
}
window.saveChar = function(idx){
  // Save changes from table row
  let row = document.getElementById('table-characters').getElementsByTagName('tbody')[0].rows[idx].children;
  let ch = adminStore.characters[idx];
  ch.id = row[0].querySelector('input').value.trim();
  ch.name = row[1].querySelector('input').value.trim();
  ch.job = row[2].querySelector('input').value.trim();
  ch.element = row[3].querySelector('select').value;
  ch.level = parseInt(row[4].querySelector('input').value);
  ch.rarity = parseInt(row[5].querySelector('input').value);
  ch.stats.hp  = parseInt(row[6].querySelectorAll('input')[0].value);
  ch.stats.atk = parseInt(row[6].querySelectorAll('input')[1].value);
  ch.stats.def = parseInt(row[6].querySelectorAll('input')[2].value);
  ch.stats.spd = parseInt(row[6].querySelectorAll('input')[3].value);
  ch.skills = row[7].querySelector('input').value.split(',').map(s=>s.trim());
  renderCharTable();
  alert('💾 บันทึกสำเร็จ');
};
window.delRow = function(section, i){
  if(!confirm('ลบรายการนี้?')) return;
  adminStore[section].splice(i,1);
  renderAllDataTables();
};
document.getElementById('add-character-btn').onclick = function(){
  adminStore.characters.push({
    id:'id'+(+new Date()), name:'', job:'', element:'Fire', level:1, rarity:3,
    stats: {hp:1000,atk:100,def:100,spd:80}, skills:[]
  });
  renderCharTable();
};
document.getElementById('export-characters').onclick = ()=>downloadJSON('characters.json', adminStore.characters);

/* ===============================
   Gacha Pool (Table + CRUD)
   =============================== */
function renderGachaTable() {
  const arr = adminStore.gacha.gacha_pool;
  const list = arr.map((v,i)=>`
    <tr>
      <td><input class="input-text" type="text" value="${v.character_id}"></td>
      <td><input class="input-text" type="number" value="${v.weight||100}"></td>
      <td>
        <button class="admin-save-btn" onclick="saveGacha(${i})">💾</button>
        <button class="admin-del-btn" onclick="delGacha(${i})">🗑️</button>
      </td>
    </tr>
  `).join('');
  document.getElementById('table-gacha').innerHTML = `
  <table>
    <thead><tr>
      <th>CharacterID</th><th>Weight</th><th>Action</th>
    </tr></thead>
    <tbody>${list}</tbody>
  </table>
  <div>Cost: <input id="gacha-cost" value="${adminStore.gacha.gacha_cost}" type="number" min="0" style="width:80px;"> &nbsp;
    <button onclick="saveGachaCost()">💾 บันทึก Cost</button>
  </div>
  `;
}
window.saveGacha = function(idx){
  let row = document.getElementById('table-gacha').getElementsByTagName('tbody')[0].rows[idx].children;
  let v = adminStore.gacha.gacha_pool[idx];
  v.character_id = row[0].querySelector('input').value.trim();
  v.weight = parseInt(row[1].querySelector('input').value);
  renderGachaTable();
  alert('💾 Gacha saved');
};
window.delGacha = function(i){ adminStore.gacha.gacha_pool.splice(i,1); renderGachaTable(); };
window.saveGachaCost = function(){
  adminStore.gacha.gacha_cost = parseInt(document.getElementById('gacha-cost').value)||1000;
  alert('💾 Cost saved');
  renderGachaTable();
};
document.getElementById('add-gacha-btn').onclick = ()=>{adminStore.gacha.gacha_pool.push({character_id:'',weight:100}); renderGachaTable();};
document.getElementById('export-gacha').onclick = ()=>downloadJSON('gacha.json', adminStore.gacha);

/* ===============================
   Equipment (Table + CRUD)
   =============================== */
function renderEquipTable(){
  const arr = adminStore.equipment;
  const list = arr.map((e,i)=>`
    <tr>
      <td><input class="input-text" type="text" value="${e.id}"></td>
      <td><input class="input-text" type="text" value="${e.name}"></td>
      <td><input class="input-text" type="text" value="${e.type||'Weapon'}"></td>
      <td><input class="input-text" type="text" value="${e.element||'Fire'}"></td>
      <td><input class="input-text" type="text" value='${JSON.stringify(e.bonus||{})}'></td>
      <td><input class="input-text" type="text" value="${e.description||''}"></td>
      <td>
        <button class="admin-save-btn" onclick="saveEquip(${i})">💾</button>
        <button class="admin-del-btn" onclick="delRow('equipment',${i})">🗑️</button>
      </td>
    </tr>
  `).join('');
  document.getElementById('table-equipment').innerHTML = `
  <table>
    <thead><tr>
      <th>ID</th><th>Name</th><th>Type</th><th>Element</th><th>Bonus</th><th>Desc</th><th>Action</th>
    </tr></thead>
    <tbody>${list}</tbody>
  </table>
  `;
}
window.saveEquip = function(idx){
  let row = document.getElementById('table-equipment').getElementsByTagName('tbody')[0].rows[idx].children;
  let e = adminStore.equipment[idx];
  e.id = row[0].querySelector('input').value.trim();
  e.name = row[1].querySelector('input').value;
  e.type = row[2].querySelector('input').value;
  e.element = row[3].querySelector('input').value;
  try { e.bonus = JSON.parse(row[4].querySelector('input').value); } catch { e.bonus = {}; }
  e.description = row[5].querySelector('input').value;
  renderEquipTable();
  alert('💾 อุปกรณ์บันทึก');
};
document.getElementById('add-equipment-btn').onclick = ()=>{adminStore.equipment.push({id:'equip'+(+new Date()),name:'',type:'Weapon',element:'Fire',bonus:{atk:10},description:''}); renderEquipTable();};
document.getElementById('export-equipment').onclick = ()=>downloadJSON('equipment.json', adminStore.equipment);

/* ===============================
   Stage/World (Table + CRUD)
   =============================== */
function renderStageTable(){
  const arr = adminStore.stage;
  document.getElementById('table-stage').innerHTML = `
  <table>
    <thead><tr>
      <th>World</th><th>Name</th><th>Stages (JSON array)</th><th>Action</th>
    </tr></thead>
    <tbody>
    ${arr.map((w,wi)=>`
      <tr>
        <td><input class="input-text" type="number" value="${w.world||1}"></td>
        <td><input class="input-text" type="text" value="${w.name||''}"></td>
        <td><textarea style="width:99%;min-height:81px">${JSON.stringify(w.stages||[],null,2)}</textarea></td>
        <td><button class="admin-save-btn" onclick="saveStage(${wi})">💾</button></td>
      </tr>
    `).join('')}
    </tbody>
  </table>
  `;
}
window.saveStage = function(wi){
  let row = document.getElementById('table-stage').getElementsByTagName('tbody')[0].rows[wi].children;
  let w = adminStore.stage[wi];
  w.world = parseInt(row[0].querySelector('input').value);
  w.name = row[1].querySelector('input').value;
  try { w.stages = JSON.parse(row[2].querySelector('textarea').value); } catch { w.stages=[];}
  renderStageTable();
  alert('💾 Stage world saved');
};
document.getElementById('add-stage-btn').onclick = ()=>{
  adminStore.stage.push({world:adminStore.stage.length+1,name:"World NEW",stages:[]});
  renderStageTable();
};
document.getElementById('export-stage').onclick = ()=>downloadJSON('stages.json', adminStore.stage);

/* ===============================
   Quests (Table + CRUD)
   =============================== */
function renderQuestTable(){
  let arr_flat = [
    ...(adminStore.quest.main||[]).map(q=>({...q,type:'main'})),
    ...(adminStore.quest.daily||[]).map(q=>({...q,type:'daily'})),
    ...(adminStore.quest.side||[]).map(q=>({...q,type:'side'})),
  ];
  const list = arr_flat.map((q,i)=>`
    <tr>
      <td><input class="input-text" value="${q.id||''}"></td>
      <td><select>
        <option value="main"${q.type==="main"?" selected":""}>Main</option>
        <option value="daily"${q.type==="daily"?" selected":""}>Daily</option>
        <option value="side"${q.type==="side"?" selected":""}>Side</option>
      </select></td>
      <td><input class="input-text" value="${q.name||''}"></td>
      <td><input class="input-text" value="${q.desc||''}"></td>
      <td><input class="input-text" value="${q.icon||''}"></td>
      <td><input class="input-text" value='${JSON.stringify(q.require||{})}'></td>
      <td><input class="input-text" value='${JSON.stringify(q.reward||{})}'></td>
      <td>
        <button class="admin-save-btn" onclick="saveQuest(${i})">💾</button>
        <button class="admin-del-btn" onclick="delQuest(${i})">🗑️</button>
      </td>
    </tr>
  `).join('');
  document.getElementById('table-quest').innerHTML = `
  <table>
    <thead><tr>
      <th>ID</th><th>Type</th><th>Name</th><th>Desc</th><th>Icon</th>
      <th>Require</th><th>Reward</th><th>Action</th>
    </tr></thead>
    <tbody>${list}</tbody>
  </table>
  `;
}
window.saveQuest = function(idx){
  // Flat index lookup (type, idx-in-type)
  let arr_main = adminStore.quest.main||[], arr_daily = adminStore.quest.daily||[], arr_side = adminStore.quest.side||[];
  let total = [...arr_main,...arr_daily,...arr_side];
  let row = document.getElementById('table-quest').getElementsByTagName('tbody')[0].rows[idx].children;
  let type = row[1].querySelector('select').value;
  let q = {
    id: row[0].querySelector('input').value,
    name: row[2].querySelector('input').value,
    desc: row[3].querySelector('input').value,
    icon: row[4].querySelector('input').value,
    require: JSON.parse(row[5].querySelector('input').value),
    reward: JSON.parse(row[6].querySelector('input').value)
  };
  // Remove from original type array then add by type
  // (This is a bit hacky, improve in production)
  if (type==="main"){adminStore.quest.main[idx]=q;}
  else if(type==="daily"){adminStore.quest.daily[idx-arr_main.length]=q;}
  else{adminStore.quest.side[idx-arr_main.length-arr_daily.length]=q;}
  renderQuestTable();
  alert('💾 เควสบันทึก');
};
window.delQuest = function(idx){
  let lenM = (adminStore.quest.main||[]).length,
      lenD = (adminStore.quest.daily||[]).length;
  if(idx<lenM) adminStore.quest.main.splice(idx,1);
  else if(idx<lenM+lenD) adminStore.quest.daily.splice(idx-lenM,1);
  else adminStore.quest.side.splice(idx-lenM-lenD,1);
  renderQuestTable();
};
// เพิ่มเควสใหม่ (จะเพิ่มเป็น main)
document.getElementById('add-quest-btn').onclick = () => {
  if (!adminStore.quest.main) adminStore.quest.main = [];
  adminStore.quest.main.push({
    id: 'q-' + (+new Date()),
    name: '',
    desc: '',
    icon: '🏆',
    require: {},
    reward: { gold: 0 },
  });
  renderQuestTable();
};
document.getElementById('export-quest').onclick = () => {
  // แยก sectionออกแต่ละ type
  downloadJSON('quests.json', adminStore.quest);
};

/* ===============================
   Shop (Table + CRUD)
   =============================== */
function renderShopTable() {
  const arr = adminStore.shop;
  const list = arr.map((v, i) => `
    <tr>
      <td><input class="input-text" type="text" value="${v.id}"></td>
      <td><input class="input-text" type="text" value="${v.name}"></td>
      <td><input class="input-text" type="text" value="${v.icon || ''}"></td>
      <td><input class="input-text" type="text" value="${v.desc || ''}"></td>
      <td><input class="input-text" type="number" min="0" value="${v.price || 0}"></td>
      <td><input class="input-text" type="number" min="1" value="${v.limit_per_day || 1}"></td>
      <td>
        <button class="admin-save-btn" onclick="saveShop(${i})">💾</button>
        <button class="admin-del-btn" onclick="delRow('shop',${i})">🗑️</button>
      </td>
    </tr>
  `).join('');
  document.getElementById('table-shop').innerHTML = `
    <table>
      <thead><tr>
        <th>ID</th><th>Name</th><th>Icon</th><th>Desc</th>
        <th>Price</th><th>Limit/Day</th><th>Action</th>
      </tr></thead>
      <tbody>${list}</tbody>
    </table>
  `;
}
window.saveShop = function(idx) {
  let row = document.getElementById('table-shop').getElementsByTagName('tbody')[0].rows[idx].children;
  let s = adminStore.shop[idx];
  s.id = row[0].querySelector('input').value;
  s.name = row[1].querySelector('input').value;
  s.icon = row[2].querySelector('input').value;
  s.desc = row[3].querySelector('input').value;
  s.price = parseInt(row[4].querySelector('input').value) || 0;
  s.limit_per_day = parseInt(row[5].querySelector('input').value) || 1;
  renderShopTable();
  alert("💾 บันทึกร้านค้าสำเร็จ");
};
document.getElementById('add-shop-btn').onclick = () => {
  adminStore.shop.push({
    id: 'shop' + (+new Date()),
    name: '',
    icon: '🛒',
    desc: '',
    price: 10,
    limit_per_day: 1,
  });
  renderShopTable();
};
document.getElementById('export-shop').onclick = () => {
  downloadJSON('shop.json', adminStore.shop);
};

/* ===============================
  Notify (local storage only, ไม่เกี่ยวข้องกับไฟล์จริง)
  =============================== */
function renderNotifyTable() {
  const arr = adminStore.notify;
  const list = arr.map((n, i) => `
    <tr>
      <td><input class="input-text" value="${n.type || ''}"></td>
      <td><input class="input-text" value="${n.icon || ''}"></td>
      <td><input class="input-text" value="${n.msg || ''}"></td>
      <td><input class="input-text" value="${n.time || ''}"></td>
      <td>
        <button class="admin-save-btn" onclick="saveNotify(${i})">💾</button>
        <button class="admin-del-btn" onclick="delRow('notify',${i});saveNotifyLocal();">🗑️</button>
      </td>
    </tr>
  `).join('');
  document.getElementById('table-notify').innerHTML = `
    <table>
      <thead><tr>
        <th>Type</th><th>Icon</th><th>ข้อความ</th><th>Time</th><th>Action</th>
      </tr></thead>
      <tbody>${list}</tbody>
    </table>
    <div style="color:#09a;text-align:right">
      * การแก้ไขประกาศนี้ใช้ localStorage เท่านั้น (ไม่แก้ไขใน FriendEventUI.js อัตโนมัติ)
    </div>
  `;
}
window.saveNotify = function(idx) {
  let row = document.getElementById('table-notify').getElementsByTagName('tbody')[0].rows[idx].children;
  let n = adminStore.notify[idx];
  n.type = row[0].querySelector('input').value;
  n.icon = row[1].querySelector('input').value;
  n.msg = row[2].querySelector('input').value;
  n.time = row[3].querySelector('input').value;
  saveNotifyLocal();
  renderNotifyTable();
  alert("💾 บันทึกประกาศสำเร็จ");
};
function saveNotifyLocal() {
  localStorage.setItem('adminNotify', JSON.stringify(adminStore.notify));
}
document.getElementById('add-notify-btn').onclick = () => {
  adminStore.notify.push({type:"announce",icon:"📢",msg:"",time:"วันนี้"});
  renderNotifyTable();
};
document.getElementById('export-notify').onclick = () => {
  downloadJSON('notify-local.json', adminStore.notify);
};

/* ===============================
  Universal Export JSON Function
  =============================== */
function downloadJSON(filename, data) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', dataStr);
  dlAnchor.setAttribute('download', filename);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
}

/* ========== End Admin.js ========== */
