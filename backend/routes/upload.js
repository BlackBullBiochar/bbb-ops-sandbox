// routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const path = require('path');
const UploadData = require('../models/uploadData');
const { Readable } = require('stream');

const upload = multer({ storage: multer.memoryStorage() });

const cleanString = (s) =>
  String(s)
    .replace(/[^\x20-\x7E]/g, ' ')   // remove non-printable ASCII including `�`
    .replace(/\s+/g, ' ')            // collapse whitespace
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


// Map German headers to English
const headerMap = {
  'time': 'timestamp',
  'timestamp': 'timestamp',
  'abgasgebläse_1_geschwindigkeit (%)': 'Exhaust Fan 1 Speed (%)',
  'abgasgebläse_2_geschwindigkeit (%)': 'Exhaust Fan 2 Speed (%)',
  'unterdruck_reaktor_1 (pa)': 'Vacuum Reactor 1 (pa)',
  'unterdruck_reaktor_2 (pa)': 'Vacuum Reactor 2 (pa)',
  'temperatur_zyklon ( c)': 'Cyclone Temperature (°c)',
  'temperatur_abgas_vor_bomat (°c)': 'Exhaust Temp Pre Bomat (°c)',
  'abgasventilator1 (%)': 'Exhaust Fan 1 (%)',
  'abgasventilator2 (%)': 'Exhaust Fan 2 (%)',
  'agr (%)': 'AGR (%)',
  'temperatur_reaktor_1 ( c)': 'Reactor 1 Temperature (°C)',
  'temperatur_reaktor_2 ( c)': 'Reactor 2 Temperature (°C)',
  'abgastemperatur_1 ( c)': 'Exhaust Gas Temperature 1 (°C)',
  'abgastemperatur_2 ( c)': 'Exhaust Gas Temperature 2 (°C)',
  'prozess.sensor.temp.t5': 'T5 Pyrolysis Temperature (°C)',
  'temperatur_pyrolysegas ( c)': 'Pyrolysis Gas Temperature (°C)'
  
};

// 1) Upload a CSV or JSON file as one document
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = (req.body.customName || req.file.originalname)
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9-_.]/g, '');

  try {
    if (ext === '.csv') {
      const rows = [];
      Readable.from(req.file.buffer)
        .pipe(csv())
        .on('data', (rawRow) => {
          const translated = {};
          for (const rawKey in rawRow) {
            const cleanKey = cleanString(rawKey.toLowerCase());
            const mappedKey = headerMap[cleanKey] || cleanKey;
            translated[mappedKey] = cleanString(rawRow[rawKey]);
          }
          rows.push(translated);
        })        
        .on('end', async () => {
          const doc = new UploadData({
            filename,
            filetype: 'csv',
            data: rows,
          });
          await doc.save();
          res.json({ message: 'CSV file saved', count: rows.length });
        });
    } else if (ext === '.json') {
      const json = JSON.parse(req.file.buffer.toString('utf8'));
      const rows = Array.isArray(json) ? json : [json];
      const doc = new UploadData({
        filename,
        filetype: 'json',
        data: rows,
      });
      await doc.save();
      res.json({ message: 'JSON file saved', count: rows.length });
    } else {
      res.status(400).json({ error: 'Only .csv or .json supported' });
    }
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

// 2) List all uploads
router.get('/', async (req, res) => {
  try {
    const docs = await UploadData.find()
      .sort({ uploadDate: -1 })
      .lean();
    res.json(docs);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

// 3) Get the data array for one upload
router.get('/data/by-file/:filename', async (req, res) => {
  try {
    const fn = decodeURIComponent(req.params.filename);
    const doc = await UploadData.findOne({ filename: fn }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc.data);
  } catch (err) {
    console.error('Fetch rows error:', err);
    res.status(500).json({ error: 'Failed to fetch rows' });
  }
});

// 4) Delete one upload
router.delete('/data/by-file/:filename', async (req, res) => {
  try {
    const fn = decodeURIComponent(req.params.filename);
    const result = await UploadData.deleteOne({ filename: fn });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
