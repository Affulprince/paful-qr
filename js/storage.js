// Safe localStorage read/write helpers — every caller gets a clear
// unavailable/quota-exceeded signal instead of a thrown exception.
'use strict';

const Storage = {
  available() {
    try {
      const testKey = '__paful_qr_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (err) {
      return false;
    }
  },

  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return { ok: true };
    } catch (err) {
      const quota = err && (err.name === 'QuotaExceededError' || err.code === 22);
      return {
        ok: false,
        message: quota
          ? 'Storage is full. Delete some saved QR codes and try again.'
          : 'Local storage isn\'t available in this browser (private browsing may block it).',
      };
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      // Nothing to do — storage already unavailable.
    }
  },
};
