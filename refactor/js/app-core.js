/* ==== FILE: js/app-core.js ==== */

(function (global) {
    'use strict';

    const SQG = global.SQG || {};

    function isPlainObject(value) {
        return Object.prototype.toString.call(value) === '[object Object]';
    }

    function readStorage(key, fallback = null) {
        try {
            const value = global.localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch {
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            global.localStorage.setItem(key, value);
            return true;
        } catch {
            return false;
        }
    }

    function readJSON(key, fallback) {
        const stored = readStorage(key, null);
        if (stored === null) return fallback;

        try {
            const parsed = JSON.parse(stored);
            return parsed === null ? fallback : parsed;
        } catch {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        return writeStorage(key, JSON.stringify(value));
    }

    function readBoolean(key, fallback = false) {
        const stored = readStorage(key, null);
        if (stored === null) return fallback;
        return stored === 'true';
    }

    function readNumber(key, fallback, { min = -Infinity, max = Infinity } = {}) {
        const stored = readStorage(key, null);
        if (stored === null || stored === '') return fallback;

        const parsed = Number(stored);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.min(max, Math.max(min, parsed));
    }

    function getContrastColor(hexColor) {
        if (typeof hexColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(hexColor)) {
            return '#000000';
        }

        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    function adjustColorBrightness(hexColor, percent) {
        if (typeof hexColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(hexColor)) {
            return hexColor;
        }

        const num = parseInt(hexColor.slice(1), 16);
        const amount = Math.round(2.55 * percent);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));

        return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
    }

    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
        } else {
            callback();
        }
    }

    function escapeHTML(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    SQG.isPlainObject = isPlainObject;
    SQG.storage = Object.freeze({
        read: readStorage,
        write: writeStorage,
        readJSON,
        writeJSON,
        readBoolean,
        readNumber
    });
    SQG.color = Object.freeze({
        getContrastColor,
        adjustColorBrightness
    });
    SQG.dom = Object.freeze({ ready, escapeHTML });

    global.SQG = SQG;
})(window);
