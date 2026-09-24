// Preconfigured QR presets. "Use template" hands these to the generator via
// the same pending-load mechanism history.html uses to reopen a saved item —
// every field stays fully editable once it lands on the generator page.
'use strict';

function defaultStyle(overrides) {
  return Object.assign({
    fgColor: '#0b3c5d',
    bgColor: '#ffffff',
    transparentBg: false,
    gradient: { enabled: false, type: 'linear', from: '#0b3c5d', to: '#17a2b8', rotation: 0 },
    dotStyle: 'square',
    cornerSquareStyle: 'square',
    cornerDotStyle: 'square',
    errorCorrection: 'M',
    quietZone: 12,
    logo: null,
    logoOriginal: null,
    logoSize: 40,
    logoMargin: 6,
    logoBackground: true,
    logoRounded: false,
  }, overrides);
}

// Each template carries its own `style` (rather than inheriting a shared
// category-level style) so this static data has the same shape as the
// dynamic data fetched from api/qr-templates.php — one render path for both.
const TEMPLATE_CATEGORIES = [
  {
    name: 'Business',
    color: '#0b3c5d',
    templates: [
      { name: 'Business Website', icon: '🌐', type: 'url', fields: { url: '' }, title: 'Visit our website', style: defaultStyle({ fgColor: '#0b3c5d', dotStyle: 'square', cornerSquareStyle: 'square' }) },
      { name: 'WhatsApp Business', icon: '💬', type: 'whatsapp', fields: { message: 'Hello! I have a question.' }, title: 'Chat with us on WhatsApp', style: defaultStyle({ fgColor: '#0b3c5d', dotStyle: 'square', cornerSquareStyle: 'square' }) },
      { name: 'Digital Business Card', icon: '🪪', type: 'vcard', fields: {}, title: 'Save my contact', style: defaultStyle({ fgColor: '#0b3c5d', dotStyle: 'square', cornerSquareStyle: 'square' }) },
      { name: 'Store Location', icon: '📍', type: 'location', fields: { mapsUrl: '' }, title: 'Find our store', style: defaultStyle({ fgColor: '#0b3c5d', dotStyle: 'square', cornerSquareStyle: 'square' }) },
    ],
  },
  {
    name: 'Restaurant',
    color: '#b91c1c',
    templates: [
      { name: 'Digital Menu', icon: '🍽️', type: 'url', fields: { url: '' }, title: 'View our menu', style: defaultStyle({ fgColor: '#b91c1c', dotStyle: 'rounded', cornerSquareStyle: 'extra-rounded' }) },
      { name: 'Order Online', icon: '🛍️', type: 'url', fields: { url: '' }, title: 'Order online', style: defaultStyle({ fgColor: '#b91c1c', dotStyle: 'rounded', cornerSquareStyle: 'extra-rounded' }) },
      { name: 'WhatsApp Orders', icon: '💬', type: 'whatsapp', fields: { message: 'Hi, I would like to place an order.' }, title: 'Order via WhatsApp', style: defaultStyle({ fgColor: '#b91c1c', dotStyle: 'rounded', cornerSquareStyle: 'extra-rounded' }) },
      { name: 'Leave a Review', icon: '⭐', type: 'url', fields: { url: '' }, title: 'Leave us a review', style: defaultStyle({ fgColor: '#b91c1c', dotStyle: 'rounded', cornerSquareStyle: 'extra-rounded' }) },
    ],
  },
  {
    name: 'Church',
    color: '#5b21b6',
    templates: [
      { name: 'Church Website', icon: '⛪', type: 'url', fields: { url: '' }, title: 'Visit our website', style: defaultStyle({ fgColor: '#5b21b6', dotStyle: 'extra-rounded', cornerSquareStyle: 'extra-rounded' }) },
      { name: 'Online Giving', icon: '🙏', type: 'url', fields: { url: '' }, title: 'Give online', style: defaultStyle({ fgColor: '#5b21b6', dotStyle: 'extra-rounded', cornerSquareStyle: 'extra-rounded' }) },
      { name: 'Church Location', icon: '📍', type: 'location', fields: { mapsUrl: '' }, title: 'Get directions', style: defaultStyle({ fgColor: '#5b21b6', dotStyle: 'extra-rounded', cornerSquareStyle: 'extra-rounded' }) },
      { name: 'YouTube Channel', icon: '▶️', type: 'social', fields: { platform: 'youtube' }, title: 'Watch our services', style: defaultStyle({ fgColor: '#5b21b6', dotStyle: 'extra-rounded', cornerSquareStyle: 'extra-rounded' }) },
      { name: 'Facebook Page', icon: '📘', type: 'social', fields: { platform: 'facebook' }, title: 'Follow us on Facebook', style: defaultStyle({ fgColor: '#5b21b6', dotStyle: 'extra-rounded', cornerSquareStyle: 'extra-rounded' }) },
      { name: 'Prayer Request', icon: '🕊️', type: 'email', fields: { subject: 'Prayer Request' }, title: 'Submit a prayer request', style: defaultStyle({ fgColor: '#5b21b6', dotStyle: 'extra-rounded', cornerSquareStyle: 'extra-rounded' }) },
    ],
  },
  {
    name: 'Event',
    color: '#0f766e',
    templates: [
      { name: 'Event Registration', icon: '📝', type: 'url', fields: { url: '' }, title: 'Register now', style: defaultStyle({ fgColor: '#0f766e', dotStyle: 'dots', cornerSquareStyle: 'dot' }) },
      { name: 'Event Ticket', icon: '🎟️', type: 'url', fields: { url: '' }, title: 'Get your ticket', style: defaultStyle({ fgColor: '#0f766e', dotStyle: 'dots', cornerSquareStyle: 'dot' }) },
      { name: 'Event Location', icon: '📍', type: 'location', fields: { mapsUrl: '' }, title: 'Event location', style: defaultStyle({ fgColor: '#0f766e', dotStyle: 'dots', cornerSquareStyle: 'dot' }) },
      { name: 'Add to Calendar', icon: '📅', type: 'event', fields: {}, title: 'Save the date', style: defaultStyle({ fgColor: '#0f766e', dotStyle: 'dots', cornerSquareStyle: 'dot' }) },
    ],
  },
  {
    name: 'Personal',
    color: '#be185d',
    templates: [
      { name: 'WhatsApp Me', icon: '💬', type: 'whatsapp', fields: {}, title: 'Message me on WhatsApp', style: defaultStyle({ fgColor: '#be185d', dotStyle: 'extra-rounded', cornerSquareStyle: 'dot' }) },
      { name: 'Instagram', icon: '📸', type: 'social', fields: { platform: 'instagram' }, title: 'Follow me on Instagram', style: defaultStyle({ fgColor: '#be185d', dotStyle: 'extra-rounded', cornerSquareStyle: 'dot' }) },
      { name: 'Facebook', icon: '📘', type: 'social', fields: { platform: 'facebook' }, title: 'Follow me on Facebook', style: defaultStyle({ fgColor: '#be185d', dotStyle: 'extra-rounded', cornerSquareStyle: 'dot' }) },
      { name: 'TikTok', icon: '🎵', type: 'social', fields: { platform: 'tiktok' }, title: 'Follow me on TikTok', style: defaultStyle({ fgColor: '#be185d', dotStyle: 'extra-rounded', cornerSquareStyle: 'dot' }) },
      { name: 'LinkedIn', icon: '💼', type: 'social', fields: { platform: 'linkedin' }, title: 'Connect on LinkedIn', style: defaultStyle({ fgColor: '#be185d', dotStyle: 'extra-rounded', cornerSquareStyle: 'dot' }) },
    ],
  },
];

