// Wraps the qr-code-styling library: builds its option object from our UI state,
// renders the live preview, and produces export instances for download.
'use strict';

const QRCustomizer = {
  instance: null,
  container: null,

  defaults() {
    return {
      width: 280,
      height: 280,
      data: 'https://example.com',
      margin: 12,
      qrOptions: { errorCorrectionLevel: 'M' },
      dotsOptions: { type: 'square', color: '#0b3c5d' },
      backgroundOptions: { color: '#ffffff' },
      cornersSquareOptions: { type: 'square', color: '#0b3c5d' },
      cornersDotOptions: { type: 'square', color: '#0b3c5d' },
      imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.4, hideBackgroundDots: true },
    };
  },

  // Builds a fresh qr-code-styling option object from our simplified state shape.
  buildOptions(state, overrides) {
    const opts = this.defaults();
    opts.data = state.data || ' ';
    opts.qrOptions.errorCorrectionLevel = state.errorCorrection || 'M';
    opts.margin = state.quietZone ?? 12;

    opts.dotsOptions.type = state.dotStyle || 'square';
    opts.cornersSquareOptions.type = state.cornerSquareStyle || 'square';
    opts.cornersDotOptions.type = state.cornerDotStyle || 'square';

    if (state.gradient && state.gradient.enabled) {
      const gradientDef = {
        type: state.gradient.type || 'linear',
        rotation: ((state.gradient.rotation || 0) * Math.PI) / 180,
        colorStops: [
          { offset: 0, color: state.gradient.from },
          { offset: 1, color: state.gradient.to },
        ],
      };
      opts.dotsOptions.gradient = gradientDef;
      delete opts.dotsOptions.color;
    } else {
      opts.dotsOptions.color = state.fgColor || '#0b3c5d';
    }
    opts.cornersSquareOptions.color = state.fgColor || '#0b3c5d';
    opts.cornersDotOptions.color = state.fgColor || '#0b3c5d';

    opts.backgroundOptions.color = state.transparentBg ? 'rgba(0,0,0,0)' : (state.bgColor || '#ffffff');

    if (state.logo) {
      opts.image = state.logo;
      opts.imageOptions.imageSize = Utils.clamp((state.logoSize || 40) / 100, 0.1, 0.6);
      opts.imageOptions.margin = state.logoMargin ?? 6;
      opts.imageOptions.hideBackgroundDots = Boolean(state.logoBackground);
    } else {
      opts.image = undefined;
    }

    if (overrides) Object.assign(opts, overrides);
    return opts;
  },

  render(container, state) {
    this.container = container;
    const options = this.buildOptions(state, { type: 'canvas' });

    if (!this.instance) {
      this.instance = new QRCodeStyling(options);
      container.innerHTML = '';
      this.instance.append(container);
    } else {
      this.instance.update(options);
    }
    return this.instance;
  },

  getCanvas() {
    return this.container ? this.container.querySelector('canvas') : null;
  },

  // Creates a detached instance at a given pixel size / format for export,
  // so the on-screen preview size is never distorted by a download request.
  createExportInstance(state, size, type) {
    const options = this.buildOptions(state, { width: size, height: size, type: type || 'canvas' });
    return new QRCodeStyling(options);
  },

  async download(state, { extension, size }) {
    const type = extension === 'svg' ? 'svg' : 'canvas';
    const exportInstance = this.createExportInstance(state, size || state.exportSize || 1024, type);
    await exportInstance.download({ name: 'paful-qr', extension });
  },
};
