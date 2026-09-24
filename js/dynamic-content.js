// Progressive enhancement only: if the admin API is reachable, swap in
// admin-managed FAQ content and hide QR types the admin disabled. If the
// fetch fails for any reason (no backend set up, DB down, offline), this
// does nothing and the page's existing hardcoded content stands as-is —
// that's the fallback, not an error state.
'use strict';

async function applyDynamicQrTypes() {
  try {
    const res = await fetch('api/qr-types.php');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.types)) return;

    let selectedHidden = false;
    data.types.forEach((t) => {
      if (t.is_active) return;
      const input = document.querySelector(`input[name="qrType"][value="${t.type_key}"]`);
      const label = input && document.querySelector(`label[for="${input.id}"]`);
      if (!input || !label) return;
      if (input.checked) selectedHidden = true;
      input.hidden = true;
      label.hidden = true;
    });

    if (selectedHidden) {
      const firstVisible = document.querySelector('input[name="qrType"]:not([hidden])');
      if (firstVisible) {
        firstVisible.checked = true;
        firstVisible.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  } catch (err) {
    // No backend configured, or it's unreachable — keep the static defaults.
  }
}

async function applyDynamicFaq() {
  try {
    const res = await fetch('api/faq.php');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.faqs) || !data.faqs.length) return;

    const container = document.getElementById('faqAccordion');
    if (!container) return;

    container.innerHTML = data.faqs.map((faq, i) => {
      const id = `faq-dyn-${i}`;
      return `
        <div class="accordion-item">
          <h3 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${id}">${Utils.escapeHtml(faq.question)}</button></h3>
          <div id="${id}" class="accordion-collapse collapse" data-bs-parent="#faqAccordion"><div class="accordion-body">${Utils.escapeHtml(faq.answer)}</div></div>
        </div>`;
    }).join('');
  } catch (err) {
    // Keep the static FAQ content.
  }
}

// Applies admin-configured generation defaults (color/error-correction/
// margin/size) to a freshly-loaded generator, and hides any download format
// the admin disabled. Skipped when a history item or template preset is
// already loading, since that snapshot's own style takes priority.
async function applyDynamicQrSettings() {
  try {
    const res = await fetch('api/qr-settings.php');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.ok || !data.settings) return;
    const s = data.settings;

    if (!window.__pafulHasPendingLoad && typeof applyStyleToUI === 'function') {
      applyStyleToUI({
        fgColor: s.default_fg_color,
        bgColor: s.default_bg_color,
        errorCorrection: s.default_error_correction,
        quietZone: s.default_margin,
      });
      if (typeof applyExportSizeToUI === 'function') applyExportSizeToUI(s.default_size);
      if (typeof recompute === 'function') recompute();
    }

    if (Array.isArray(s.allowed_formats) && s.allowed_formats.length) {
      Utils.qsa('[data-download-format]').forEach((btn) => {
        const fmt = btn.getAttribute('data-download-format');
        if (!s.allowed_formats.includes(fmt)) (btn.closest('.col') || btn).hidden = true;
      });
    }
  } catch (err) {
    // No backend configured, or it's unreachable — keep the static defaults.
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('typePicker')) applyDynamicQrTypes();
  if (document.getElementById('faqAccordion')) applyDynamicFaq();
  if (document.getElementById('typePicker')) applyDynamicQrSettings();
});