// Category swatch colors shown behind each card's icon, keyed by category
// name — used to color dynamically-fetched categories the static list
// doesn't know about, falling back to the first template's own QR color.
const CATEGORY_COLORS = TEMPLATE_CATEGORIES.reduce((map, cat) => {
  map[cat.name] = cat.color;
  return map;
}, {});

function reshapeApiTemplates(rows) {
  const byCategory = new Map();
  rows.forEach((row) => {
    if (!byCategory.has(row.category)) {
      byCategory.set(row.category, {
        name: row.category,
        color: CATEGORY_COLORS[row.category] || row.fg_color,
        templates: [],
      });
    }
    byCategory.get(row.category).templates.push({
      name: row.name,
      icon: row.icon || '🔗',
      type: row.type_key,
      fields: row.default_fields || {},
      title: row.description || row.name,
      style: defaultStyle({
        fgColor: row.fg_color,
        bgColor: row.bg_color,
        dotStyle: row.dot_style,
        cornerSquareStyle: row.corner_square_style,
        cornerDotStyle: row.corner_dot_style,
        errorCorrection: row.error_correction,
      }),
    });
  });
  return Array.from(byCategory.values());
}

// Fetches admin-managed templates; on any failure (offline, DB down, bad
// response) falls back to the static list above so this page always works.
async function loadTemplateCategories() {
  try {
    const res = await fetch('api/qr-templates.php', { cache: 'no-store' });
    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.templates) || !data.templates.length) throw new Error('empty');
    return reshapeApiTemplates(data.templates);
  } catch (err) {
    return TEMPLATE_CATEGORIES;
  }
}
