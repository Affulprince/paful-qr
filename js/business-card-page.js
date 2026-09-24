// Controller for business-card.html — builds a vCard QR from the form,
// then composites it (in the chosen template layout) with name/title/
// company into a shareable card image.
'use strict';

let currentVcard = '';
let currentFields = null;
let selectedTemplate = 'classic';

function showStatus(message, kind = 'info') {
  Toast.show(message, kind);
}

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

function renderErrors(errors) {
  const box = Utils.qs('#formErrors');
  box.innerHTML = '';
  if (!errors.length) { box.hidden = true; return; }
  box.hidden = false;
  errors.forEach((e) => {
    const div = document.createElement('div');
    div.className = 'alert alert-danger py-2 px-3 mb-2 small';
    div.setAttribute('role', 'alert');
    div.textContent = e;
    box.appendChild(div);
  });
}

function collectFields() {
  const fullName = Utils.qs('#bcName').value.trim();
  const { firstName, lastName } = splitName(fullName);
  return {
    fullName,
    firstName,
    lastName,
    title: Utils.qs('#bcTitle').value.trim(),
    org: Utils.qs('#bcCompany').value.trim(),
    phone: Utils.qs('#bcPhone').value.trim(),
    email: Utils.qs('#bcEmail').value.trim(),
    website: Utils.qs('#bcWebsite').value.trim(),
    address: Utils.qs('#bcAddress').value.trim(),
    social: Utils.qs('#bcSocial').value.trim(),
    accent: Utils.qs('#bcAccent').value,
  };
}

function cardData(fields) {
  return { name: fields.fullName, title: fields.title, company: fields.org, phone: fields.phone, email: fields.email, accentColor: fields.accent };
}

function buildTemplatePicker() {
  const root = Utils.qs('#templatePicker');
  root.innerHTML = '';
  Object.keys(BusinessCard.templates).forEach((id) => {
    const tpl = BusinessCard.templates[id];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `template-thumb-btn${id === selectedTemplate ? ' is-selected' : ''}`;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(id === selectedTemplate));
    btn.dataset.template = id;
    const canvas = document.createElement('canvas');
    canvas.id = `tplThumb-${id}`;
    btn.appendChild(canvas);
    const span = document.createElement('span');
    span.textContent = tpl.label;
    btn.appendChild(span);
    btn.addEventListener('click', () => {
      selectedTemplate = id;
      Utils.qsa('.template-thumb-btn', root).forEach((b) => {
        b.classList.toggle('is-selected', b.dataset.template === id);
        b.setAttribute('aria-checked', String(b.dataset.template === id));
      });
      recompute();
    });
    root.appendChild(btn);
  });
}

function renderAllTemplates(fields, qrCanvas) {
  const data = cardData(fields);
  Object.keys(BusinessCard.templates).forEach((id) => {
    const thumb = Utils.qs(`#tplThumb-${id}`);
    if (thumb) BusinessCard.render(id, data, qrCanvas, thumb);
  });
  BusinessCard.render(selectedTemplate, data, qrCanvas, Utils.qs('#cardCanvas'));
}

function recompute() {
  const fields = collectFields();
  const result = QRGenerator.vcard(fields);
  renderErrors(result.errors);

  const canvas = Utils.qs('#cardCanvas');
  const buttons = [Utils.qs('#downloadCardBtn'), Utils.qs('#downloadQrBtn'), Utils.qs('#saveHistoryBtn')];

  if (result.errors.length || !result.value) {
    buttons.forEach((b) => { b.disabled = true; });
    Utils.qs('#actionsHint').hidden = false;
    currentVcard = '';
    currentFields = null;
    const ctx = canvas.getContext('2d');
    canvas.width = BusinessCard.width;
    canvas.height = BusinessCard.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Utils.qsa('#templatePicker canvas').forEach((c) => {
      c.width = BusinessCard.width;
      c.height = BusinessCard.height;
      c.getContext('2d').clearRect(0, 0, c.width, c.height);
    });
    return;
  }

  currentVcard = result.value;
  currentFields = fields;
  buttons.forEach((b) => { b.disabled = false; });
  Utils.qs('#actionsHint').hidden = true;

  const qrState = {
    data: result.value,
    fgColor: fields.accent,
    bgColor: '#ffffff',
    transparentBg: false,
    gradient: { enabled: false },
    dotStyle: 'square',
    cornerSquareStyle: 'square',
    cornerDotStyle: 'square',
    errorCorrection: 'Q',
    quietZone: 8,
    logo: null,
  };
  QRCustomizer.render(Utils.qs('#qrHidden'), qrState);
  setTimeout(() => renderAllTemplates(fields, QRCustomizer.getCanvas()), 30);
}

const debouncedRecompute = Utils.debounce(recompute, 200);

function bindForm() {
  ['bcName', 'bcTitle', 'bcCompany', 'bcPhone', 'bcEmail', 'bcWebsite', 'bcAddress', 'bcSocial'].forEach((id) => {
    Utils.qs(`#${id}`).addEventListener('input', debouncedRecompute);
  });
  Utils.qs('#bcAccent').addEventListener('input', recompute);
}

function bindActions() {
  Utils.qs('#downloadCardBtn').addEventListener('click', () => {
    const canvas = Utils.qs('#cardCanvas');
    canvas.toBlob((blob) => {
      if (!blob) { showStatus('Could not create the card image.', 'error'); return; }
      Utils.downloadBlob(blob, 'business-card.png');
      showStatus('Downloaded business card image.', 'success');
    }, 'image/png');
  });

  Utils.qs('#downloadQrBtn').addEventListener('click', async () => {
    if (!currentFields) return;
    const state = {
      data: currentVcard,
      fgColor: currentFields.accent,
      bgColor: '#ffffff',
      transparentBg: false,
      gradient: { enabled: false },
      dotStyle: 'square',
      cornerSquareStyle: 'square',
      cornerDotStyle: 'square',
      errorCorrection: 'Q',
      quietZone: 12,
      logo: null,
    };
    try {
      await QRCustomizer.download(state, { extension: 'png', size: 1024 });
      showStatus('Downloaded QR code.', 'success');
    } catch (err) {
      console.error(err);
      showStatus('Could not download the QR code.', 'error');
    }
  });

  Utils.qs('#saveHistoryBtn').addEventListener('click', () => {
    if (!currentFields) return;
    const result = QRHistory.save({
      title: currentFields.fullName || 'Business card',
      type: 'vcard',
      fields: {
        firstName: currentFields.firstName,
        lastName: currentFields.lastName,
        org: currentFields.org,
        title: currentFields.title,
        phone: currentFields.phone,
        email: currentFields.email,
        website: currentFields.website,
        address: currentFields.address,
      },
      style: {
        fgColor: currentFields.accent,
        bgColor: '#ffffff',
        transparentBg: false,
        gradient: { enabled: false, type: 'linear', from: currentFields.accent, to: '#17a2b8', rotation: 0 },
        dotStyle: 'square',
        cornerSquareStyle: 'square',
        cornerDotStyle: 'square',
        errorCorrection: 'Q',
        quietZone: 12,
        logo: null,
        logoOriginal: null,
        logoSize: 40,
        logoMargin: 6,
        logoBackground: true,
        logoRounded: false,
      },
      data: currentVcard,
      collection: 'Business',
    });
    showStatus(result.ok ? 'Saved to My QR Codes.' : result.message, result.ok ? 'success' : 'error');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  Utils.qs('#year').textContent = new Date().getFullYear();
  Theme.init();
  buildTemplatePicker();
  bindForm();
  bindActions();
  recompute();
});
