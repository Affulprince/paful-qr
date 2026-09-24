// Thin wrapper around a single reusable Bootstrap Toast (#appToast, present
// on every page) so each page controller can call Toast.show(message, kind)
// instead of re-implementing status banners.
'use strict';

const Toast = {
  kindClass: {
    success: 'text-bg-success',
    error: 'text-bg-danger',
    warning: 'text-bg-warning',
    info: 'text-bg-primary',
  },

  show(message, kind = 'info') {
    const el = document.getElementById('appToast');
    if (!el || typeof bootstrap === 'undefined') {
      console.log(`[${kind}] ${message}`);
      return;
    }
    Object.values(this.kindClass).forEach((cls) => el.classList.remove(cls));
    el.classList.add(this.kindClass[kind] || this.kindClass.info);
    el.querySelector('.toast-body').textContent = message;
    bootstrap.Toast.getOrCreateInstance(el, { delay: kind === 'error' ? 6000 : 4000 }).show();
  },
};
