// Controller for scanner.html — camera scanning, image-upload scanning,
// and presenting the decoded result without ever auto-opening it.
'use strict';

function showStatus(message, kind = 'info') {
  Toast.show(message, kind);
}

function isOpenable(text) {
  return /^(https?|tel|mailto|sms|geo):/i.test(text.trim());
}

function showResult(text) {
  const panel = Utils.qs('#scanResult');
  const valueEl = Utils.qs('#scanResultValue');
  const openBtn = Utils.qs('#scanOpenBtn');

  panel.hidden = false;
  valueEl.textContent = text;
  Utils.qs('#scanPlaceholder').hidden = true;

  if (isOpenable(text)) {
    openBtn.hidden = false;
    openBtn.onclick = () => window.open(text, '_blank', 'noopener');
  } else {
    openBtn.hidden = true;
  }

  Utils.qs('#scanCopyBtn').onclick = async () => {
    const result = await Sharing.copyText(text);
    showStatus(result.ok ? 'Copied to clipboard.' : result.message, result.ok ? 'success' : 'error');
  };

  Utils.qs('#scanShareBtn').onclick = async () => {
    if (!navigator.share) {
      showStatus('Sharing isn\'t supported in this browser. Use Copy instead.', 'info');
      return;
    }
    try {
      await navigator.share({ text });
    } catch (err) {
      if (err.name !== 'AbortError') showStatus('Sharing failed.', 'error');
    }
  };
}

function resetResult() {
  Utils.qs('#scanResult').hidden = true;
  Utils.qs('#scanPlaceholder').hidden = false;
}

function bindCamera() {
  const video = Utils.qs('#scanVideo');
  const canvas = Utils.qs('#scanCanvas');
  const startBtn = Utils.qs('#startCameraBtn');
  const stopBtn = Utils.qs('#stopCameraBtn');
  const frame = Utils.qs('#scannerFrame');

  startBtn.addEventListener('click', async () => {
    startBtn.hidden = true;
    Utils.qs('#scannerPlaceholderText').hidden = true;
    video.hidden = false;
    frame.hidden = false;
    stopBtn.hidden = false;
    resetResult();

    await QRScanner.startCamera(video, canvas, (data) => {
      showResult(data);
      QRScanner.stopCamera();
      stopBtn.hidden = true;
      startBtn.hidden = false;
      Utils.qs('#startCameraLabel').textContent = 'Scan Again';
      video.hidden = true;
      frame.hidden = true;
    }, (message) => {
      showStatus(message, 'error');
      startBtn.hidden = false;
      stopBtn.hidden = true;
      video.hidden = true;
      frame.hidden = true;
      Utils.qs('#scannerPlaceholderText').hidden = false;
    });
  });

  stopBtn.addEventListener('click', () => {
    QRScanner.stopCamera();
    stopBtn.hidden = true;
    startBtn.hidden = false;
    Utils.qs('#startCameraLabel').textContent = 'Start Camera';
    video.hidden = true;
    frame.hidden = true;
    Utils.qs('#scannerPlaceholderText').hidden = false;
  });

  window.addEventListener('beforeunload', () => QRScanner.stopCamera());
}

function bindUpload() {
  const zone = Utils.qs('#imageDropzone');
  const input = Utils.qs('#imageInput');

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  input.addEventListener('change', () => handleImage(input.files[0]));

  ['dragenter', 'dragover'].forEach((evt) => {
    zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.add('is-dragover'); });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.remove('is-dragover'); });
  });
  zone.addEventListener('drop', (e) => handleImage(e.dataTransfer.files && e.dataTransfer.files[0]));

  async function handleImage(file) {
    if (!file) return;
    try {
      const data = await QRScanner.decodeImageFile(file);
      if (data) {
        showResult(data);
      } else {
        showStatus('No QR code was found in that image.', 'error');
      }
    } catch (err) {
      showStatus(err.message, 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Utils.qs('#year').textContent = new Date().getFullYear();
  Theme.init();
  bindCamera();
  bindUpload();
});
