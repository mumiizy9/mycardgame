// js/ui.js
document.addEventListener('DOMContentLoaded', () => {
    // Menu button event mapping: [btnId, popupId or function]
    const menuActions = {
        btnTeam: () => openPopup('team'),
        btnBattle: () => {
            document.getElementById('mainBattlefield').classList.remove('hide');
            closePopup();
            
        },
        btnInventory: () => openPopup('inventory'),
        btnQuest: () => openPopup('quest'),
        btnShop: () => openPopup('shop'),
        btnGacha: () => openPopup('gacha'),
        btnCharacter: () => openPopup('characterCollection'),
        btnAnnouncement: () => openPopup('announcement'),
        btnChat: () => openPopup('chat'),
        btnLogin: () => openPopup('login'),
    };

    Object.entries(menuActions).forEach(([btnId, action]) => {
        const btn = document.getElementById(btnId);
        if (btn) btn.addEventListener('click', action);
    });

    // Popup Layer logic
    window.openPopup = function(type, data = {}) {
        const popupLayer = document.getElementById('popupLayer');
        popupLayer.innerHTML = renderPopup(type, data);
        popupLayer.classList.add('active');
    };

    // Close popup
    window.closePopup = function() {
        const popupLayer = document.getElementById('popupLayer');
        popupLayer.innerHTML = '';
        popupLayer.classList.remove('active');
    };

    // Render central popup UI (type: string, data: Object)
    function renderPopup(type, data) {
        // Popup templates for each feature
        const templates = {
            team: `<div class="popup"><button class="close" onclick="closePopup()">×</button>
                <h2>จัดทีม</h2><div id="teamEditArea"></div></div>`,
            inventory: `<div class="popup"><button class="close" onclick="closePopup()">×</button>
                <h2>คลังไอเท็ม</h2><div id="inventoryArea"></div></div>`,
            quest: `<div class="popup"><button class="close" onclick="closePopup()">×</button>
                <h2>เควสต์</h2><div id="questArea"></div></div>`,
            shop: `<div class="popup"><button class="close" onclick="closePopup()">×</button>
                <h2>ร้านค้า</h2><div id="shopArea"></div></div>`,
            gacha: `<div class="popup"><button class="close" onclick="closePopup()">×</button>
                <h2>กาชา</h2><div id="gachaArea"></div></div>`,
            characterCollection: `<div class="popup"><button class="close" onclick="closePopup()">×</button>
                <h2>คลังตัวละคร</h2><div id="characterArea"></div></div>`,
            announcement: `<div class="popup large"><button class="close" onclick="closePopup()">×</button>
                <h2>ประกาศ</h2><div id="announcementArea"></div></div>`,
            chat: `<div class="popup tall"><button class="close" onclick="closePopup()">×</button>
                <h2>แชท</h2><div id="chatArea"></div></div>`,
            login: `<div class="popup small"><button class="close" onclick="closePopup()">×</button>
                <h2>เข้าสู่ระบบ</h2>
                <input id="userId" placeholder="User ID" /><input id="userPass" type="password" placeholder="Password" />
                <button id="doLoginBtn">เข้าสู่ระบบ</button>
                <div id="loginHint"></div>
                </div>`,
        };
        if (!templates[type]) return '<div class="popup"><button class="close" onclick="closePopup()">×</button><p>ยังไม่รองรับ</p></div>';
        return templates[type];
    }

    // Escape popup with ESC key
    document.addEventListener('keyup', (ev) => {
        if (ev.key === 'Escape') closePopup();
    });

    // Hide battlefield when clicking "Back"
    const btnBack = document.getElementById('btnBack');
    if (btnBack) btnBack.addEventListener('click', () => {
        document.getElementById('mainBattlefield').classList.add('hide');
    });

    // Responsive popup layer CSS logic (for .active popup display)
    // (Style in css/style.css, eg. for .popup, .popup.large, .popup.tall, etc.)

    // Helper: show player name if logged in
    window.setPlayerName = function(name) {
        document.getElementById('playerName').textContent = name || '';
    };

    // Helper: trigger noti dot (menu) if new message (ex. quest, announcement)
    window.setMenuNoti = function(btnId, show) {
        const btn = document.getElementById(btnId);
        if (btn) {
            if (show) btn.classList.add('noti');
            else btn.classList.remove('noti');
        }
    };

    // Helper: clear all popup
    window.clearAllPopup = closePopup;
});
