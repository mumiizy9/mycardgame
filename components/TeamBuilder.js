// แสดงรายชื่อตัวละคร เลือก/ถอดเข้าออกทีม (สูงสุด 4 ตัว)

let selectedTeam = [];
let allCharacters = [];
let teamAllCharacters = [];

async function fetchCharacters() {
  const res = await fetch('./data/characters.json');
  allCharacters = await res.json();
  renderCharacterList();
  renderTeam();
}

// สร้าง UI รายการตัวละคร
function renderCharacterList() {
    const listDiv = document.getElementById('character-list');
    listDiv.innerHTML = '';
    allCharacters.forEach(char => {
        const isSelected = selectedTeam.find(c => c.id === char.id);
        const card = document.createElement('div');
        card.className = `character-card ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
      <h4>${char.name} (${char.job} / ${char.element})</h4>
      <p>Lv.${char.level} ★${char.rarity}</p>
      <ul>
        <li>HP: ${char.stats.hp}</li>
        <li>ATK: ${char.stats.atk}</li>
        <li>DEF: ${char.stats.def}</li>
        <li>SPD: ${char.stats.spd}</li>
      </ul>
      <button
  onclick="toggleTeam('${char.id}')"
  ${!isSelected && selectedTeam.length >= 4 ? "disabled" : ""}
>
  ${isSelected ? 'ถอดออกจากทีม' : (selectedTeam.length < 4 ? 'เลือกเข้าทีม' : 'ทีมครบ')}
</button>
    `;
        listDiv.appendChild(card);
    });
}

// สลับเลือก/ถอดสมาชิกในทีม
function toggleTeam(id) {
  const idx = selectedTeam.findIndex(c => c.id === id);
  if (idx !== -1) {
    selectedTeam.splice(idx, 1);
  } else if (selectedTeam.length < 4) {
    const found = allCharacters.find(c => c.id === id);
    if (found) selectedTeam.push(found);
  }
  renderCharacterList();
  renderTeam();
}

// แสดงทีมที่เลือกอยู่
function renderTeam() {
  const teamDiv = document.getElementById('team-selected');
  teamDiv.innerHTML = '<h3>ทีมของคุณ</h3>';
  if (selectedTeam.length === 0) {
    teamDiv.innerHTML += '<p>ยังไม่ได้เลือกตัวละครในทีม</p>';
    return;
  }
  selectedTeam.forEach((char, i) => {
    teamDiv.innerHTML += `
      <div class="team-member">
        <strong>#${i+1} ${char.name}</strong> (${char.job}/${char.element}) Lv.${char.level}<br>
        <span>HP:${char.stats.hp} ATK:${char.stats.atk} DEF:${char.stats.def} SPD:${char.stats.spd}</span>
      </div>
    `;
  });
}

// โหลดตอน Page ready
window.onload = fetchCharacters;
window.toggleTeam = toggleTeam;
window.selectedTeam = selectedTeam;
window.allCharacters = allCharacters;

// End TeamBuilder.js