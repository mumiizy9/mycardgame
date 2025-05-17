// js/team.js

const maxTeam = 4;

let allChars = [];   // ทั้งหมดที่ผู้เล่นมี
let team = [];       // id ตัวที่เลือก

/**
 * โหลดตัวละครจากไฟล์ (mock: as static, ในโปรดักชัน fetch จริง)
 */
async function loadCharacters() {
    // สมมติ user มี asra กับ slime_basic (เพิ่มได้ในภายหลัง)
    let charIds = ['astra', 'slime_basic'];
    let res = await Promise.all(
        charIds.map(id => fetch(`data/char/${id}.json`).then(r => r.json()))
    );
    allChars = res;
}

/**
 * โหลดทีมจาก LocalStorage
 */
function loadTeam() {
    let t = localStorage.getItem('userTeam');
    if (!t) team = [];
    else team = JSON.parse(t);
}

/**
 * เซฟทีมลง LocalStorage
 */
function saveTeam() {
    const cleanTeam = team.filter(id => !!id); // แก้ไข: กรอง id ที่มีจริงเท่านั้น
    localStorage.setItem('userTeam', JSON.stringify(cleanTeam)); // ใช้ cleanTeam
    alert("บันทึกทีมสำเร็จ!");
}

/**
 * render UI slot ทีม (สูงสุด 4)
 */
function renderTeamBar() {
    const el = document.getElementById('teamSlotBar');
    if (!el) return; // แก้ไข: ป้องกันกรณี element ไม่เจอ
    el.innerHTML = '';
    for (let i = 0; i < maxTeam; i++) {
        let char = allChars.find(c=>c.id===team[i]);
        let slot = document.createElement('div');
        slot.className = 'card';
        slot.style.minHeight = "140px";
        slot.dataset.idx = i;
        if (char) {
            slot.innerHTML = `
                <img src="img/char/${char.img}" class="hero-img" alt="${char.name}">
                <div class="name">${char.name}</div>
                <button class="primary-btn" style="margin:7px 0 4px 0;font-size:.93em;" onclick="removeFromTeam(${i})">นำออก</button>
            `;
        } else {
            slot.innerHTML = `<div style="opacity:.44;margin-top:30px;text-align:center;">ว่าง</div>`;
            slot.style.background = '#262a39b2';
        }
        el.appendChild(slot);
    }
}

/**
 * render คลังตัวละคร ดึงจาก allChars ทั้งหมด
 */
function renderCharCollection() {
    const el = document.getElementById('charCollection');
    if (!el) return; // แก้ไข: ป้องกันกรณี element ไม่เจอ
    el.innerHTML = '';
    allChars.forEach(c => {
        // ถ้ามีในทีมแล้ว ไม่ให้ลากซ้ำ
        let inTeam = team.includes(c.id);
        let div = document.createElement('div');
        div.className = 'card';
        div.draggable = !inTeam;
        div.style.opacity = inTeam ? '.34' : '1.0';
        div.style.cursor = inTeam ? "not-allowed" : "grab";
        div.innerHTML = `
            <img src="img/char/${c.img}" class="hero-img" alt="${c.name}" >
            <div class="name">${c.name}</div>
            <div style="font-size:.92em;margin-bottom:3px;">Lv.${c.level} &nbsp; <small class="stat-bar">${c.hp} HP</small></div>
        `;
        // Popover info
        div.addEventListener('click', e=>{
            openCharInfoPopup(c);
        });
        // Drag: เลือกใส่ทีม
        div.addEventListener('dragstart', ev=>{
            ev.dataTransfer.setData("text/plain", c.id);
        });
        el.appendChild(div);
    });
    // ทีมรับ event drop
    const teamSlots = document.querySelectorAll('#teamSlotBar .card');
    teamSlots.forEach(slot=>{
        slot.ondragover = e=>{e.preventDefault(); slot.style.borderColor='#49cfffa8';}
        slot.ondragleave = e=>{slot.style.borderColor='';}
        slot.ondrop = function(e){
            e.preventDefault();
            let dragId = e.dataTransfer.getData("text/plain");
            let idx = Number(slot.dataset.idx);
            // กรองซ้ำ
            if (team.includes(dragId)) return;
            team[idx] = dragId;
            saveTeam();
            renderTeamBar();
            renderCharCollection();
        }
    });
}

/**
 * Remove ตัวจากทีม
 */
window.removeFromTeam = function(idx){
    team[idx] = undefined;
    renderTeamBar(); renderCharCollection();
}

/**
 * Pop-up info ตัวละคร
 */
function openCharInfoPopup(char){
    closePopup();
    window.openPopup('charInfo', {char});
}

/**
 * เพิ่ม template popup สำหรับดูรายละเอียดตัวละคร
 */
(function(){
    const origRenderPopup = window.renderPopup;
    window.renderPopup = function(type, data){
        if(type=="charInfo" && data && data.char){
            const c = data.char;
            return `<div class="popup" style="min-width:285px;">
                <button class="close" onclick="closePopup()">×</button>
                <img src="img/char/${c.img}" class="hero-img" style="margin:auto;display:block;" />
                <div class="name" style="text-align:center;">${c.name}</div>
                <div style="margin-top:8px;font-size:.97em;color:#87cdff;">Lv.${c.level} ★${c.star} <span> (${c.class})</span></div>
                <hr style="margin:8px 0 8px 0;border-color:#234;">
                <div><b>HP</b> ${c.hp} &nbsp; <b>ATK</b> ${c.atk} &nbsp; <b>DEF</b> ${c.def}</div>
                <div><b>SPD</b> ${c.spd} &nbsp; <b>CRIT%:</b> ${c.crit_rate}</div>
                <div><b>Skills</b>:</div>
                <ul>${c.skills.map(s=> `<li><b>${s.name}</b>: ${s.desc}</li>`).join('')}</ul>
            </div>`;
        }
        return origRenderPopup(type, data);
    }
})();

/**
 * กดปุ่มบันทึก
 */
document.addEventListener('DOMContentLoaded', ()=>{
    const btnSaveTeam = document.getElementById('btnSaveTeam');
    if (btnSaveTeam) btnSaveTeam.onclick = saveTeam; // แก้ไข: ป้องกันกรณี element ไม่เจอ
});

/**
 * กลับหน้าหลัก
 */
const btnBack = document.getElementById('btnBack');
if (btnBack) btnBack.onclick = ()=>{ window.location.href = 'index.html'; } // แก้ไข: ป้องกันกรณี element ไม่เจอ

/**
 * INITIALIZE
 */
(async()=>{
    await loadCharacters();
    loadTeam();
    renderTeamBar();
    renderCharCollection();
})();