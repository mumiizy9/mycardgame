// Gacha.js - ระบบสุ่มกาชาตัวละคร

let userCharacters = []; // รหัสตัวละครที่ผู้เล่นมี
let gachaPool = [];
let gachaAllCharacters = [];
let gachaCost = 0;
let userGold = 5000; // ทดสอบ เริ่มต้น

async function initGacha() {
  let [gachaRes, charRes] = await Promise.all([
    fetch('./data/gacha.json'),
    fetch('./data/characters.json')
  ]);
  let gachaData = await gachaRes.json();
  allCharacters = await charRes.json();
  gachaPool = gachaData.gacha_pool;
  gachaCost = gachaData.gacha_cost;
  renderGachaUI();
}

function renderGachaUI() {
  const gachaDiv = document.getElementById('gacha-root');
  gachaDiv.innerHTML = `
    <div class='gacha-box'>
      <h2>Gacha / Recruit</h2>
      <div>Gold ของคุณ: <span id="user-gold">${userGold}</span></div>
      <button onclick="rollGacha()" ${userGold < gachaCost ? 'disabled' : ''}>สุ่มตัวละคร (${gachaCost} Gold)</button>
      <div id="gacha-result"></div>
      <h3>ตัวละครที่คุณมี</h3>
      <div id="user-characters"></div>
    </div>
  `;
  renderUserCharacters();
}

function rollGacha() {
  if (userGold < gachaCost) {
    alert("Gold ไม่พอ");
    return;
  }
  // สร้าง pool ที่ยังไม่ได้ จาก userCharacters
  let available = gachaPool.filter(
    g => !userCharacters.includes(g.character_id)
  );
  if (available.length === 0) {
    document.getElementById('gacha-result').innerHTML = "<p>คุณมีตัวละครครบทุกตัวแล้ว!</p>";
    return;
  }
  let sum = available.reduce((acc, curr) => acc + curr.weight, 0);
  let rand = Math.random() * sum;
  let acc = 0;
  let selectedId = null;
  for (let entry of available) {
    acc += entry.weight;
    if (rand <= acc) {
      selectedId = entry.character_id;
      break;
    }
  }
  userGold -= gachaCost;
  userCharacters.push(selectedId);
  let charInfo = allCharacters.find(c => c.id === selectedId);
  document.getElementById('user-gold').textContent = userGold;
  document.getElementById('gacha-result').innerHTML = `
    <div class="gacha-result-card">
      <strong>สุ่มได้:</strong> ${charInfo.name} <br/>
      (${charInfo.job} / ${charInfo.element}) ★${charInfo.rarity}
    </div>`;
  renderUserCharacters();
  if (userCharacters.length === gachaPool.length)
    document.getElementById('gacha-result').innerHTML += "<p>คุณมีตัวละครครบทุกตัวแล้ว!</p>";
}

function renderUserCharacters() {
  const div = document.getElementById('user-characters');
  if (userCharacters.length === 0) {
    div.innerHTML = '<em>ยังไม่มีตัวละคร</em>';
    return;
  }
  div.innerHTML = "";
  userCharacters.forEach(id => {
    let char = allCharacters.find(c => c.id === id);
    div.innerHTML += `
      <div class="character-card">
        <h4>${char.name} (${char.job} / ${char.element})</h4>
        <p>★${char.rarity} | Lv.${char.level}</p>
      </div>
    `;
  });
}


// สำหรับโหลด script
window.initGacha = initGacha;
window.rollGacha = rollGacha;

// End Gacha.js