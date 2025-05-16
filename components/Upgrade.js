let upgradePoints = 15; // สมมติเริ่มต้นมี point สำหรับอัปเกรด

let upgradeCharacters = []; // ตัวที่ผู้เล่นมี (นำจาก gacha หรือ mock array)
let charactersData = [];

// === ฟังก์ชันหลัก: sync stat ไป allCharacters & selectedTeam ทุกครั้งที่ upgrade ===
function setCharacterStatGlobal(charId, newStats, newLv) {
  // sync ไป allCharacters (ใช้แสดง "ตัวละครทั้งหมด/เลือกทีม/TeamBuilder")
  if (window.allCharacters && Array.isArray(window.allCharacters)) {
    for (let x of window.allCharacters) {
      if (x.id === charId) {
        Object.assign(x.stats, newStats);
        if (newLv !== undefined) x.level = newLv;
      }
    }
  }
  // sync ไป selectedTeam (ทีมผู้เล่นปัจจุบัน)
  if (window.selectedTeam && Array.isArray(window.selectedTeam)) {
    for (let x of window.selectedTeam) {
      if (x.id === charId) {
        Object.assign(x.stats, newStats);
        if (newLv !== undefined) x.level = newLv;
      }
    }
  }
}

// โหลดและเตรียมข้อมูลตัวละคร
async function initUpgrade() {
  const res = await fetch('./data/characters.json');
  charactersData = await res.json();
  // สมมติว่าผู้เล่นมี 4 ตัวแรก (หรือสามารถเปลี่ยนเป็น userCharacters จริงได้)
  upgradeCharacters = charactersData.slice(0, 4);
  renderUpgradeUI();
}

function renderUpgradeUI() {
  const upgradeDiv = document.getElementById('upgrade-root');
  upgradeDiv.innerHTML = `
    <div class="upgrade-box">
      <h2>Upgrade Character</h2>
      <div>Points ที่เหลือ: <span id="upgrade-points">${upgradePoints}</span></div>
      <div class="upgrade-char-list">
        ${upgradeCharacters.map((char, i) => `
          <div class="upgrade-char-card">
            <h4>${char.name} (${char.job} / ${char.element})</h4>
            <ul>
              <li>HP: <span id="stat-hp-${i}">${char.stats.hp}</span> 
                <button onclick="upgradeStat(${i}, 'hp')" ${upgradePoints <= 0 ? 'disabled' : ''}>+10</button>
              </li>
              <li>ATK: <span id="stat-atk-${i}">${char.stats.atk}</span>
                <button onclick="upgradeStat(${i}, 'atk')" ${upgradePoints <= 0 ? 'disabled' : ''}>+2</button>
              </li>
              <li>DEF: <span id="stat-def-${i}">${char.stats.def}</span>
                <button onclick="upgradeStat(${i}, 'def')" ${upgradePoints <= 0 ? 'disabled' : ''}>+2</button>
              </li>
              <li>SPD: <span id="stat-spd-${i}">${char.stats.spd}</span>
                <button onclick="upgradeStat(${i}, 'spd')" ${upgradePoints <= 0 ? 'disabled' : ''}>+1</button>
              </li>
            </ul>
            <p>Level: <span id="char-lv-${i}">${char.level}</span>
              <button onclick="upgradeLevel(${i})" ${upgradePoints <= 0 ? 'disabled' : ''}>+1</button>
            </p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function upgradeStat(idx, stat) {
  if (upgradePoints <= 0) return;
  upgradePoints -= 1;
  let char = upgradeCharacters[idx];
  // Scale อัป stat/level: ท้าทายขึ้นทุกครั้ง
  let scale = 1 + 0.05 * (char.level - 1); // สูงขึ้นนิดหน่อยเวลสูง
  switch (stat) {
    case 'hp': char.stats.hp += Math.round(10 * scale); break;
    case 'atk': char.stats.atk += Math.round(2 * scale); break;
    case 'def': char.stats.def += Math.round(2 * scale); break;
    case 'spd': char.stats.spd += 1; break;
  }
  setCharacterStatGlobal(char.id, char.stats, char.level); // sync stat ทั้งหมด
  // refresh UI team/characterList
  if (window.renderCharacterList) window.renderCharacterList();
  if (window.renderTeam) window.renderTeam();
  renderUpgradeUI();
}

function upgradeLevel(idx) {
  if (upgradePoints <= 0) return;
  upgradePoints -= 2; // ใช้ point เพิ่ม
  let char = upgradeCharacters[idx];
  char.level += 1;
  // Option: เติม stat นิด ๆ auto เมื่อเลเวลอัพ
  char.stats.hp += 15;
  char.stats.atk += 3;
  char.stats.def += 3;
  char.stats.spd += 1;
  setCharacterStatGlobal(char.id, char.stats, char.level); // sync stat ทั้งหมด
  if (window.renderCharacterList) window.renderCharacterList();
  if (window.renderTeam) window.renderTeam();
  renderUpgradeUI();
}

// export ให้หน้า html ใช้งาน
window.initUpgrade = initUpgrade;
window.upgradeStat = upgradeStat;
window.upgradeLevel = upgradeLevel;

// End Upgrade.js