// Anonymous, increment-only usage beacon for the admin dashboard's "QR
// Codes Generated" counter. No content, IDs, or identifying data are ever
// sent — just "one more generate event for this type today". Never blocks
// or affects the actual generator; any failure here is silently ignored.
'use strict';

const QRTracking = {
  track(type) {
    try {
      fetch('api/track-event.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'generate', type }),
        keepalive: true,
      }).catch(() => {});
    } catch (err) {
      // Ignore — tracking must never affect the generator itself.
    }
  },
};
