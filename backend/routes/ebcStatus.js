const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const csv       = require('csv-parser');
const path      = require('path');
const Charcodes = require('../models/charcodes');
const { Readable } = require('stream');
const axios = require('axios');

const upload = multer({ storage: multer.memoryStorage() });

const cleanString = (s) =>
  String(s)
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function normalizeDateString(d) {
  if (!d || typeof d !== 'string') return d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const parts = d.split('/');
  if (parts.length !== 3) return d;
  let [day, month, year] = parts;
  if (year.length === 2) year = '20' + year;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext     = path.extname(req.file.originalname).toLowerCase();
  const rawName = req.body.customName || req.file.originalname;
  const filename = rawName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9-_.]/g, '');

  try {
    let rows = [];

    if (ext === '.csv') {
      await new Promise((resolve, reject) => {
        Readable.from(req.file.buffer)
          .pipe(csv())
          .on('data', rawRow => {
            const cleanRow = {};
            for (const key in rawRow) {
              const cleanKey = cleanString(key);
              const cleanValue = cleanString(rawRow[key]);
              cleanRow[cleanKey] = cleanValue;
            }
            if (cleanRow['Date']) cleanRow['Date'] = normalizeDateString(cleanRow['Date']);
            if (cleanRow['Produced']) cleanRow['Produced'] = normalizeDateString(cleanRow['Produced']);
            rows.push(cleanRow);
          })
          .on('end', resolve)
          .on('error', reject);
      });
    } else if (ext === '.json') {
      const json = JSON.parse(req.file.buffer.toString('utf8'));
      rows = Array.isArray(json) ? json : [json];
    } else {
      return res.status(400).json({ error: 'Only .csv or .json supported' });
    }

    rows = rows.map(row => {
      if (row.Produced) row.Produced = normalizeDateString(row.Produced);
      return row;
    });

    const lower = filename.toLowerCase();
    let siteVal = null;
    if (lower.includes('ara')) siteVal = 'ara';
    else if (lower.includes('jnr')) siteVal = 'jnr';
    if (siteVal) {
      rows = rows.map(row => ({ ...row, site: siteVal }));
    }

    const tempUploadRes = await axios.get('http://localhost:5000/api/upload');
    const tempUploadDocs = tempUploadRes.data;
    const tempBySiteAndDate = { ara: {}, jnr: {} };

    tempUploadDocs.forEach(doc => {
      (doc.data || []).forEach(row => {
        const [datePart] = String(row.timestamp || '').split(' ');
        if (!datePart) return;

        const t1 = parseFloat(row['Reactor 1 Temperature (°C)']);
        const t2 = parseFloat(row['Reactor 2 Temperature (°C)']);
        const tJNR = parseFloat(row['T5 Pyrolysis Temperature (°C)']);

        if (!isNaN(t1)) {
          if (!tempBySiteAndDate.ara[datePart]) tempBySiteAndDate.ara[datePart] = [];
          tempBySiteAndDate.ara[datePart].push(t1);
        }
        if (!isNaN(t2)) {
          if (!tempBySiteAndDate.ara[datePart]) tempBySiteAndDate.ara[datePart] = [];
          tempBySiteAndDate.ara[datePart].push(t2);
        }
        if (!isNaN(tJNR)) {
          if (!tempBySiteAndDate.jnr[datePart]) tempBySiteAndDate.jnr[datePart] = [];
          tempBySiteAndDate.jnr[datePart].push(tJNR);
        }
      });
    });

    const inSpec = (t) => t >= 520 && t <= 780;

    rows = rows.map(row => {
      const produced = row.Produced;
      const site = (row.site || '').toLowerCase();
      if (!produced || !['ara', 'jnr'].includes(site)) {
        return { ...row, 'EBC Cert Status': 'Pending', 'EBC Status Reason': 'No Temp Data' };
      }
      const temps = tempBySiteAndDate[site]?.[produced];
      if (!temps || temps.length === 0) {
        return { ...row, 'EBC Cert Status': 'Pending', 'EBC Status Reason': 'No Temp Data' };
      }
      const allInSpec = temps.every(inSpec);
      return {
        ...row,
        'EBC Cert Status': allInSpec ? 'Approved' : 'Flagged',
        'EBC Status Reason': allInSpec ? 'All Temps in Spec.' : 'Temps Out of Spec.',
      };
    });

    const now = new Date();
    const uploadDate = now.toISOString().split('T')[0];
    const uploadTime = now.toTimeString().slice(0, 5).replace(':', '-');

    for (const row of rows) {
      const charcodeId = row['Charcode ID'] || row['ID'];
      if (!charcodeId) continue;
      await axios.post('http://localhost:5000/api/ebcstatus/add', {
        charcodeId,
        status: row['EBC Cert Status'],
        reason: row['EBC Status Reason'],
        date: uploadDate,
        time: uploadTime
      });
    }

    const doc = new Charcodes({ filename, filetype: ext === '.csv' ? 'csv' : 'json', data: rows });
    await doc.save();

    res.json({ message: 'Charcodes file saved', count: rows.length });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

module.exports = router;
