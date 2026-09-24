// Real, non-fake readability checks: contrast + logo-coverage heuristics,
// plus an actual jsQR decode of the rendered canvas to confirm it round-trips.
'use strict';

const QRReadability = {
  check(state, canvas) {
    const items = [];

    const contrast = Utils.contrastRatio(state.fgColor, state.transparentBg ? '#ffffff' : state.bgColor);
    if (contrast === null) {
      items.push({ status: 'warn', label: 'Could not evaluate color contrast.' });
    } else if (contrast < 2.5) {
      items.push({ status: 'warn', label: `Low contrast between QR color and background (${contrast.toFixed(1)}:1) — this can make scanning unreliable.` });
    } else {
      items.push({ status: 'ok', label: 'Good contrast between QR color and background.' });
    }

    if (state.logo) {
      const sizePct = state.logoSize || 40;
      if (sizePct > 35 && state.errorCorrection !== 'H' && state.errorCorrection !== 'Q') {
        items.push({ status: 'warn', label: 'Logo may be too large for the current error correction level — try "High" or reduce logo size.' });
      } else if (sizePct > 45) {
        items.push({ status: 'warn', label: 'Logo is quite large and may cover important QR data — consider reducing its size.' });
      } else {
        items.push({ status: 'ok', label: 'Logo size looks acceptable for the current error correction level.' });
      }
    }

    if (state.errorCorrection === 'L' && state.logo) {
      items.push({ status: 'warn', label: 'Error correction is set to Low while a logo is present — increase it for better resilience.' });
    } else {
      items.push({ status: 'ok', label: `Error correction set to ${this.levelName(state.errorCorrection)}.` });
    }

    const decodeResult = this.decode(canvas);
    if (decodeResult === null) {
      items.push({ status: 'warn', label: 'Could not verify by scanning — the image may not have rendered yet.' });
    } else if (decodeResult === state.data) {
      items.push({ status: 'ok', label: 'Verified: this QR code was decoded locally and matches your content.' });
    } else {
      items.push({ status: 'warn', label: 'The rendered QR code could not be decoded back to your content — try increasing error correction or simplifying styling.' });
    }

    return items;
  },

  levelName(code) {
    return { L: 'Low', M: 'Medium', Q: 'Quartile', H: 'High' }[code] || 'Medium';
  },

  decode(canvas) {
    if (!canvas || typeof jsQR !== 'function') return null;
    try {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, canvas.width, canvas.height);
      return result ? result.data : null;
    } catch (err) {
      return null;
    }
  },
};
