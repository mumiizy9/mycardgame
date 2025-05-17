// js/utils.js
// Utility & helper functions สำหรับ Epic Seven Card Auto Battle ทุกโมดูลใช้ได้

/**
 * Deep clone object (recursively)
 * @param {Object} obj
 * @returns {Object}
 */
window.deepCopy = function(obj) {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Random int [min, max] (inclusive)
 */
window.randInt = function(min, max) {
    if (min === max) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Find element by selector, throw if not found
 * @param {string} selector
 * @returns {HTMLElement}
 */
window.$ = function(selector) {
    let el = document.querySelector(selector);
    if (!el) throw new Error("Element not found: " + selector);
    return el;
};

/**
 * Pluralize text (รองรับ en/th)
 * Example: plural('item', 2, 'en'), plural('ไอเท็ม', 1, 'th')
 */
window.plural = function(word, n, lang = 'th') {
    if (lang === 'en') return n === 1 ? word : word + 's';
    return word;
};

/**
 * Capitalize first letter
 */
window.capFirst = function(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format number with commas (1,234,567)
 */
window.numberWithCommas = function(num) {
    return (num||0).toLocaleString('en-US');
};

/**
 * Format timestamp to "DD/MM/YYYY HH:MM"
 */
window.formatTime = function(ts) {
    let d = new Date(ts); 
    return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()} ${(d.getHours()||0).toString().padStart(2,"0")}:${(d.getMinutes()||0).toString().padStart(2,"0")}`;
};

/**
 * Sleep (await sleep(ms))
 */
window.sleep = function(ms) {
    return new Promise((r) => setTimeout(r, ms));
};

/**
 * Escape HTML special chars (for safe display in innerHTML)
 */
window.escapeHTML = function(str) {
    return (str||"").replace(/[<>&"']/g, c =>
        ({
            '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
        }[c])
    );
};

/**
 * Remove HTML tags (keep just text)
 */
window.stripHTML = function(str) {
    return (str||"").replace(/<(.*?)>/g, "");
};

/**
 * Truncate text to length + ...
 */
window.truncate = function(str, len) {
    str = str || "";
    if(str.length <= len) return str;
    return str.substr(0, len-3) + "...";
};