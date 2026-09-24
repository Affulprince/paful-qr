// Controller for social-media.html — platform-branded profile QR with a
// clean profile-style preview card.
'use strict';

const SOCIAL_PLATFORMS = {
  facebook: { label: 'Facebook', color: '#1877F2', icon: 'bi-facebook', verb: 'follow' },
  instagram: { label: 'Instagram', color: '#E4405F', icon: 'bi-instagram', verb: 'follow' },
  tiktok: { label: 'TikTok', color: '#000000', icon: 'bi-tiktok', verb: 'follow' },
  youtube: { label: 'YouTube', color: '#FF0000', icon: 'bi-youtube', verb: 'subscribe on' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', icon: 'bi-linkedin', verb: 'connect on' },
  x: { label: 'X', color: '#000000', icon: 'bi-twitter-x', verb: 'follow' },
  whatsapp: { label: 'WhatsApp', color: '#25D366', icon: 'bi-whatsapp', verb: 'chat on' },
};

let currentData = '';

function showStatus(message, kind = 'info') {
  Toast.show(message, kind);
}

function activePlatform() {
  const checked = Utils.qs('input[name="smPlatform"]:checked');
  return checked ? checked.value : 'facebook';
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

function updateProfileHeader(platform) {
  const meta = SOCIAL_PLATFORMS[platform];
  Utils.qs('#profileHeader').style.background = meta.color;
  Utils.qs('#profileIcon').className = `bi ${meta.icon} display-5`;
  const verbLabel = meta.verb === 'follow' ? `Scan to follow on ${meta.label}` : `Scan to ${meta.verb} ${meta.label}`;
  Utils.qs('#profileLabel').textContent = verbLabel;
}

function recompute() {
  const platform = activePlatform();
  const handle = Utils.qs('#smHandle').value.trim();
  updateProfileHeader(platform);

  const result = QRGenerator.social({ platform, handle });
  renderErrors(result.errors);

  const previewWrap = Utils.qs('#qrPreview');
  const buttons = Utils.qsa('#downloadActions button, #shareBtn, #copyContentBtn, #saveHistoryBtn');

  if (result.errors.length || !result.value) {
    previewWrap.classList.add('is-empty');
    buttons.forEach((b) => { b.disabled = true; });
    Utils.qs('#actionsHint').hidden = false;
    currentData = '';
    Utils.qs('#profileHandle').textContent = '';
    return;
  }

  currentData = result.value;
  previewWrap.classList.remove('is-empty');
  buttons.forEach((b) => { b.disabled = false; });
  Utils.qs('#actionsHint').hidden = true;
  Utils.qs('#profileHandle').textContent = handle.startsWith('@') || /^https?:\/\//i.test(handle) ? handle : `@${handle}`;

  const meta = SOCIAL_PLATFORMS[platform];
  QRCustomizer.render(previewWrap, {
    data: result.value,
    fgColor: meta.color,
    bgColor: '#ffffff',
    transparentBg: false,
    gradient: { enabled: false },
    dotStyle: 'square',
    cornerSquareStyle: 'square',
    cornerDotStyle: 'square',
    errorCorrection: 'M',
    quietZone: 12,
    logo: null,
  });
}

const debouncedRecompute = Utils.debounce(recompute, 180);

function currentQrState() {
  const meta = SOCIAL_PLATFORMS[activePlatform()];
  return {
    data: currentData,
    fgColor: meta.color,
    bgColor: '#ffffff',
    transparentBg: false,
    gradient: { enabled: false },
    dotStyle: 'square',
    cornerSquareStyle: 'square',
    cornerDotStyle: 'square',
    errorCorrection: 'M',
    quietZone: 12,
    logo: null,
  };
}

function bindForm() {
  Utils.qsa('input[name="smPlatform"]').forEach((radio) => {
    radio.addEventListener('change', recompute);
  });
  Utils.qs('#smHandle').addEventListener('input', debouncedRecompute);
}

function bindActions() {
  Utils.qsa('[data-download-format]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!currentData) return;
      btn.disabled = true;
      const format = btn.getAttribute('data-download-format');
      const result = await Sharing.download(currentQrState(), format, 1024);
      btn.disabled = false;
      showStatus(result.ok ? `Downloaded ${format.toUpperCase()}.` : result.message, result.ok ? 'success' : 'error');
    });
  });

  Utils.qs('#shareBtn').addEventListener('click', async () => {
    const result = await Sharing.shareImage(QRCustomizer.getCanvas(), currentData);
    if (result.aborted) return;
    if (!result.ok) showStatus(result.message, result.unsupported ? 'info' : 'error');
  });

  Utils.qs('#copyContentBtn').addEventListener('click', async () => {
    const result = await Sharing.copyText(currentData);
    showStatus(result.ok ? 'Link copied to clipboard.' : result.message, result.ok ? 'success' : (result.unsupported ? 'info' : 'error'));
  });

  Utils.qs('#saveHistoryBtn').addEventListener('click', () => {
    if (!currentData) return;
    const platform = activePlatform();
    const meta = SOCIAL_PLATFORMS[platform];
    const handle = Utils.qs('#smHandle').value.trim();
    const style = currentQrState();
    delete style.data;
    const result = QRHistory.save({
      title: `${meta.label} — ${handle}`,
      type: 'social',
      fields: { platform, handle },
      style: {
        ...style,
        gradient: { enabled: false, type: 'linear', from: meta.color, to: meta.color, rotation: 0 },
        logoOriginal: null,
        logoSize: 40,
        logoMargin: 6,
        logoBackground: true,
        logoRounded: false,
      },
      data: currentData,
      collection: 'Personal',
    });
    showStatus(result.ok ? 'Saved to My QR Codes.' : result.message, result.ok ? 'success' : 'error');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  Utils.qs('#year').textContent = new Date().getFullYear();
  Theme.init();
  bindForm();
  bindActions();
  recompute();
});
