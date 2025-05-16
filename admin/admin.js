// --- Auth check ---
if (!localStorage.getItem('adminLogin')) {
  window.location = './login.html';
}

// --- DATA FIREBASE MOCK (ใช้ fetch แก้เป็น localStorage ขณะ demo) ---
const dataFiles = {
  characters: '../data/characters.json',
  equipment: '../data/equipment.json',
  stages: '../data/stages.json',
  gacha: '../data/gacha.json',
  quests: '../data/quests.json',
  shop: '../data/shop.json'
};

let admins = {
  // สามารถเพิ่มบัญชีอื่นๆ ได้
  pass: "summoneradmin2024"
};

// --- GLOBAL LOADED DATA ---
let rawData = {};

async function loadAllAdminData() {
  for (let key in dataFiles) {
    rawData[key] = await fetch(dataFiles[key]).then(r => r.json());
  }
}
window.setTab = async function (tab) {
  // UI highlight
  Array.from(document.querySelectorAll('.admin-menu button')).forEach(b => b.classList.remove('active'));
  let btn = Array.from(document.querySelectorAll('.admin-menu button')).find(b => b.textContent.includes(tabDisplayName(tab)));
  if (btn) btn.classList.add('active');

  if (!rawData.characters) await loadAllAdminData();
  if (tab === "characters") renderAdminCharacters();
  if (tab === "equipment") renderAdminEquipment();
  if (tab === "stages") renderAdminStages();
  if (tab === "gacha") renderAdminGacha();
  if (tab === "quests") renderAdminQuests();
  if (tab === "shop") renderAdminShop();
};

function tabDisplayName(tab){
  return {
    characters: "ตัวละคร", equipment: "อุปกรณ์", stages: "ด่าน", gacha: "กาชา",
    quests: "เควส", shop: "ร้านค้า"
  }[tab] || tab;
}

window.logoutAdmin = function() {
  localStorage.removeItem('adminLogin');
  window.location = './login.html';
}

// === 1. ADMIN CHARACTERS ===

function renderAdminCharacters() {
  let root = document.getElementById('admin-main-content');
  let chars = rawData.characters;
  
  let addBar = `
    <div class="admin-edit-bar">
      <input type="text" id="add-char-name" placeholder="ชื่อตัวละคร" style="width:100px;">
      <select id="add-char-job">
        <option>Warrior</option><option>Mage</option><option>Assassin</option><option>Tank</option><option>Healer</option><option>Support</option>
      </select>
      <select id="add-char-element">
        <option>Fire</option><option>Water</option><option>Earth</option><option>Wind</option>
        <option>Light</option><option>Dark</option>
      </select>
      <input type="number" id="add-char-rarity" value="3" min="1" max="5" style="width:56px;">
      <button onclick="adminAddChar()">+ เพิ่มตัวละคร</button>
    </div>
  `;
  let table = `
    <table class="admin-table">
    <thead><tr>
      <th>id</th><th>ชื่อ</th><th>อาชีพ</th><th>ธาตุ</th><th>★</th>
      <th>LV</th><th>HP</th><th>ATK</th><th>DEF</th><th>SPD</th>
      <th>Skills (','คั่น)</th><th>ลบ</th>
    </tr></thead>
    <tbody>
      ${chars.map((c,i)=>`
        <tr>
          <td>${c.id}</td>
          <td><input type="text" value="${c.name}" onchange="editAdminCharVal(${i}, 'name', this.value)"></td>
          <td><input type="text" value="${c.job}" onchange="editAdminCharVal(${i}, 'job', this.value)"></td>
          <td><input type="text" value="${c.element}" onchange="editAdminCharVal(${i}, 'element', this.value)"></td>
          <td><input type="number" value="${c.rarity}" min="1" max="5" onchange="editAdminCharVal(${i}, 'rarity', this.value)"></td>
          <td><input type="number" value="${c.level}" min="1" max="99" onchange="editAdminCharVal(${i}, 'level', this.value)"></td>
          <td><input type="number" value="${c.stats.hp}" onchange="editAdminCharStat(${i}, 'hp', this.value)"></td>
          <td><input type="number" value="${c.stats.atk}" onchange="editAdminCharStat(${i}, 'atk', this.value)"></td>
          <td><input type="number" value="${c.stats.def}" onchange="editAdminCharStat(${i}, 'def', this.value)"></td>
          <td><input type="number" value="${c.stats.spd}" onchange="editAdminCharStat(${i}, 'spd', this.value)"></td>
          <td><input type="text" value="${c.skills.join(",")}" onchange="editAdminCharSkills(${i}, this.value)"></td>
          <td><button class="btn-del" onclick="adminDelChar(${i})">ลบ</button></td>
        </tr>
      `).join("")}
    </tbody>
    </table>
  `;
  root.innerHTML = addBar + table + `<div style="padding:10px 0;"><button class="btn-save" onclick="saveAdminCharacters()">💾 บันทึกการแก้ไข</button></div>`;
}

