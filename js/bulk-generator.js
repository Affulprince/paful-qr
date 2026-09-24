// CSV -> many QR codes -> ZIP. Kept deliberately simple: each row's "value"
// is encoded as-is (a URL or any text), matching the documented CSV format.
'use strict';

const BulkGenerator = {
  // Minimal RFC4180-ish parser: handles quoted fields, escaped quotes ("")
  // and commas/newlines inside quotes.
  parseCsvText(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    const pushField = () => { row.push(field); field = ''; };
    const pushRow = () => { pushField(); rows.push(row); row = []; };

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (inQuotes) {
        if (char === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 1; } else { inQuotes = false; }
        } else {
          field += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        pushField();
      } else if (char === '\n') {
        pushRow();
      } else if (char === '\r') {
        // skip; \n (or end of text) handles the row break
      } else {
        field += char;
      }
    }
    if (field.length || row.length) pushRow();
    return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
  },

  // Returns { rows: [{ name, value, line }], errors: [{ line, message }] }
  parse(text, limit) {
    const rawRows = this.parseCsvText(text);
    if (!rawRows.length) {
      return { rows: [], errors: [{ line: 0, message: 'The CSV file is empty.' }], skippedOverLimit: 0 };
    }

    const header = rawRows[0].map((h) => h.trim().toLowerCase());
    const nameIdx = header.indexOf('name');
    const valueIdx = header.indexOf('value');
    if (nameIdx === -1 || valueIdx === -1) {
      return { rows: [], errors: [{ line: 1, message: 'CSV must have a header row with "name" and "value" columns.' }], skippedOverLimit: 0 };
    }

    const rows = [];
    const errors = [];
    let skippedOverLimit = 0;

    for (let i = 1; i < rawRows.length; i += 1) {
      const line = i + 1;
      const cells = rawRows[i];
      const name = (cells[nameIdx] || '').trim();
      const value = (cells[valueIdx] || '').trim();

      if (!name && !value) continue;
      if (!name || !value) {
        errors.push({ line, message: `Row ${line}: both "name" and "value" are required.` });
        continue;
      }
      if (rows.length >= limit) {
        skippedOverLimit += 1;
        continue;
      }
      rows.push({ name, value, line });
    }

    return { rows, errors, skippedOverLimit };
  },

  async generateZip(rows, style, onProgress) {
    const zip = new JSZip();
    const usedNames = new Set();

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      try {
        const options = QRCustomizer.buildOptions({ ...style, data: row.value }, { width: 512, height: 512, type: 'canvas' });
        const instance = new QRCodeStyling(options);
        const blob = await instance.getRawData('png');

        let filename = row.name.replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-') || `qr-${i + 1}`;
        let unique = filename;
        let n = 2;
        while (usedNames.has(unique)) { unique = `${filename}-${n}`; n += 1; }
        usedNames.add(unique);

        zip.file(`${unique}.png`, blob);
        row.status = 'ok';
      } catch (err) {
        console.error(err);
        row.status = 'failed';
        row.error = 'Could not generate this QR code.';
      }
      if (onProgress) onProgress(i + 1, rows.length);
    }

    return zip.generateAsync({ type: 'blob' });
  },
};
