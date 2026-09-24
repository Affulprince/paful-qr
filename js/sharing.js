// Download / print / share / clipboard actions. Every branch is feature-detected
// so unsupported browsers get a clear message instead of a silent failure or a raw error.
'use strict';

const Sharing = {
  async download(state, extension, size) {
    try {
      await QRCustomizer.download(state, { extension, size });
      return { ok: true };
    } catch (err) {
      console.error(err);
      return { ok: false, message: `Couldn't create the ${extension.toUpperCase()} file. Please try again.` };
    }
  },

  print() {
    window.print();
  },

  canShare(file) {
    return typeof navigator.share === 'function'
      && typeof navigator.canShare === 'function'
      && navigator.canShare({ files: [file] });
  },

  async shareImage(canvas, contentValue) {
    if (!canvas) return { ok: false, message: 'Nothing to share yet — generate a QR code first.' };
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('blob failed');
      const file = new File([blob], 'paful-qr.png', { type: 'image/png' });

      if (this.canShare(file)) {
        await navigator.share({ files: [file], title: 'PAFUL QR', text: contentValue });
        return { ok: true, method: 'share' };
      }
      return { ok: false, message: 'Sharing isn\'t supported in this browser. Use Download or Copy instead.', unsupported: true };
    } catch (err) {
      if (err.name === 'AbortError') return { ok: false, aborted: true };
      console.error(err);
      return { ok: false, message: 'Sharing failed. Try Download instead.' };
    }
  },

  async copyImage(canvas) {
    if (!canvas) return { ok: false, message: 'Nothing to copy yet — generate a QR code first.' };
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
      return { ok: false, message: 'Copying images isn\'t supported in this browser. Use Download instead.', unsupported: true };
    }
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('blob failed');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return { ok: true };
    } catch (err) {
      console.error(err);
      return { ok: false, message: 'Couldn\'t copy the image. Use Download instead.' };
    }
  },

  async copyText(value) {
    if (!value) return { ok: false, message: 'Nothing to copy yet.' };
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return { ok: false, message: 'Clipboard access isn\'t supported in this browser.', unsupported: true };
    }
    try {
      await navigator.clipboard.writeText(value);
      return { ok: true };
    } catch (err) {
      console.error(err);
      return { ok: false, message: 'Couldn\'t copy to clipboard.' };
    }
  },
};
