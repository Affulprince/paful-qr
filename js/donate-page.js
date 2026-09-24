// Controller for donate.html — copy-to-clipboard for the USSD code, plus
// progressive enhancement: if the admin API is reachable, pull in the
// current heading/description/payment info. On any failure this does
// nothing and the page's existing static content stands as the fallback.
'use strict';

async function applyDynamicDonateContent() {
  try {
    const res = await fetch('api/donate.php');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.ok) return;

    const s = data.settings;
    if (s) {
      if (s.heading) Utils.qs('#donateHeading').textContent = s.heading;
      if (s.description) Utils.qs('#donateDescription').textContent = s.description;
      if (s.payment_section_title) Utils.qs('#paymentSectionTitle').textContent = s.payment_section_title;
      if (s.ussd_code) Utils.qs('#ussdCode').textContent = s.ussd_code;
    }

    if (Array.isArray(data.methods)) {
      const activeKeys = new Set(data.methods.map((m) => m.method_key));
      Utils.qsa('#paymentMethods .payment-method').forEach((el) => {
        const key = el.dataset.method;
        el.hidden = !activeKeys.has(key);
      });
      data.methods.forEach((m) => {
        const el = Utils.qs(`#paymentMethods .payment-method[data-method="${m.method_key}"]`);
        if (!el) return;
        const label = el.querySelector('.method-label');
        if (label && m.display_name) label.textContent = m.display_name;
      });
    }
  } catch (err) {
    // No backend configured, or it's unreachable — keep the static content.
  }
}

document.addEventListener('DOMContentLoaded', () => {
  Utils.qs('#year').textContent = new Date().getFullYear();
  Theme.init();
  applyDynamicDonateContent();

  Utils.qs('#copyUssdBtn').addEventListener('click', async () => {
    const code = Utils.qs('#ussdCode').textContent.trim();
    const result = await Sharing.copyText(code);
    Toast.show(result.ok ? 'USSD code copied.' : result.message, result.ok ? 'success' : (result.unsupported ? 'info' : 'error'));
  });
});
