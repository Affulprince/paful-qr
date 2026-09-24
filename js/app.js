// Bootstraps the generator UI and wires all modules together.
'use strict';

const AppState = {
  type: 'url',
  data: '',
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
  exportSize: 1024,
  cardTitle: '',
  cardDescription: '',
  collection: '',
};

let fieldErrors = [];

function showStatus(message, kind = 'info') {
  Toast.show(message, kind);
}

function collectFields(typeForm) {
  const fields = {};
  Utils.qsa('[data-field]', typeForm).forEach((input) => {
    if (input.type === 'checkbox') {
      fields[input.dataset.field] = input.checked;
    } else {
      fields[input.dataset.field] = input.value.trim();
    }
  });
  return fields;
}

function renderFieldErrors(errors, warnings) {
  const box = Utils.qs('#formErrors');
  if (!box) return;
  box.innerHTML = '';
  const items = [
    ...errors.map((e) => ({ text: e, kind: 'danger' })),
    ...warnings.map((w) => ({ text: w, kind: 'warning' })),
  ];
  if (!items.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  items.forEach(({ text, kind }) => {
    const div = document.createElement('div');
    div.className = `alert alert-${kind} py-2 px-3 mb-2 small`;
    div.setAttribute('role', 'alert');
    div.textContent = text;
    box.appendChild(div);
  });
}

function renderReadability(canvas) {
  const list = Utils.qs('#readabilityList');
  if (!list) return;
  const items = QRReadability.check(AppState, canvas);
  list.innerHTML = '';
  items.forEach((item) => {
    const isOk = item.status === 'ok';
    const li = document.createElement('li');
    li.className = `readability-item list-group-item d-flex align-items-start gap-2 ${isOk ? 'text-success' : 'text-warning-emphasis'}`;
    li.innerHTML = `<i class="bi ${isOk ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}" aria-hidden="true"></i><span class="text-body">${item.label}</span>`;
    list.appendChild(li);
  });
}

function updatePrintCard() {
  const titleEl = Utils.qs('#printCardTitle');
  const descEl = Utils.qs('#printCardDescription');
  const contentEl = Utils.qs('#printCardContent');
  if (titleEl) { titleEl.textContent = AppState.cardTitle; titleEl.hidden = !AppState.cardTitle; }
  if (descEl) { descEl.textContent = AppState.cardDescription; descEl.hidden = !AppState.cardDescription; }
  if (contentEl) { contentEl.textContent = AppState.data; }
}

function recompute() {
  const activeForm = Utils.qs(`[data-type-form="${AppState.type}"]`);
  if (!activeForm) return;
  const fields = collectFields(activeForm);
  const result = QRGenerator.build(AppState.type, fields);
  fieldErrors = result.errors;
  renderFieldErrors(result.errors, result.warnings);

  const previewWrap = Utils.qs('#qrPreview');
  const downloadActions = Utils.qs('#downloadActions');

  if (result.errors.length || !result.value) {
    previewWrap.classList.add('is-empty');
    if (downloadActions) downloadActions.setAttribute('aria-disabled', 'true');
    Utils.qsa('#downloadActions button, #shareActions button').forEach((b) => { b.disabled = true; });
    return;
  }

  AppState.data = result.value;
  previewWrap.classList.remove('is-empty');
  Utils.qsa('#downloadActions button, #shareActions button').forEach((b) => { b.disabled = false; });
  if (downloadActions) downloadActions.removeAttribute('aria-disabled');

  QRCustomizer.render(previewWrap, AppState);
  updatePrintCard();

  setTimeout(() => renderReadability(QRCustomizer.getCanvas()), 60);
}

const debouncedRecompute = Utils.debounce(recompute, 180);

function bindTypePicker() {
  Utils.qsa('input[name="qrType"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      AppState.type = radio.value;
      Utils.qsa('[data-type-form]').forEach((form) => {
        form.hidden = form.getAttribute('data-type-form') !== AppState.type;
      });
      recompute();
    });
  });
}

function bindContentInputs() {
  Utils.qs('#contentForms').addEventListener('input', (e) => {
    if (e.target.matches('[data-field]')) debouncedRecompute();
  });
  Utils.qs('#contentForms').addEventListener('change', (e) => {
    if (e.target.matches('[data-field]')) recompute();
  });
}

