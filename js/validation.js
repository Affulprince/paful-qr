// Input validation & normalization for QR content fields.
'use strict';

const Validation = {
  // Adds https:// when the input looks like a bare domain, leaves everything
  // else untouched so users can still intentionally generate plain text.
  normalizeUrl(input) {
    const value = input.trim();
    if (!value) return { value: '', warning: null };

    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
      // Already has a scheme (http:, mailto:, tel:, etc.)
      return { value, warning: null };
    }

    const looksLikeDomain = /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(value);
    if (looksLikeDomain) {
      return { value: `https://${value}`, warning: 'Added https:// automatically.' };
    }

    return { value, warning: 'This doesn\'t look like a typical URL — it will be encoded as plain text.' };
  },

  isValidUrl(value) {
    try {
      const url = new URL(value);
      return Boolean(url.protocol && url.host);
    } catch (err) {
      return false;
    }
  },

  isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  },

  // Loose E.164-ish check: optional +, 7-15 digits.
  isValidPhoneDigits(value) {
    const digits = value.replace(/[^\d]/g, '');
    return digits.length >= 7 && digits.length <= 15;
  },

  onlyDigits(value) {
    return value.replace(/[^\d]/g, '');
  },

  isValidLatLng(lat, lng) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    return Number.isFinite(latNum) && Number.isFinite(lngNum)
      && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
  },

  // Escapes characters reserved by the WIFI: / vCard field grammars.
  escapeFieldValue(value) {
    return String(value).replace(/([\\;,:"])/g, '\\$1');
  },

  required(value, label) {
    if (!value || !String(value).trim()) {
      return `${label} is required.`;
    }
    return null;
  },
};
