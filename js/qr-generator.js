// Turns per-type form field values into the raw string that gets encoded into the QR code.
'use strict';

const QRGenerator = {
  // Each builder receives a plain object of field values (already trimmed)
  // and returns { value, errors, warnings }.

  url(fields) {
    const errors = [];
    const err = Validation.required(fields.url, 'URL');
    if (err) errors.push(err);
    if (errors.length) return { value: '', errors, warnings: [] };

    const { value, warning } = Validation.normalizeUrl(fields.url);
    return { value, errors, warnings: warning ? [warning] : [] };
  },

  text(fields) {
    const errors = [];
    const err = Validation.required(fields.text, 'Text');
    if (err) errors.push(err);
    return { value: fields.text || '', errors, warnings: [] };
  },

  whatsapp(fields) {
    const errors = [];
    if (!fields.phone || !Validation.isValidPhoneDigits(`${fields.countryCode || ''}${fields.phone}`)) {
      errors.push('Enter a valid WhatsApp number, including country code.');
    }
    if (errors.length) return { value: '', errors, warnings: [] };
    const digits = Validation.onlyDigits(`${fields.countryCode || ''}${fields.phone}`);
    const message = fields.message ? `?text=${encodeURIComponent(fields.message)}` : '';
    return { value: `https://wa.me/${digits}${message}`, errors, warnings: [] };
  },

  phone(fields) {
    const errors = [];
    if (!fields.phone || !Validation.isValidPhoneDigits(fields.phone)) {
      errors.push('Enter a valid phone number.');
    }
    if (errors.length) return { value: '', errors, warnings: [] };
    const digits = fields.phone.trim().replace(/[^\d+]/g, '');
    return { value: `tel:${digits.startsWith('+') ? digits : `+${digits}`}`, errors, warnings: [] };
  },

  sms(fields) {
    const errors = [];
    if (!fields.phone || !Validation.isValidPhoneDigits(fields.phone)) {
      errors.push('Enter a valid phone number.');
    }
    if (errors.length) return { value: '', errors, warnings: [] };
    const digits = fields.phone.trim().replace(/[^\d+]/g, '');
    const body = fields.message ? `?body=${encodeURIComponent(fields.message)}` : '';
    return { value: `sms:${digits}${body}`, errors, warnings: [] };
  },

  email(fields) {
    const errors = [];
    if (!fields.email || !Validation.isValidEmail(fields.email)) {
      errors.push('Enter a valid email address.');
    }
    if (errors.length) return { value: '', errors, warnings: [] };
    const params = [];
    if (fields.subject) params.push(`subject=${encodeURIComponent(fields.subject)}`);
    if (fields.body) params.push(`body=${encodeURIComponent(fields.body)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return { value: `mailto:${fields.email.trim()}${query}`, errors, warnings: [] };
  },

  vcard(fields) {
    const errors = [];
    if (!fields.firstName && !fields.lastName) {
      errors.push('Enter at least a first or last name.');
    }
    if (fields.email && !Validation.isValidEmail(fields.email)) {
      errors.push('That email address doesn\'t look valid.');
    }
    if (errors.length) return { value: '', errors, warnings: [] };

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${fields.lastName || ''};${fields.firstName || ''};;;`,
      `FN:${[fields.firstName, fields.lastName].filter(Boolean).join(' ')}`,
    ];
    if (fields.org) lines.push(`ORG:${fields.org}`);
    if (fields.title) lines.push(`TITLE:${fields.title}`);
    if (fields.phone) lines.push(`TEL;TYPE=CELL:${fields.phone}`);
    if (fields.email) lines.push(`EMAIL:${fields.email}`);
    if (fields.website) lines.push(`URL:${Validation.normalizeUrl(fields.website).value}`);
    if (fields.address) lines.push(`ADR;TYPE=WORK:;;${fields.address};;;;`);
    if (fields.social) lines.push(`X-SOCIALPROFILE;TYPE=profile:${Validation.normalizeUrl(fields.social).value}`);
    lines.push('END:VCARD');

    return { value: lines.join('\n'), errors, warnings: [] };
  },

  social(fields) {
    const errors = [];
    if (!fields.handle) errors.push('Enter a profile URL or username.');
    if (errors.length) return { value: '', errors, warnings: [] };

    const bases = {
      facebook: 'https://facebook.com/',
      instagram: 'https://instagram.com/',
      tiktok: 'https://tiktok.com/@',
      youtube: 'https://youtube.com/',
      linkedin: 'https://linkedin.com/in/',
      x: 'https://x.com/',
      whatsapp: 'https://wa.me/',
    };
    const raw = fields.handle.trim();
    if (/^https?:\/\//i.test(raw)) {
      return { value: raw, errors, warnings: [] };
    }
    const handle = raw.replace(/^@/, '');
    const base = bases[fields.platform] || 'https://';
    return { value: `${base}${handle}`, errors, warnings: [] };
  },

  wifi(fields) {
    const errors = [];
    if (!fields.ssid) errors.push('Network name (SSID) is required.');
    const security = fields.security || 'WPA';
    if (security !== 'nopass' && !fields.password) {
      errors.push('Enter the network password, or set security to "None".');
    }
    if (errors.length) return { value: '', errors, warnings: [] };

    const ssid = Validation.escapeFieldValue(fields.ssid);
    const pass = security === 'nopass' ? '' : Validation.escapeFieldValue(fields.password);
    const hidden = fields.hidden ? 'true' : 'false';
    return {
      value: `WIFI:T:${security};S:${ssid};P:${pass};H:${hidden};;`,
      errors,
      warnings: [],
    };
  },

  location(fields) {
    const errors = [];
    const warnings = [];

    if (fields.mapsUrl) {
      return { value: fields.mapsUrl.trim(), errors, warnings };
    }
    if (!Validation.isValidLatLng(fields.lat, fields.lng)) {
      errors.push('Enter valid latitude/longitude values, or a Google Maps link instead.');
      return { value: '', errors, warnings };
    }
    return { value: `geo:${fields.lat},${fields.lng}`, errors, warnings };
  },

  event(fields) {
    const errors = [];
    if (!fields.name) errors.push('Event name is required.');
    if (!fields.startDate) errors.push('Start date is required.');
    if (errors.length) return { value: '', errors, warnings: [] };

    const toIcsDate = (date, time) => {
      if (!date) return '';
      const t = time || '00:00';
      return `${date.replace(/-/g, '')}T${t.replace(':', '')}00`;
    };

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${fields.name}`,
      `DTSTART:${toIcsDate(fields.startDate, fields.startTime)}`,
    ];
    if (fields.endDate) {
      lines.push(`DTEND:${toIcsDate(fields.endDate, fields.endTime)}`);
    }
    if (fields.location) lines.push(`LOCATION:${fields.location}`);
    if (fields.description) lines.push(`DESCRIPTION:${fields.description}`);
    lines.push('END:VEVENT', 'END:VCALENDAR');

    return { value: lines.join('\n'), errors, warnings: [] };
  },

  build(type, fields) {
    const builder = this[type];
    if (!builder) {
      return { value: '', errors: ['Unknown QR type.'], warnings: [] };
    }
    return builder.call(this, fields);
  },
};
