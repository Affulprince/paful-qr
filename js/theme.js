// Light / dark / system theme toggle, persisted to localStorage, driving
// Bootstrap 5.3's native data-bs-theme attribute so every Bootstrap
// component (navbar, cards, forms, modals, toasts) re-themes automatically.
'use strict';

const Theme = {
  key: 'paful-qr-theme',
  mediaQuery: window.matchMedia('(prefers-color-scheme: dark)'),

  get() {
    try {
      return localStorage.getItem(this.key) || 'system';
    } catch (err) {
      return 'system';
    }
  },

  resolvedMode(mode) {
    return mode === 'system' ? (this.mediaQuery.matches ? 'dark' : 'light') : mode;
  },

  set(mode) {
    document.documentElement.setAttribute('data-bs-theme', this.resolvedMode(mode));
    try {
      localStorage.setItem(this.key, mode);
    } catch (err) {
      // localStorage unavailable (private mode / quota) — theme still applies for this session.
    }
    this.reflectButtons(mode);
  },

  reflectButtons(mode) {
    Utils.qsa('[data-theme-option]').forEach((btn) => {
      const isActive = btn.getAttribute('data-theme-option') === mode;
      btn.setAttribute('aria-pressed', String(isActive));
      btn.classList.toggle('active', isActive);
    });
  },

  init() {
    this.set(this.get());
    Utils.qsa('[data-theme-option]').forEach((btn) => {
      btn.addEventListener('click', () => this.set(btn.getAttribute('data-theme-option')));
    });
    this.mediaQuery.addEventListener('change', () => {
      if (this.get() === 'system') this.set('system');
    });
  },
};
