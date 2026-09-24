// Small shared helpers used across modules.
'use strict';

const Utils = {
  qs(selector, scope) {
    return (scope || document).querySelector(selector);
  },

  qsa(selector, scope) {
    return Array.from((scope || document).querySelectorAll(selector));
  },

  debounce(fn, wait) {
    let timer = null;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  },

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  // Reads a File as a data URL, rejecting oversized or non-image files.
  readImageFile(file, maxBytes) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please choose an image file (PNG, JPG, SVG or WebP).'));
        return;
      }
      if (maxBytes && file.size > maxBytes) {
        reject(new Error(`That image is too large (max ${(maxBytes / (1024 * 1024)).toFixed(1)}MB).`));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read that image file.'));
      reader.readAsDataURL(file);
    });
  },

  // Relative luminance / contrast ratio (WCAG formula), used as a heuristic only.
  hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean;
    const num = parseInt(full, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  },

  relativeLuminance({ r, g, b }) {
    const channel = (c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  },

  contrastRatio(hexA, hexB) {
    try {
      const lumA = Utils.relativeLuminance(Utils.hexToRgb(hexA));
      const lumB = Utils.relativeLuminance(Utils.hexToRgb(hexB));
      const lighter = Math.max(lumA, lumB);
      const darker = Math.min(lumA, lumB);
      return (lighter + 0.05) / (darker + 0.05);
    } catch (err) {
      return null;
    }
  },

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
  },

  uid(prefix = 'id') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  },
};