function bindDesignPanel() {
  const byId = (id) => Utils.qs(`#${id}`);

  byId('fgColor').addEventListener('input', (e) => { AppState.fgColor = e.target.value; debouncedRecompute(); });
  byId('bgColor').addEventListener('input', (e) => { AppState.bgColor = e.target.value; debouncedRecompute(); });
  byId('transparentBg').addEventListener('change', (e) => {
    AppState.transparentBg = e.target.checked;
    byId('bgColor').disabled = e.target.checked;
    recompute();
  });

  byId('gradientEnabled').addEventListener('change', (e) => {
    AppState.gradient.enabled = e.target.checked;
    Utils.qs('#gradientFields').hidden = !e.target.checked;
    recompute();
  });
  byId('gradientFrom').addEventListener('input', (e) => { AppState.gradient.from = e.target.value; debouncedRecompute(); });
  byId('gradientTo').addEventListener('input', (e) => { AppState.gradient.to = e.target.value; debouncedRecompute(); });
  byId('gradientType').addEventListener('change', (e) => { AppState.gradient.type = e.target.value; recompute(); });
  byId('gradientRotation').addEventListener('input', (e) => { AppState.gradient.rotation = Number(e.target.value); debouncedRecompute(); });

  byId('dotStyle').addEventListener('change', (e) => { AppState.dotStyle = e.target.value; recompute(); });
  byId('cornerSquareStyle').addEventListener('change', (e) => { AppState.cornerSquareStyle = e.target.value; recompute(); });
  byId('cornerDotStyle').addEventListener('change', (e) => { AppState.cornerDotStyle = e.target.value; recompute(); });
  byId('errorCorrection').addEventListener('change', (e) => { AppState.errorCorrection = e.target.value; recompute(); });
}

function roundImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = Math.max(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, (size - img.width) / 2, (size - img.height) / 2);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

function bindLogoPanel() {
  const input = Utils.qs('#logoInput');
  const preview = Utils.qs('#logoPreview');
  const removeBtn = Utils.qs('#logoRemove');
  const controls = Utils.qs('#logoControls');

  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      const original = await Utils.readImageFile(file, 2 * 1024 * 1024);
      if (file.size > 500 * 1024) {
        showStatus('This logo file is fairly large — it may slow down QR rendering.', 'warning');
      }
      AppState.logoOriginal = original;
      AppState.logo = AppState.logoRounded ? await roundImage(original) : original;
      preview.src = AppState.logo;
      preview.hidden = false;
      controls.hidden = false;
      removeBtn.hidden = false;
      recompute();
    } catch (err) {
      showStatus(err.message, 'error');
      input.value = '';
    }
  });

  removeBtn.addEventListener('click', () => {
    AppState.logo = null;
    AppState.logoOriginal = null;
    input.value = '';
    preview.hidden = true;
    controls.hidden = true;
    removeBtn.hidden = true;
    recompute();
  });

  Utils.qs('#logoSize').addEventListener('input', (e) => { AppState.logoSize = Number(e.target.value); debouncedRecompute(); });
  Utils.qs('#logoMargin').addEventListener('input', (e) => { AppState.logoMargin = Number(e.target.value); debouncedRecompute(); });
  Utils.qs('#logoBackground').addEventListener('change', (e) => { AppState.logoBackground = e.target.checked; recompute(); });
  Utils.qs('#logoRounded').addEventListener('change', async (e) => {
    AppState.logoRounded = e.target.checked;
    if (AppState.logoOriginal) {
      AppState.logo = AppState.logoRounded ? await roundImage(AppState.logoOriginal) : AppState.logoOriginal;
      preview.src = AppState.logo;
      recompute();
    }
  });
}

function applyLogoToUI() {
  const preview = Utils.qs('#logoPreview');
  const removeBtn = Utils.qs('#logoRemove');
  const controls = Utils.qs('#logoControls');
  const hasLogo = Boolean(AppState.logo);
  preview.src = AppState.logo || '';
  preview.hidden = !hasLogo;
  removeBtn.hidden = !hasLogo;
  controls.hidden = !hasLogo;
  Utils.qs('#logoSize').value = AppState.logoSize;
  Utils.qs('#logoMargin').value = AppState.logoMargin;
  Utils.qs('#logoBackground').checked = AppState.logoBackground;
  Utils.qs('#logoRounded').checked = AppState.logoRounded;
}

