// Controller for bulk.html — parses the uploaded CSV, previews results,
// and drives ZIP generation/download.
'use strict';

let parsedRows = [];
let parsedErrors = [];

function showStatus(message, kind = 'info') {
  Toast.show(message, kind);
}

function renderSummary() {
  const summary = Utils.qs('#bulkSummary');
  const tableWrap = Utils.qs('#bulkTableWrap');
  const tbody = Utils.qs('#bulkTableBody');
  const generateBtn = Utils.qs('#generateZipBtn');

  if (!parsedRows.length && !parsedErrors.length) {
    summary.hidden = true;
    tableWrap.hidden = true;
    generateBtn.disabled = true;
    return;
  }

  summary.hidden = false;
  summary.innerHTML = `
    <strong>${parsedRows.length}</strong> valid record${parsedRows.length === 1 ? '' : 's'} ready
    ${parsedErrors.length ? `, <strong>${parsedErrors.length}</strong> row${parsedErrors.length === 1 ? '' : 's'} skipped` : ''}.
  `;

  tbody.innerHTML = '';
  parsedRows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.line}</td><td>${Utils.escapeHtml(row.name)}</td><td>${Utils.escapeHtml(row.value)}</td><td><span class="badge text-bg-success">Ready</span></td>`;
    tbody.appendChild(tr);
  });
  parsedErrors.forEach((err) => {
    const tr = document.createElement('tr');
    tr.className = 'table-warning';
    tr.innerHTML = `<td>${err.line}</td><td colspan="2">${Utils.escapeHtml(err.message)}</td><td><span class="badge text-bg-warning">Skipped</span></td>`;
    tbody.appendChild(tr);
  });
  tableWrap.hidden = false;
  generateBtn.disabled = parsedRows.length === 0;
}

function handleFile(file) {
  if (!file) return;
  if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
    showStatus('Please choose a .csv file.', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showStatus('That CSV file is too large (max 5MB).', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const { rows, errors, skippedOverLimit } = BulkGenerator.parse(String(reader.result), FREE_LIMITS.bulkQrPerBatch);
    parsedRows = rows;
    parsedErrors = errors;
    renderSummary();
    if (skippedOverLimit > 0) {
      showStatus(`Only the first ${FREE_LIMITS.bulkQrPerBatch} rows were kept (free limit). ${skippedOverLimit} additional row(s) were skipped.`, 'warning');
    } else if (rows.length) {
      showStatus(`Parsed ${rows.length} record(s).`, 'success');
    } else {
      showStatus('No valid records were found in that file.', 'error');
    }
  };
  reader.onerror = () => showStatus('Could not read that file.', 'error');
  reader.readAsText(file);
}

function bindDropzone() {
  const zone = Utils.qs('#csvDropzone');
  const input = Utils.qs('#csvInput');

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  input.addEventListener('change', () => handleFile(input.files[0]));

  ['dragenter', 'dragover'].forEach((evt) => {
    zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.add('is-dragover'); });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.remove('is-dragover'); });
  });
  zone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  });
}

function bindGenerate() {
  const style = {
    fgColor: '#0b3c5d',
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

  Utils.qs('#generateZipBtn').addEventListener('click', async () => {
    if (!parsedRows.length) return;
    const btn = Utils.qs('#generateZipBtn');
    const progressWrap = Utils.qs('#bulkProgress');
    const progressFill = Utils.qs('#bulkProgressFill');
    const progressLabel = Utils.qs('#bulkProgressLabel');

    btn.disabled = true;
    progressWrap.hidden = false;
    progressFill.style.width = '0%';
    progressLabel.textContent = `0 / ${parsedRows.length}`;

    try {
      const blob = await BulkGenerator.generateZip(parsedRows, style, (done, total) => {
        const pct = Math.round((done / total) * 100);
        progressFill.style.width = `${pct}%`;
        progressLabel.textContent = `${done} / ${total}`;
      });
      Utils.downloadBlob(blob, 'paful-qr-bulk.zip');
      const failed = parsedRows.filter((r) => r.status === 'failed').length;
      showStatus(failed ? `Downloaded ZIP. ${failed} row(s) failed to generate.` : 'Downloaded ZIP with all QR codes.', failed ? 'warning' : 'success');
      renderSummary();
    } catch (err) {
      console.error(err);
      showStatus('Could not build the ZIP file. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      progressWrap.hidden = true;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  Utils.qs('#year').textContent = new Date().getFullYear();
  Theme.init();
  bindDropzone();
  bindGenerate();
  Utils.qs('#bulkLimitNote').textContent = `Free limit: up to ${FREE_LIMITS.bulkQrPerBatch} QR codes per batch.`;
});
