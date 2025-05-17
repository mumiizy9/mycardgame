// /js/popupManager.js

/**
 * popupManager.js
 * Epic Seven Auto Battle - Popup System (v1.0)
 * จัดการเปิด-ปิด Pop-up กลาง / popover ซ้อน
 * รองรับ HTML Content, Callback, Responsive
 * ใช้ร่วมกับ index.html, ui.js, ทุก module
 * Author: (คุณ)
 */

// เก็บ Stack ของ popup สำหรับเปิดซ้อน
let popupStack = [];

/**
 * เปิด Popup กลางจอ
 * @param {Object} options { 
 *    id: string, // ชื่อ feature, ใช้เป็น key menu, ex: 'quest', 'inventory'
 *    title: string, // ชื่อแสดงหัวข้อ
 *    content: HTML string, // เนื้อหา HTML (innerHTML)
 *    size: "normal" | "large" | "tall" | "small",
 *    onClose: function, // callback เมื่อ popup นี้ปิด
 *    showCloseBtn: boolean, // แสดงปุ่มปิด (default: true)
 *    autoFocus: CSS selector (optional, โฟกัส input)
 * }
 */
window.popupManager = {
    open: function (options = {}) {
        // ป้องกัน popup ซ้อนซ้ำชื่อเดิม
        if (popupStack.some(p => p.id === options.id)) {
            return; // ถ้ามีแล้วไม่ต้องเปิดซ้ำ
        }
        const popupLayer = document.getElementById('popupLayer');
        if (!popupLayer) return;

        const { id, title, content, size, onClose, showCloseBtn, autoFocus } = options;
        const sz = size || 'normal';
        let html = `
      <div class="popup${sz === 'large' ? ' large' : sz === 'tall' ? ' tall' : sz === 'small' ? ' small' : ''}" 
        style="z-index: ${100 + popupStack.length * 2};" popup-id="${id || ''}">
          ${showCloseBtn === false ? '' : `<button class="close" onclick="popupManager.close('${id || ''}')">×</button>`}
          <h2 style="margin-bottom:.39em;">${title || ''}</h2>
          <div class="popup-content" style="margin-top:9px;">${content || ''}</div>
      </div>`;

        let wrap = document.createElement('div');
        wrap.className = 'popup-wrap-layer';
        wrap.style = `position:fixed; top:0; left:0; width:100vw;height:100vh;display:flex;
          align-items:center;justify-content:center;z-index:${99 + popupStack.length * 2 + 1};`;
        wrap.innerHTML = html;

        // Store info to Stack
        popupStack.push({
            id,
            wrap,
            onClose: typeof onClose === "function" ? onClose : null
        });

        popupLayer.appendChild(wrap);
        popupLayer.classList.add('active');

        // Auto focus
        if (autoFocus) {
            setTimeout(() => {
                const el = wrap.querySelector(autoFocus);
                if (el) el.focus();
            }, 150);
        }
    },

    /**
     * ปิด Popup (ปิดบนสุดล่าสุด หรือตาม id)
     * @param {string} id
     */
    close: function (id = '') {
        const popupLayer = document.getElementById('popupLayer');
        if (!popupLayer) return;
        if (popupStack.length === 0) return;
        let pop;
        if (id) {
            let idx = popupStack.findIndex(p => p.id === id);
            if (idx === -1) return;
            pop = popupStack.splice(idx, 1)[0];
            if (pop && pop.wrap) {
                pop.wrap.remove();
            }
        } else {
            // ถ้าไม่ส่ง id ให้ปิดตัวบนสุด
            pop = popupStack.pop();
            if (pop && pop.wrap) {
                pop.wrap.remove();
            }
        }
        // onClose callback
        if (pop && pop.onClose) pop.onClose();

        // หากไม่มี popup อื่นเหลือ ให้ปิด layer
        if (popupStack.length === 0) {
            popupLayer.classList.remove('active');
        }
    },

    /**
     * ปิด Popups ทั้งหมด (reset stack)
     */
    closeAll: function () {
        const popupLayer = document.getElementById('popupLayer');
        popupStack.forEach(p => {
            if (p.wrap) p.wrap.remove();
            if (typeof p.onClose === "function") p.onClose();
        });
        popupStack = [];
        if (popupLayer) popupLayer.classList.remove('active');
    },

    /**
     * Render content ใหม่บน popup id นี้ (เช่น refetch/refresh)
     * @param {string} id
     * @param {string} content HTML
     */
    update: function (id, content) {
        let pop = popupStack.find(p => p.id === id);
        if (pop && pop.wrap) {
            let inner = pop.wrap.querySelector('.popup-content');
            if (inner) inner.innerHTML = content;
        }
    },

    /**
     * ดึง Stack popups
     */
    getStack: function () { return [...popupStack]; }
};

// [Global shortcut]
window.openPopup = function (id, content = '', size = 'normal', title = '', options = {}) {
    // For backward compat: openPopup(type, html, size, title, { ... })
    window.popupManager.open({
        id, title: title || id, content, size, ...options
    });
}
window.closePopup = function (id = '') { window.popupManager.close(id); }
window.closeAllPopup = function () { window.popupManager.closeAll(); }

// Escape = close popup ล่าสุด
document.addEventListener('keyup', ev => {
    if (ev.key === 'Escape') popupManager.close();
});

// Click shadow layer (ปิด popup ล่าสุด เฉพาะ popup ที่อนุญาต)
document.getElementById('popupLayer')?.addEventListener('mousedown', ev => {
    if (ev.target.classList.contains('popup-wrap-layer')) {
        // หาก popup บนสุดมี showCloseBtn = false => ไม่ปิด ด้วยคลิก
        if (popupStack.length === 0) return;
        let last = popupStack[popupStack.length - 1];
        if (last && last.wrap && last.wrap.querySelector('.close')) {
            window.popupManager.close();
        }
    }
});