// auth.js (Rewrite 2024/06) - Epic Seven Card Battle - NEW LOGIN SYSTEM

// State
let Auth = {
    user: null,
    isLoggedIn: false,
    isAdmin: false
};

let userTable = [];

// ===== 1. โหลด user list จาก data/user.json =====
async function fetchUserTable() {
    if (userTable.length) return userTable;
    try {
        const res = await fetch('data/user.json');
        userTable = await res.json();
    } catch {
        userTable = [];
    }
    return userTable;
}

// ===== 2. บันทึก session (LocalStorage) =====
function saveSession(user) {
    localStorage.setItem('user_id', user.id);
    localStorage.setItem('user_name', user.name);
    localStorage.setItem('user_is_admin', user.role === "admin" ? "1" : "0");
}

function clearSession() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_is_admin');
}

// ===== 3. ตรวจสอบ session ใน localStorage =====
function readSession() {
    let id = localStorage.getItem('user_id') || '';
    let name = localStorage.getItem('user_name') || '';
    let admin = localStorage.getItem('user_is_admin') === "1";
    if (id && name) {
        Auth = {
            user: { id, name, role: admin ? "admin" : "player" },
            isLoggedIn: true,
            isAdmin: admin
        };
    } else {
        Auth = { user: null, isLoggedIn: false, isAdmin: false };
    }
    // อัปเดตชื่อบน UI ถ้ามี
    if (typeof setPlayerName === 'function') {
        setPlayerName(Auth.isLoggedIn && Auth.user ? Auth.user.name : '');
    }
}
readSession();

// ===== 4. Popup ฟอร์ม Login =====
function renderLoginForm() {
    return `
        <div class="popup small" style="padding:1.3em 1.2em;">
          <button class="close" onclick="closePopup()">×</button>
          <h2 style="margin-bottom:.95em;">เข้าสู่ระบบ</h2>
          <div id="loginMsg" style="color:#f66;font-size:.93em;margin-bottom:4px;"></div>
          <input id="login_user" type="text" placeholder="User ID..." autocomplete="username" style="width:100%;margin-bottom:7px;">
          <input id="login_pass" type="password" placeholder="Password..." autocomplete="current-password" style="width:100%;margin-bottom:16px;">
          <button class="primary-btn" style="width:100%;margin-bottom:.6em;" onclick="doLogin()">
              ล็อกอิน
          </button>
          <button class="secondary-btn" style="width:100%;" onclick="closePopup()">ยกเลิก</button>
        </div>
    `;
}

window.openLoginPopup = async function () {
    await fetchUserTable();
    window.openPopup('login', renderLoginForm(), 'small', 'เข้าสู่ระบบ');
    setTimeout(() => {
        let el = document.getElementById('login_user');
        if (el) el.focus();
    }, 120);
};

// ===== 5. ฟังก์ชันล็อกอิน + ตรวจสอบ =====
window.doLogin = async function () {
    await fetchUserTable();
    const inputId = document.getElementById('login_user').value.trim();
    const inputPw = document.getElementById('login_pass').value;
    const elMsg = document.getElementById('loginMsg');
    const found = userTable.find(u =>
        u.id === inputId && u.password === inputPw && u.enabled !== false
    );
    if (found) {
        saveSession(found);
        readSession();
        closePopup();
        location.reload();
    } else {
        if (elMsg) elMsg.innerText = 'ชื่อผู้ใช้หรือรหัสผ่านผิด!';
    }
};

// ===== 6. Logout =====
window.doLogout = function () {
    clearSession();
    readSession();
    location.reload();
};

// ===== 7. Shortcut =====
window.getCurrentUser = function () {
    readSession();
    return Auth.user;
}
window.isAdmin = function () {
    readSession();
    return Auth.isAdmin;
}
window.isLoggedIn = function () {
    readSession();
    return Auth.isLoggedIn;
}

// ===== 8. On load: set event handler/login button =====
document.addEventListener('DOMContentLoaded', () => {
    readSession();
    let btn = document.getElementById('btnLogin');
    if (btn) {
        // Toggle text and func
        if (Auth.isLoggedIn) {
            btn.textContent = "ออกจากระบบ";
            btn.onclick = window.doLogout;
        } else {
            btn.textContent = "เข้าสู่ระบบ";
            btn.onclick = window.openLoginPopup;
        }
    }
    // กำหนดชื่อ user
    if (typeof setPlayerName === 'function') {
        setPlayerName(Auth.isLoggedIn && Auth.user ? Auth.user.name : '');
    }
});

// ===== 9. EXPORT (for legacy/compatibility) =====
window.authEngine = {
    user: () => getCurrentUser(),
    isAdmin,
    isLoggedIn,
    login: window.doLogin,
    logout: window.doLogout,
    open: window.openLoginPopup
};