window.adminAddChar = function() {
  let chars = rawData.characters;
  let name = document.getElementById('add-char-name').value.trim();
  let job = document.getElementById('add-char-job').value;
  let element = document.getElementById('add-char-element').value;
  let rarity = Number(document.getElementById('add-char-rarity').value);
  let id = "char"+String(Math.floor(Math.random()*999)+101).padStart(3,'0');
  let newchar = {
    id, name, job, element, level: 1, rarity,
    stats: { hp: 3000, atk: 300, def: 200, spd: 100 },
    skills: []
  };
  chars.push(newchar);
  renderAdminCharacters();
};

window.editAdminCharVal = function(idx, key, val){ rawData.characters[idx][key] = val; };
window.editAdminCharStat = function(idx, stat, val){ rawData.characters[idx].stats[stat]=Number(val); };
window.editAdminCharSkills = function(idx, val){ rawData.characters[idx].skills=val.split(',').map(s=>s.trim()); };
window.adminDelChar = function(idx){ if(confirm("ลบตัวละครนี้?")) { rawData.characters.splice(idx,1); renderAdminCharacters(); } };
window.saveAdminCharacters = function(){
  localStorage.setItem('admin.characters', JSON.stringify(rawData.characters));
  alert("บันทึกเรียบร้อย! (mock: localStorage)");
  renderAdminCharacters();
};

// === 2. อุปกรณ์ Equipment ===
function renderAdminEquipment(){
  let eqs = rawData.equipment;
  let html = `
    <div class="admin-edit-bar">
      <input id="eq-name" placeholder="ชื่ออุปกรณ์" style="width:100px;">
      <select id="eq-type"><option>Weapon</option><option>Shield</option><option>Armor</option></select>
      <select id="eq-ele"><option>Fire</option><option>Water</option><option>Earth</option><option>Wind</option></select>
      <button onclick="adminAddEquip()">+ เพิ่ม</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>id</th><th>ชื่อ</th><th>ชนิด</th><th>ธาตุ</th><th>ค่าพิเศษ (json)</th><th>ลบ</th></tr></thead>
      <tbody>${eqs.map((eq,i)=>`
        <tr>
          <td>${eq.id}</td>
          <td><input value="${eq.name}" onchange="editEquipVal(${i},'name',this.value)"></td>
          <td><input value="${eq.type}" onchange="editEquipVal(${i},'type',this.value)"></td>
          <td><input value="${eq.element}" onchange="editEquipVal(${i},'element',this.value)"></td>
          <td><input value='${JSON.stringify(eq.bonus)}' onchange="editEquipVal(${i},'bonus',this.value)"></td>
          <td><button class="btn-del" onclick="adminDelEquip(${i})">ลบ</button></td>
        </tr>
      `).join('')}</tbody>
    </table>
    <div style="padding:10px 0;"><button class="btn-save" onclick="saveAdminEquip()">💾 บันทึก</button></div>
  `;
  document.getElementById('admin-main-content').innerHTML = html;
}
window.adminAddEquip = function(){
  let eqs = rawData.equipment;
  let name = document.getElementById('eq-name').value.trim();
  let type = document.getElementById('eq-type').value;
  let ele = document.getElementById('eq-ele').value;
  let id = "equip"+(100+Math.floor(Math.random()*900));
  eqs.push({ id, name, type, element:ele, bonus:{}, description:""});
  renderAdminEquipment();
};
window.editEquipVal = function(i,k,v){
  if(k==='bonus'){ try{ rawData.equipment[i][k]=JSON.parse(v);}catch{} } else{ rawData.equipment[i][k]=v;}
}
window.adminDelEquip=function(i){ if(confirm("ลบ?")) {rawData.equipment.splice(i,1); renderAdminEquipment();} }
window.saveAdminEquip=function(){ localStorage.setItem('admin.equipment', JSON.stringify(rawData.equipment));
  alert("บันทึกเรียบร้อย (mock: localStorage)"); renderAdminEquipment(); };

