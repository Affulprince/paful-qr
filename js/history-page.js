// Controller for history.html — lists, filters, downloads and deletes
// locally-saved QR codes, and hands items off to the generator for editing.
'use strict';

let activeFilter = '';

function showStatus(message, kind = 'info') {
  Toast.show(message, kind);
}

// Bootstrap modal confirmation — replaces window.confirm().
function confirmAction(message, onConfirm) {
  const modalEl = Utils.qs('#confirmModal');
  Utils.qs('#confirmModalBody').textContent = message;
  const confirmBtn = Utils.qs('#confirmModalBtn');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  const handler = () => {
    confirmBtn.removeEventListener('click', handler);
    modal.hide();
    onConfirm();
  };
  confirmBtn.addEventListener('click', handler);
  modal.show();
}

function thumbState(record) {
  return { ...record.style, data: record.data };
}

function renderThumb(container, record) {
  try {
    const options = QRCustomizer.buildOptions(thumbState(record), { width: 140, height: 140, type: 'canvas' });
    const instance = new QRCodeStyling(options);
    instance.append(container);
  } catch (err) {
    container.textContent = 'Preview unavailable';
  }
}

function renderCollectionOptions() {
  const select = Utils.qs('#collectionFilter');
  const current = select.value;
  const collections = QRHistory.collections();
  select.innerHTML = '<option value="">All collections</option>'
    + collections.map((c) => `<option value="${Utils.escapeHtml(c)}">${Utils.escapeHtml(c)}</option>`).join('');
  select.value = collections.includes(current) ? current : '';
}

function cardTemplate(record) {
  const title = Utils.escapeHtml(record.title);
  const collection = Utils.escapeHtml(record.collection);
  const col = document.createElement('div');
  col.className = 'col';
  col.innerHTML = `
    <div class="card h-100 shadow-sm border-0">
      <div class="qr-preview-box qr-card-thumb m-3 mb-0" role="img" aria-label="QR preview for ${title}"></div>
      <div class="card-body d-flex flex-column">
        <h3 class="h6 card-title text-break">${title}</h3>
        <div class="mb-2 d-flex flex-wrap gap-1">
          <span class="badge text-bg-secondary">${Utils.escapeHtml(record.type)}</span>
          ${record.collection ? `<span class="badge text-bg-secondary">${collection}</span>` : ''}
          <span class="badge text-bg-light border">${new Date(record.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="btn-group mt-auto" role="group" aria-label="QR code actions">
          <button type="button" class="btn btn-outline-secondary btn-sm" data-action="edit"><i class="bi bi-pencil-square"></i> Edit</button>
          <button type="button" class="btn btn-outline-secondary btn-sm" data-action="download"><i class="bi bi-download"></i> Download</button>
          <button type="button" class="btn btn-outline-danger btn-sm" data-action="delete"><i class="bi bi-trash3"></i> Delete</button>
        </div>
      </div>
    </div>
  `;
  renderThumb(col.querySelector('.qr-card-thumb'), record);

  col.querySelector('[data-action="edit"]').addEventListener('click', () => {
    QRHistory.setPendingLoad(record);
    window.location.href = 'index.html#generator';
  });

  col.querySelector('[data-action="download"]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await QRCustomizer.download(thumbState(record), { extension: 'png', size: 1024 });
      showStatus(`Downloaded "${record.title}".`, 'success');
    } catch (err) {
      console.error(err);
      showStatus('Could not download that QR code.', 'error');
    }
    btn.disabled = false;
  });

  col.querySelector('[data-action="delete"]').addEventListener('click', () => {
    confirmAction(`Delete "${record.title}"? This can't be undone.`, () => {
      QRHistory.remove(record.id);
      showStatus('Deleted.', 'success');
      renderAll();
    });
  });

  return col;
}

function renderAll() {
  const items = QRHistory.list().filter((r) => !activeFilter || r.collection === activeFilter);
  const grid = Utils.qs('#cardGrid');
  const empty = Utils.qs('#emptyState');
  const count = Utils.qs('#itemCount');

  renderCollectionOptions();
  count.textContent = `${QRHistory.list().length} of ${FREE_LIMITS.historyItems} saved`;

  grid.innerHTML = '';
  if (!items.length) {
    empty.hidden = false;
    grid.hidden = true;
    return;
  }
  empty.hidden = true;
  grid.hidden = false;
  items.forEach((record) => grid.appendChild(cardTemplate(record)));
}

function bindToolbar() {
  Utils.qs('#collectionFilter').addEventListener('change', (e) => {
    activeFilter = e.target.value;
    renderAll();
  });
  Utils.qs('#clearHistoryBtn').addEventListener('click', () => {
    if (!QRHistory.list().length) return;
    confirmAction('Delete all saved QR codes? This can\'t be undone.', () => {
      QRHistory.clear();
      activeFilter = '';
      showStatus('All saved QR codes were deleted.', 'success');
      renderAll();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  Utils.qs('#year').textContent = new Date().getFullYear();
  Theme.init();
  bindToolbar();
  if (!Storage.available()) {
    showStatus('Local storage isn\'t available in this browser, so saved QR codes can\'t be shown.', 'error');
    Utils.qs('#emptyState').hidden = true;
    return;
  }
  renderAll();
});