function bindAdvancedPanel() {
  Utils.qs('#cardTitle').addEventListener('input', (e) => { AppState.cardTitle = e.target.value; updatePrintCard(); });
  Utils.qs('#cardDescription').addEventListener('input', (e) => { AppState.cardDescription = e.target.value; updatePrintCard(); });
  Utils.qs('#quietZone').addEventListener('input', (e) => { AppState.quietZone = Number(e.target.value); debouncedRecompute(); });
  Utils.qs('#collectionInput').addEventListener('input', (e) => { AppState.collection = e.target.value.trim(); });
}

function bindDownloadPanel() {
  Utils.qsa('[data-size-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      Utils.qsa('[data-size-option]').forEach((b) => { b.setAttribute('aria-pressed', 'false'); b.classList.remove('active'); });
      btn.setAttribute('aria-pressed', 'true');
      btn.classList.add('active');
      const size = btn.getAttribute('data-size-option');
      if (size === 'custom') {
        Utils.qs('#customSize').hidden = false;
        AppState.exportSize = Number(Utils.qs('#customSize').value) || 1024;
      } else {
        Utils.qs('#customSize').hidden = true;
        AppState.exportSize = Number(size);
      }
    });
  });
  Utils.qs('#customSize').addEventListener('input', (e) => {
    AppState.exportSize = Utils.clamp(Number(e.target.value) || 1024, 128, 4096);
  });

  Utils.qsa('[data-download-format]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (fieldErrors.length || !AppState.data) return;
      btn.disabled = true;
      const format = btn.getAttribute('data-download-format');
      const result = await Sharing.download(AppState, format, AppState.exportSize);
      btn.disabled = false;
      showStatus(result.ok ? `Downloaded ${format.toUpperCase()}.` : result.message, result.ok ? 'success' : 'error');
      if (result.ok && typeof QRTracking !== 'undefined') QRTracking.track(AppState.type);
    });
  });

  Utils.qs('#printBtn').addEventListener('click', () => {
    if (!AppState.data) return;
    Sharing.print();
  });

  Utils.qs('#shareBtn').addEventListener('click', async () => {
    const result = await Sharing.shareImage(QRCustomizer.getCanvas(), AppState.data);
    if (result.aborted) return;
    if (!result.ok) showStatus(result.message, result.unsupported ? 'info' : 'error');
  });

  Utils.qs('#copyImageBtn').addEventListener('click', async () => {
    const result = await Sharing.copyImage(QRCustomizer.getCanvas());
    showStatus(result.ok ? 'QR image copied to clipboard.' : result.message, result.ok ? 'success' : (result.unsupported ? 'info' : 'error'));
  });

  Utils.qs('#copyContentBtn').addEventListener('click', async () => {
    const result = await Sharing.copyText(AppState.data);
    showStatus(result.ok ? 'Content copied to clipboard.' : result.message, result.ok ? 'success' : (result.unsupported ? 'info' : 'error'));
  });
}

const RANGE_OUTPUTS = [
  { id: 'gradientRotation', suffix: '°' },
  { id: 'logoSize', suffix: '%' },
  { id: 'logoMargin', suffix: 'px' },
  { id: 'quietZone', suffix: 'px' },
];

function syncRangeOutputs() {
  RANGE_OUTPUTS.forEach(({ id, suffix }) => {
    const input = Utils.qs(`#${id}`);
    const output = input && input.parentElement.querySelector('output');
    if (input && output) output.textContent = `${input.value}${suffix}`;
  });
}

function bindRangeOutputs() {
  RANGE_OUTPUTS.forEach(({ id }) => {
    const input = Utils.qs(`#${id}`);
    if (input) input.addEventListener('input', syncRangeOutputs);
  });
  syncRangeOutputs();
}

function getStyleSnapshot() {
  return JSON.parse(JSON.stringify({
    fgColor: AppState.fgColor,
    bgColor: AppState.bgColor,
    transparentBg: AppState.transparentBg,
    gradient: AppState.gradient,
    dotStyle: AppState.dotStyle,
    cornerSquareStyle: AppState.cornerSquareStyle,
    cornerDotStyle: AppState.cornerDotStyle,
    errorCorrection: AppState.errorCorrection,
    quietZone: AppState.quietZone,
    logo: AppState.logo,
    logoOriginal: AppState.logoOriginal,
    logoSize: AppState.logoSize,
    logoMargin: AppState.logoMargin,
    logoBackground: AppState.logoBackground,
    logoRounded: AppState.logoRounded,
  }));
}

function selectType(type) {
  const radio = Utils.qs(`input[name="qrType"][value="${type}"]`);
  if (!radio) return;
  radio.checked = true;
  AppState.type = type;
  Utils.qsa('[data-type-form]').forEach((form) => {
    form.hidden = form.getAttribute('data-type-form') !== type;
  });
}