// === 3. ด่าน stages ===
function renderAdminStages() {
  let worlds = rawData.stages;
  let html = worlds.map((widx,wi)=>`
    <fieldset style="border:1px solid #ddd;padding:10px;margin-bottom:14px;border-radius:8px;">
      <legend>🌏 World ${widx.world}: ${widx.name} (index:${wi})</legend>
      <button onclick="adminAddStage(${wi})">+ ด่าน</button>
      <table class="admin-table">
        <thead><tr>
                    <th>ชื่อด่าน</th>
          <th>ศัตรู (json)</th>
          <th>BOSS (json)</th>
          <th>รางวัล (json)</th>
          <th>ลบ</th>
        </tr></thead>
        <tbody>
          ${widx.stages.map((stage,si)=>`
            <tr>
              <td>${stage.id}</td>
              <td><input value="${stage.name}" onchange="editStageVal(${wi},${si},'name',this.value)"></td>
              <td><input value='${JSON.stringify(stage.enemies)}' onchange="editStageVal(${wi},${si},'enemies',this.value)"></td>
              <td><input value='${JSON.stringify(stage.boss)}' onchange="editStageVal(${wi},${si},'boss',this.value)"></td>
              <td><input value='${JSON.stringify(stage.reward)}' onchange="editStageVal(${wi},${si},'reward',this.value)"></td>
              <td><button class="btn-del" onclick="adminDelStage(${wi},${si})">ลบ</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </fieldset>
  `).join("") + `
      <div style="padding:10px 0;"><button class="btn-save" onclick="saveAdminStages()">💾 บันทึก</button></div>
  `;
  document.getElementById('admin-main-content').innerHTML = html;
}
window.adminAddStage = function(widx){
  let stgs = rawData.stages[widx].stages;
  let after = stgs.map(s=>parseInt((s.id+'').split('-')[1])).reduce((a,b)=>Math.max(a,b), 0)+1;
  stgs.push({
    id: `${rawData.stages[widx].world}-${after}`,
    name: 'New Stage',
    enemies: [],
    reward: { gold: 0 },
    boss: null
  });
  renderAdminStages();
};
window.editStageVal = function(wi,si,k,v){
  try{
    if(['enemies','boss','reward'].includes(k)) v = v && v != "null" ? JSON.parse(v):null;
    rawData.stages[wi].stages[si][k]=v;
  }catch{}
};
window.adminDelStage = function(wi,si){
  if(confirm("ลบด่านนี้?")) {
    rawData.stages[wi].stages.splice(si,1);
    renderAdminStages();
  }
};
window.saveAdminStages = function(){
  localStorage.setItem('admin.stages', JSON.stringify(rawData.stages));
  alert('บันทึกเรียบร้อย (mock: localStorage)');
  renderAdminStages();
};



// === 4. ADMIN GACHA POOL ===
function renderAdminGacha(){
  let gdata = rawData.gacha;
  let chs = rawData.characters;
  let html = `
    <div class="admin-edit-bar">
      <label>ค่า Gacha Cost: <input id="gacha-cost" value="${gdata.gacha_cost}" type="number" min="1" max="999999" style="width:88px"></label>
      <button onclick="saveAdminGachaCost()">💾 Save</button>
      <button onclick="adminAddGachaPool()">+ ตัวละครเข้า pool</button>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>character_id</th><th>ชื่อตัวละคร</th><th>Weight</th><th>ลบ</th>
      </tr></thead>
      <tbody>
        ${gdata.gacha_pool.map((g,i)=>`
          <tr>
            <td>${g.character_id}</td>
            <td>${chs.find(c=>c.id===g.character_id)?.name||'-'}</td>
            <td><input type="number" min="1" max="9999" value="${g.weight}" onchange="editGachaWeight(${i},this.value)"></td>
            <td><button class="btn-del" onclick="adminDelGachaPool(${i})">ลบ</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="padding:10px 0;"><button class="btn-save" onclick="saveAdminGacha()">💾 บันทึก</button></div>
  `;
  document.getElementById('admin-main-content').innerHTML = html;
}
window.saveAdminGachaCost = function(){
  let v = parseInt(document.getElementById('gacha-cost').value);
  rawData.gacha.gacha_cost = isNaN(v)?1000:v;
  renderAdminGacha();
};
window.editGachaWeight = function(idx,val){
  rawData.gacha.gacha_pool[idx].weight = parseInt(val) || 1;
};
window.adminDelGachaPool = function(idx){
  if(confirm("ลบ pool กาชาช่องนี้?")){ rawData.gacha.gacha_pool.splice(idx,1); renderAdminGacha();}
};
window.adminAddGachaPool = function(){
  let charId = prompt("ใส่ character_id ที่จะเพิ่ม (ดูจากตาราง character):");
  let exists = rawData.gacha.gacha_pool.find(g=>g.character_id===charId);
  if(!exists&&charId){
    rawData.gacha.gacha_pool.push({character_id:charId,weight:100});
    renderAdminGacha();
  }
};
window.saveAdminGacha = function(){
  localStorage.setItem('admin.gacha', JSON.stringify(rawData.gacha));
  alert("บันทึกเรียบร้อย (mock: localStorage)");
  renderAdminGacha();
};



// === 5. ADMIN QUESTS ===
function renderAdminQuests(){
  let qdata = rawData.quests;
  let html = ['main','daily','side'].map(qt=>`
    <fieldset style="margin-bottom:15px;border-radius:10px;">
      <legend>ประเภท: ${qt}</legend>
      <button onclick="adminAddQuest('${qt}')">+ Quest</button>
      <table class="admin-table">
        <thead><tr><th>ID</th><th>ชื่อ</th><th>Desc</th><th>Require (json)</th><th>Reward (json)</th><th>ไอคอน</th><th>ลบ</th></tr></thead>
        <tbody>
        ${qdata[qt]?.map((q,i)=>`
          <tr>
            <td><input value="${q.id}" onchange="editQuestVal('${qt}',${i},'id',this.value)"></td>
            <td><input value="${q.name}" onchange="editQuestVal('${qt}',${i},'name',this.value)"></td>
            <td><input value="${q.desc}" onchange="editQuestVal('${qt}',${i},'desc',this.value)"></td>
            <td><input value='${JSON.stringify(q.require)}' onchange="editQuestVal('${qt}',${i},'require',this.value)"></td>
            <td><input value='${JSON.stringify(q.reward)}' onchange="editQuestVal('${qt}',${i},'reward',this.value)"></td>
            <td><input value="${q.icon}" onchange="editQuestVal('${qt}',${i},'icon',this.value)" style="width:30px;"></td>
            <td><button class="btn-del" onclick="adminDelQuest('${qt}',${i})">ลบ</button></td>
          </tr>
        `).join('')}
        </tbody>
      </table>
    </fieldset>
  `).join("") + `<div style="padding:10px 0;"><button class="btn-save" onclick="saveAdminQuests()">💾 บันทึก</button></div>`;
  document.getElementById('admin-main-content').innerHTML = html;
}
window.adminAddQuest = function(qt){
  rawData.quests[qt]=rawData.quests[qt]||[];
  rawData.quests[qt].push({
    id: `quest_${Date.now()}`, name:'New Quest', desc:'', icon:'📜', require:{}, reward:{gold:0}
  });
  renderAdminQuests();
};
window.editQuestVal = function(type,idx,k,val){
  try{
    if(['require','reward'].includes(k)) val = JSON.parse(val);
    rawData.quests[type][idx][k] = val;
  }catch{}
};
window.adminDelQuest = function(type,idx){
  if(confirm("ลบ quest นี้?")) { rawData.quests[type].splice(idx,1); renderAdminQuests();}
};
window.saveAdminQuests = function(){
  localStorage.setItem('admin.quests',JSON.stringify(rawData.quests));
  alert("บันทึกเรียบร้อย (mock: localStorage)"); renderAdminQuests();
};


// === 6. ADMIN SHOP ===
function renderAdminShop(){
  let sdata = rawData.shop;
  let html = `
    <button onclick="adminAddShop()">+ เพิ่มสินค้า</button>
    <table class="admin-table">
      <thead><tr><th>ID</th><th>ชื่อ</th><th>Desc</th><th>ราคาร้าน</th><th>จำนวนต่อวัน</th><th>ไอคอน</th><th>ลบ</th></tr></thead>
      <tbody>
        ${sdata.map((item,i)=>`
          <tr>
            <td><input value="${item.id}" onchange="editShopVal(${i},'id',this.value)"></td>
            <td><input value="${item.name}" onchange="editShopVal(${i},'name',this.value)"></td>
            <td><input value="${item.desc}" onchange="editShopVal(${i},'desc',this.value)"></td>
            <td><input type="number" value="${item.price}" onchange="editShopVal(${i},'price',this.value)"></td>
            <td><input type="number" value="${item.limit_per_day}" onchange="editShopVal(${i},'limit_per_day',this.value)"></td>
            <td><input value="${item.icon}" onchange="editShopVal(${i},'icon',this.value)" style="width:30px"></td>
            <td><button class="btn-del" onclick="adminDelShop(${i})">ลบ</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="padding:10px 0;"><button class="btn-save" onclick="saveAdminShop()">💾 บันทึก</button></div>
  `;
  document.getElementById('admin-main-content').innerHTML = html;
}
window.adminAddShop = function(){
  rawData.shop.push({id:'item_new',name:'สินค้าใหม่',icon:'🎁',desc:'',price:1000,limit_per_day:1});
  renderAdminShop();
};
window.editShopVal = function(idx,k,v){
  if(['price','limit_per_day'].includes(k)) v = parseInt(v)||1;
  rawData.shop[idx][k]=v;
};
window.adminDelShop=function(idx){ if(confirm("ลบสินค้านี้?")) {rawData.shop.splice(idx,1); renderAdminShop();} }
window.saveAdminShop=function(){ localStorage.setItem('admin.shop',JSON.stringify(rawData.shop));
  alert('บันทึกเรียบร้อย (mock: localStorage)'); renderAdminShop();
};


// === INIT (default to characters tab) ===
window.onload = ()=>window.setTab('characters');