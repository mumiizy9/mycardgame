// Equipment.js - ระบบอุปกรณ์ตัวละคร

let userEquipments = []; // รหัสอุปกรณ์ที่ผู้เล่นมี (อนาคต)
let equipmentList = [];
let equipCharacters = []; // ตัวอย่างตัวละคร 4 ตัว

async function initEquipment() {
  // โหลดข้อมูลอุปกรณ์ + ตัวละคร (เหมือนกับใน Upgrade.js)
  const [equipRes, charRes] = await Promise.all([
    fetch('./data/equipment.json'),
    fetch('./data/characters.json')
  ]);
  equipmentList = await equipRes.json();
  equipCharacters = (await charRes.json()).slice(0, 4);
  // กำหนด equipment แต่ละตัวเป็น null
  equipCharacters.forEach(char => { char.equipment = null; });
  renderEquipmentUI();
}

// Render หน้าจออุปกรณ์
function renderEquipmentUI() {
  const root = document.getElementById('equip-root');
  root.innerHTML = `
    <div class="equip-box">
      <h2>Equip Character</h2>
      <div class="equip-char-list">
        ${equipCharacters.map((char, idx) => `
          <div class="equip-char-card">
            <h4>${char.name} (${char.job})</h4>
            <ul>
              <li>HP: ${calcStatWithEquip(char, "hp")}, ATK: ${calcStatWithEquip(char, "atk")}, DEF: ${calcStatWithEquip(char, "def")}, SPD: ${calcStatWithEquip(char, "spd")}</li>
            </ul>
            <div>
              <label>ใส่อุปกรณ์:</label>
              <select onchange="equipToChar(${idx}, this.value)">
                <option value="">-- ไม่เลือก --</option>
                ${equipmentList.map(eq => `
                  <option value="${eq.id}" ${(char.equipment && char.equipment.id === eq.id) ? "selected" : ""}>${eq.name} (${eq.type})</option>
                `).join("")}
              </select>
              ${char.equipment ? `<button onclick="unEquip(${idx})">ถอดอุปกรณ์</button>` : ""}
            </div>
            ${char.equipment ? `<em>+${statString(char.equipment.bonus)} | ธาตุ:${char.equipment.element}</em>` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// รวมค่าสถานะเดิม+bonus (ถ้ามี)
function calcStatWithEquip(char, k) {
  let base = char.stats[k] || 0;
  if (char.equipment && char.equipment.bonus && typeof char.equipment.bonus[k] === 'number') {
    return base + char.equipment.bonus[k];
  }
  return base;
}

// ใส่อุปกรณ์ให้ตัวละคร
function equipToChar(idx, eqid) {
  if (!eqid) {
    equipCharacters[idx].equipment = null;
  } else {
    let eq = equipmentList.find(e => e.id === eqid);
    equipCharacters[idx].equipment = eq || null;
  }
  renderEquipmentUI();
}

// ถอดอุปกรณ์
function unEquip(idx) {
  equipCharacters[idx].equipment = null;
  renderEquipmentUI();
}

// สร้างข้อความสำหรับ stat bonus
function statString(bonus) {
  if (!bonus) return "";
  return Object.entries(bonus).map(([k, v]) => `${k.toUpperCase()}:+${v}`).join(", ");
}

// export ให้หน้า html เรียกใช้
window.initEquipment = initEquipment;
window.equipToChar = equipToChar;
window.unEquip = unEquip;

// End Equipment.js