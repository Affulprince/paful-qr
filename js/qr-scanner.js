// Camera + image-upload QR scanning via jsQR. No image or camera frame is
// ever sent anywhere — decoding happens entirely in the browser.
'use strict';

const QRScanner = {
  stream: null,
  rafId: null,

  async startCamera(video, canvas, onResult, onError) {
    if (!window.isSecureContext) {
      onError('Camera access requires a secure connection (HTTPS or localhost).');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onError('Camera scanning isn\'t supported in this browser. Try uploading an image instead.');
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = this.stream;
      await video.play();
      this.loop(video, canvas, onResult);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        onError('Camera permission was denied. Allow camera access, or upload an image instead.');
      } else if (err.name === 'NotFoundError') {
        onError('No camera was found on this device. Try uploading an image instead.');
      } else {
        console.error(err);
        onError('Could not start the camera. Try uploading an image instead.');
      }
    }
  },

  loop(video, canvas, onResult) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = typeof jsQR === 'function' ? jsQR(imageData.data, canvas.width, canvas.height) : null;
        if (code && code.data) {
          onResult(code.data);
          return;
        }
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  },

  stopCamera() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  },

  decodeImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please choose an image file.'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = typeof jsQR === 'function' ? jsQR(imageData.data, canvas.width, canvas.height) : null;
        URL.revokeObjectURL(img.src);
        resolve(code ? code.data : null);
      };
      img.onerror = () => reject(new Error('Could not read that image file.'));
      img.src = URL.createObjectURL(file);
    });
  },
};
