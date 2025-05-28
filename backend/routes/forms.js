// routes/forms.js
const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const csv       = require('csv-parser');
const path      = require('path');
const Forms = require('../models/formData');
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

// 1) POST /api/forms
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = (req.body.customName || req.file.originalname)
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9-_.]/g, '');

  try {
    let rows = [];

    if (ext === '.csv') {
      // parse CSV into rows[]
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
          
            // Normalize any known date fields
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

    // Normalize all row.date fields
    rows = rows.map(row => {
      if (row.Date) {
        row.Date = normalizeDateString(row.Date);
      }
      return row;
      });

    // save as one document
    const doc = new Forms({
      filename,
      filetype: ext === '.csv' ? 'csv' : 'json',
      data: rows,
    });
    await doc.save();
    res.json({ message: 'Forms file saved', count: rows.length });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

// 2) GET /api/forms
router.get('/', async (req, res) => {
  try {
    const docs = await Forms.find()
      .sort({ uploadDate: -1 })
      .lean();
    res.json(docs);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch Form' });
  }
});

// 3) GET /api/forms/data/by-file/:filename
router.get('/data/by-file/:filename', async (req, res) => {
  try {
    const fn = decodeURIComponent(req.params.filename);
    const doc = await Forms.findOne({ filename: fn }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc.data);
  } catch (err) {
    console.error('Fetch rows error:', err);
    res.status(500).json({ error: 'Failed to fetch rows' });
  }
});

// 4) DELETE /api/Forms/data/by-file/:filename
router.delete('/data/by-file/:filename', async (req, res) => {
  try {
    const fn = decodeURIComponent(req.params.filename);
    const result = await Forms.deleteOne({ filename: fn });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;