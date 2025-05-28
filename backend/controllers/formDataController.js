const FormData = require('../models/formData');
const csv = require('csv-parser');
const path = require('path');
const { Readable } = require('stream');

const clean = s => String(s).replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();

const normaliseDate = d => {
  if (!d || typeof d !== 'string') return d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const parts = d.split('/');
  if (parts.length !== 3) return d;
  let [day, month, year] = parts;
  if (year.length === 2) year = '20' + year;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

exports.upload = async (req, res) => {
  const { customName, site } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const fn = (customName || req.file.originalname).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9-_.]/g, '');

  try {
    let rows = [];

    if (ext === '.csv') {
      await new Promise((resolve, reject) => {
        Readable.from(req.file.buffer)
          .pipe(csv())
          .on('data', rawRow => {
            const cleanRow = {};
            for (const key in rawRow) {
              const ck = clean(key);
              let val = clean(rawRow[key]);
              if (ck === 'Date' || ck === 'Produced') val = normaliseDate(val);
              cleanRow[ck] = val;
            }
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

    const doc = new FormData({
      fn,
      ft: ext === '.csv' ? 'csv' : 'json',
      d: rows,
      site: site || null,
    });
    await doc.save();

    res.json({ message: 'Form upload saved', count: rows.length });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process upload' });
  }
};

exports.listAll = async (req, res) => {
  try {
    const docs = await FormData.find().sort({ dt: -1 }).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch form uploads' });
  }
};

exports.getByFilename = async (req, res) => {
  try {
    const fn = decodeURIComponent(req.params.filename);
    const doc = await FormData.findOne({ fn }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc.d);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

exports.deleteByFilename = async (req, res) => {
  try {
    const fn = decodeURIComponent(req.params.filename);
    const result = await FormData.deleteOne({ fn });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete data' });
  }
};
