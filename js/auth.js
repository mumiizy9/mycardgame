// js/auth.js - Epic Seven Card Battle - Auth/Login System (Frontend only)
// Author: (yourname)
// รองรับ admin, player, check session, call API user info

let loginState = {
    loggedIn: false,
    isAdmin: false,
    user: null
};
let users = [];

async function loadUserList() {
    if (users.length) return;
    users = await fetch('data/user.json').then(res => res.json());
}
function saveCurrentSession(user) {
    localStorage.setItem('user_id', user.id);
    localStorage.setItem('user_name', user.name);
    localStorage.setItem('user_is_admin', user.role === "admin" ? "1" : "0");
    loginState = { loggedIn: true, isAdmin: user.role === "admin", user };
}

function clearSession() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_is_admin');
    loginState = { loggedIn: false, isAdmin: false, user: null };
}

// UI Login - Popup HTML
function renderLoginPopup() {
    return `
    <div class="popup small">
    <button class="close" onclick="closePopup()">×</button>
    <h2>เข้าสู่ระบบ</h2>
    <div id="loginErrorMsg" style="color:#f77;font-size:.9em;"></div>
    <input id="auth_user_id" placeholder="User ID..." autocomplete="username"/>
    <input id="auth_user_pw" type="password" placeholder="Password..." autocomplete="current-password" />
    <button class="primary-btn" style="margin-top:1.1em;" onclick="doLoginNow()">ล็อกอิน</button>
    <button class="secondary-btn" onclick="closePopup()" style="margin:1em 0 0 0;">ยกเลิก</button>
    </div>
    `;
}

// ตรวจ session (โหลดครั้งแรก)
function checkSession() {
    let userId = localStorage.getItem('user_id');
    let userName = localStorage.getItem('user_name');
    let isAdmin = localStorage.getItem('user_is_admin') === "1";
    if (userId && userName) {
        loginState = { loggedIn: true, isAdmin, user: { id: userId, name: userName, role: isAdmin ? "admin" : "player" } };
    }
    setPlayerName(loginState.loggedIn ? loginState.user.name : "");
}

// ปุ่มล็อกอินบน index
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    let btn = document.getElementById('btnLogin');
    if (btn) btn.onclick = openLoginPopup;
    if (loginState.loggedIn) {
        btn.textContent = "ออกจากระบบ";
        btn.onclick = doLogout;
    }
    // อัปเดตชื่อผู้ใช้
    setPlayerName(loginState.loggedIn ? loginState.user.name : "");
});

// เปิด popup ล็อกอิน
window.openLoginPopup = async function () {
    await loadUserList();
    window.openPopup('login', renderLoginPopup(), 'small', 'เข้าสู่ระบบ');
    setTimeout(() => document.getElementById('auth_user_id')?.focus(), 180);
}
// ปุ่ม "เข้าสู่ระบบ" จริง
window.doLoginNow = async function () {
    await loadUserList();
    let id = document.getElementById('auth_user_id').value.trim();
    let pw = document.getElementById('auth_user_pw').value;
    let el = document.getElementById('loginErrorMsg');
    let user = users.find(u =>
        u.id === id && u.password === pw && u.enabled !== false
    );
    if (user) {
        saveCurrentSession(user);
        setPlayerName(user.name);
        closePopup();
        location.reload();
    } else {
        el.innerText = "รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง!";
    }
}

// ปุ่ม logout
window.doLogout = function () {
    clearSession();
    location.reload();
}

// Helper สำหรับระบบ/JS อื่นดึง user ปัจจุบัน
window.getCurrentUser = function () {
    checkSession();
    return loginState.user || null;
}

window.isAdmin = function () {
    checkSession();
    return loginState.isAdmin;
}

window.isLoggedIn = function () {
    checkSession();
    return loginState.loggedIn;
}