// CRUD for locally-saved QR codes ("My QR Codes"), plus a small handoff
// mechanism used to send a saved item or a template over to the generator
// page for editing/regenerating (multi-page site, no server session).
'use strict';

const QRHistory = {
  key: 'paful-qr-history',
  pendingKey: 'paful-qr-pending-load',

  list() {
    const items = Storage.get(this.key, []);
    return items.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },

  get(id) {
    return this.list().find((item) => item.id === id) || null;
  },

  collections() {
    const names = new Set();
    this.list().forEach((item) => { if (item.collection) names.add(item.collection); });
    return Array.from(names).sort();
  },

  // entry: { title, type, fields, style, data, collection }
  save(entry) {
    const items = Storage.get(this.key, []);
    if (items.length >= FREE_LIMITS.historyItems) {
      return { ok: false, message: `You've reached the ${FREE_LIMITS.historyItems}-item local history limit. Delete some saved QR codes first.` };
    }
    const record = {
      id: Utils.uid('qr'),
      title: entry.title || 'Untitled QR code',
      type: entry.type,
      fields: entry.fields,
      style: entry.style,
      data: entry.data,
      collection: entry.collection || '',
      createdAt: new Date().toISOString(),
    };
    items.push(record);
    const result = Storage.set(this.key, items);
    if (!result.ok) return result;
    return { ok: true, record };
  },

  remove(id) {
    const items = Storage.get(this.key, []).filter((item) => item.id !== id);
    return Storage.set(this.key, items);
  },

  clear() {
    return Storage.set(this.key, []);
  },

  // Handoff used when navigating away to the generator to load/edit an item.
  setPendingLoad(record) {
    Storage.set(this.pendingKey, record);
  },

  takePendingLoad() {
    const record = Storage.get(this.pendingKey, null);
    if (record) Storage.remove(this.pendingKey);
    return record;
  },
};