function applyFieldsToUI(type, fields) {
  const form = Utils.qs(`[data-type-form="${type}"]`);
  if (!form || !fields) return;
  Utils.qsa('[data-field]', form).forEach((input) => {
    const value = fields[input.dataset.field];
    if (value === undefined) return;
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else input.value = value;
  });
}

function applyStyleToUI(style) {
  if (!style) return;
  Object.assign(AppState, style);
  Utils.qs('#fgColor').value = AppState.fgColor;
  Utils.qs('#bgColor').value = AppState.bgColor;
  Utils.qs('#bgColor').disabled = AppState.transparentBg;
  Utils.qs('#transparentBg').checked = AppState.transparentBg;
  Utils.qs('#gradientEnabled').checked = AppState.gradient.enabled;
  Utils.qs('#gradientFields').hidden = !AppState.gradient.enabled;
  Utils.qs('#gradientFrom').value = AppState.gradient.from;
  Utils.qs('#gradientTo').value = AppState.gradient.to;
  Utils.qs('#gradientType').value = AppState.gradient.type;
  Utils.qs('#gradientRotation').value = AppState.gradient.rotation;
  Utils.qs('#dotStyle').value = AppState.dotStyle;
  Utils.qs('#cornerSquareStyle').value = AppState.cornerSquareStyle;
  Utils.qs('#cornerDotStyle').value = AppState.cornerDotStyle;
  Utils.qs('#errorCorrection').value = AppState.errorCorrection;
  Utils.qs('#quietZone').value = AppState.quietZone;
  applyLogoToUI();
  syncRangeOutputs();
}

// Marks the matching preset size button active, or falls back to "Custom"
// with the value filled in — used when applying admin-configured defaults.
function applyExportSizeToUI(size) {
  AppState.exportSize = size;
  const presetBtn = Utils.qs(`[data-size-option="${size}"]`);
  Utils.qsa('[data-size-option]').forEach((b) => { b.setAttribute('aria-pressed', 'false'); b.classList.remove('active'); });
  if (presetBtn) {
    presetBtn.setAttribute('aria-pressed', 'true');
    presetBtn.classList.add('active');
    Utils.qs('#customSize').hidden = true;
  } else {
    Utils.qs('[data-size-option="custom"]').setAttribute('aria-pressed', 'true');
    Utils.qs('[data-size-option="custom"]').classList.add('active');
    Utils.qs('#customSize').hidden = false;
    Utils.qs('#customSize').value = size;
  }
}

// Loads a saved history item or a template preset into the generator.
function loadSnapshot(record) {
  if (!record || !record.type) return;
  selectType(record.type);
  applyFieldsToUI(record.type, record.fields);
  applyStyleToUI(record.style);
  if (record.title) {
    AppState.cardTitle = record.title;
    Utils.qs('#cardTitle').value = record.title;
  }
  AppState.collection = record.collection || '';
  Utils.qs('#collectionInput').value = AppState.collection;
  recompute();
}

function bindSaveToHistory() {
  const btn = Utils.qs('#saveHistoryBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (fieldErrors.length || !AppState.data) return;
    const activeForm = Utils.qs(`[data-type-form="${AppState.type}"]`);
    const fields = collectFields(activeForm);
    const title = AppState.cardTitle || `${AppState.type.charAt(0).toUpperCase()}${AppState.type.slice(1)} QR — ${new Date().toLocaleDateString()}`;
    const result = QRHistory.save({
      title,
      type: AppState.type,
      fields,
      style: getStyleSnapshot(),
      data: AppState.data,
      collection: AppState.collection,
    });
    showStatus(result.ok ? 'Saved to My QR Codes.' : result.message, result.ok ? 'success' : 'error');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  Utils.qs('#year').textContent = new Date().getFullYear();
  Theme.init();
  bindRangeOutputs();
  bindTypePicker();
  bindContentInputs();
  bindDesignPanel();
  bindLogoPanel();
  bindAdvancedPanel();
  bindDownloadPanel();
  bindSaveToHistory();

  const pending = QRHistory.takePendingLoad();
  window.__pafulHasPendingLoad = Boolean(pending);
  if (pending) {
    loadSnapshot(pending);
    showStatus(pending.title ? `Loaded "${pending.title}".` : 'Loaded.', 'success');
  } else {
    recompute();
  }
});
