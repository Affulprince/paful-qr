// Draws the shareable "digital business card" image (name/title/company +
// QR code) with plain Canvas 2D — no image library needed. Several layouts
// are available under BusinessCard.templates; each takes the same data
// shape so the caller doesn't need to know which one is active.
'use strict';

const BusinessCard = {
  width: 1200,
  height: 630,

  roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  // A small colored bullet (circle or square) followed by a line of text —
  // stands in for a per-type icon (phone/email/etc.) without depending on
  // an icon font being loaded inside the canvas.
  bulletRow(ctx, x, y, text, color, bulletStyle, maxWidth, textColor) {
    ctx.fillStyle = color;
    if (bulletStyle === 'square') {
      ctx.fillRect(x, y - 15, 12, 12);
    } else {
      ctx.beginPath();
      ctx.arc(x + 6, y - 10, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = textColor || '#3a4250';
    ctx.font = '400 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText(text, x + 26, y, maxWidth);
  },

  drawQrPanel(ctx, qrCanvas, x, y, size, opts = {}) {
    const { shadow = true, border = null, radius = 18 } = opts;
    ctx.save();
    if (shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 6;
    }
    ctx.fillStyle = '#ffffff';
    this.roundedRect(ctx, x, y, size, size, radius);
    ctx.fill();
    ctx.restore();
    if (border) {
      ctx.save();
      ctx.strokeStyle = border;
      ctx.lineWidth = 4;
      this.roundedRect(ctx, x + 2, y + 2, size - 4, size - 4, radius);
      ctx.stroke();
      ctx.restore();
    }
    if (qrCanvas) {
      const pad = size * 0.09;
      ctx.drawImage(qrCanvas, x + pad, y + pad, size - pad * 2, size - pad * 2);
    }
  },

  templates: {
    classic: {
      label: 'Classic',
      render(ctx, data, qrCanvas) {
        const { name, title, company, phone, email, accentColor } = data;
        const W = this.width;
        const H = this.height;
        const accent = accentColor || '#0b3c5d';

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, W, 14);

        const padX = 70;
        let y = 190;
        ctx.fillStyle = '#101828';
        ctx.font = '700 56px "Segoe UI", Arial, sans-serif';
        ctx.fillText(name || 'Your Name', padX, y, W - 480);

        if (title) {
          y += 54;
          ctx.fillStyle = accent;
          ctx.font = '600 30px "Segoe UI", Arial, sans-serif';
          ctx.fillText(title, padX, y, W - 480);
        }
        if (company) {
          y += 44;
          ctx.fillStyle = '#5b6472';
          ctx.font = '400 28px "Segoe UI", Arial, sans-serif';
          ctx.fillText(company, padX, y, W - 480);
        }

        y += 56;
        ctx.font = '400 22px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#5b6472';
        if (phone) { ctx.fillText(phone, padX, y, W - 480); y += 32; }
        if (email) { ctx.fillText(email, padX, y, W - 480); }

        const panelSize = 380;
        this.drawQrPanel(ctx, qrCanvas, W - panelSize - 90, (H - panelSize) / 2, panelSize);
      },
    },

    circuit: {
      label: 'Circuit',
      render(ctx, data, qrCanvas) {
        const { name, title, company, phone, email, accentColor } = data;
        const W = this.width;
        const H = this.height;
        const accent = accentColor || '#0b3c5d';
        const stripW = 150;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, stripW, H);

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, stripW, H);
        ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 20;
        for (let r = 50; r <= 260; r += 60) {
          ctx.beginPath();
          ctx.arc(stripW / 2, H * 0.26, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        const padX = stripW + 70;
        const maxW = W - padX - 60;
        let y = 160;
        ctx.fillStyle = '#101828';
        ctx.font = '700 52px "Segoe UI", Arial, sans-serif';
        ctx.fillText(name || 'Your Name', padX, y, maxW);

        if (title) {
          y += 42;
          ctx.fillStyle = accent;
          ctx.font = '600 24px "Segoe UI", Arial, sans-serif';
          ctx.fillText(title.toUpperCase(), padX, y, maxW);
        }

        y += 66;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(padX + Math.min(maxW, 360), y); ctx.stroke();
        y += 46;

        [company, phone, email].filter(Boolean).forEach((text) => {
          this.bulletRow(ctx, padX, y, text, accent, 'circle', maxW);
          y += 46;
        });

        const size = 220;
        this.drawQrPanel(ctx, qrCanvas, W - size - 70, H - size - 60, size, { border: accent });
      },
    },

    skyline: {
      label: 'Skyline',
      render(ctx, data, qrCanvas) {
        const { name, title, company, phone, email, accentColor } = data;
        const W = this.width;
        const H = this.height;
        const accent = accentColor || '#0b3c5d';

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        ctx.beginPath();
        ctx.moveTo(W * 0.62, 0);
        ctx.lineTo(W, 0);
        ctx.lineTo(W, H);
        ctx.lineTo(W * 0.78, H);
        ctx.closePath();
        ctx.fillStyle = accent;
        ctx.fill();

        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(W * 0.605, 0);
        ctx.lineTo(W * 0.765, H);
        ctx.stroke();
        ctx.restore();

        const padX = 70;
        const maxW = W * 0.55;
        let y = 180;
        ctx.fillStyle = '#101828';
        ctx.font = '700 52px "Segoe UI", Arial, sans-serif';
        ctx.fillText(name || 'Your Name', padX, y, maxW);
        if (title) {
          y += 46;
          ctx.fillStyle = accent;
          ctx.font = '600 28px "Segoe UI", Arial, sans-serif';
          ctx.fillText(title, padX, y, maxW);
        }

        y += 74;
        [company, phone, email].filter(Boolean).forEach((text) => {
          this.bulletRow(ctx, padX, y, text, accent, 'circle', maxW);
          y += 44;
        });

        const size = 200;
        this.drawQrPanel(ctx, qrCanvas, W - size - 90, H - size - 80, size);
      },
    },

    split: {
      label: 'Split',
      render(ctx, data, qrCanvas) {
        const { name, title, company, phone, email, accentColor } = data;
        const W = this.width;
        const H = this.height;
        const accent = accentColor || '#0b3c5d';
        const leftW = W * 0.4;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, leftW, H);

        const initial = (company || name || 'P').trim().charAt(0).toUpperCase();
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(leftW / 2, 140, 56, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 52px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(initial, leftW / 2, 158);
        ctx.restore();

        if (company) {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 28px "Segoe UI", Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(company, leftW / 2, 232, leftW - 60);
          ctx.restore();
        }

        const qrSize = 190;
        const qrY = 280;
        this.drawQrPanel(ctx, qrCanvas, leftW / 2 - qrSize / 2, qrY, qrSize, { shadow: false });
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '600 18px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('S C A N   M E', leftW / 2, qrY + qrSize + 40);
        ctx.restore();

        const padX = leftW + 60;
        const maxW = W - padX - 60;
        let y = 190;
        ctx.fillStyle = '#101828';
        ctx.font = '700 50px "Segoe UI", Arial, sans-serif';
        ctx.fillText(name || 'Your Name', padX, y, maxW);
        if (title) {
          y += 44;
          ctx.fillStyle = accent;
          ctx.font = '600 26px "Segoe UI", Arial, sans-serif';
          ctx.fillText(title, padX, y, maxW);
        }

        y += 56;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(W - 60, y); ctx.stroke();
        y += 50;

        [phone, email].filter(Boolean).forEach((text) => {
          this.bulletRow(ctx, padX, y, text, accent, 'circle', maxW);
          y += 46;
        });
      },
    },

    banner: {
      label: 'Banner',
      render(ctx, data, qrCanvas) {
        const { name, title, company, phone, email, accentColor } = data;
        const W = this.width;
        const H = this.height;
        const accent = accentColor || '#0b3c5d';
        const bandH = 130;
        const sideW = 90;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, W, bandH);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 42px "Segoe UI", Arial, sans-serif';
        ctx.fillText(name || 'Your Name', 70, 76, W - 140);
        if (title) {
          ctx.font = '400 22px "Segoe UI", Arial, sans-serif';
          ctx.fillText(title, 70, 108, W - 140);
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, bandH);
        ctx.lineTo(sideW, bandH);
        ctx.quadraticCurveTo(sideW + 46, (bandH + H) / 2, sideW, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.12;
        ctx.fill();
        ctx.restore();

        const padX = sideW + 40;
        const maxW = W - padX - 300;
        let y = bandH + 90;
        [company, phone, email].filter(Boolean).forEach((text) => {
          this.bulletRow(ctx, padX, y, text, accent, 'square', maxW);
          y += 48;
        });

        const size = 190;
        this.drawQrPanel(ctx, qrCanvas, W - size - 80, bandH + 60, size, { border: accent, shadow: false });
      },
    },
  },

  render(templateId, data, qrCanvas, targetCanvas) {
    const canvas = targetCanvas || document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);
    const tpl = this.templates[templateId] || this.templates.classic;
    tpl.render.call(this, ctx, data, qrCanvas);
    return canvas;
  },
};
