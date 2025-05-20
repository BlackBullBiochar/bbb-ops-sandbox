const express = require('express');
const router = express.Router();
const EbcStatus = require('../models/EBCStatus');

// POST /api/ebcstatus/add
router.post('/add', async (req, res) => {
  const { site, charcodeId, status, reason, date, time } = req.body;

  if (!site || !charcodeId || !status || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newEntry = {
      charcodeId,
      'EBC Date': date,
      'EBC Time': time,
      'EBC Cert Status': status,
      'EBC Status Reason': reason || 'No reason provided'
    };

    const existing = await EbcStatus.findOne({ site });

    if (existing) {
      existing.data.push(newEntry);
      await existing.save();
    } else {
      const newDoc = new EbcStatus({
        site,
        data: [newEntry]
      });
      await newDoc.save();
    }

    res.json({ message: `EBC status recorded for site: ${site}` });
  } catch (err) {
    console.error(`🔥 Failed to save EBC status for ${site}:`, err);
    res.status(500).json({ error: 'Server error while saving EBC status' });
  }
});

router.get('/', async (req, res) => {
  try {
    const docs = await EbcStatus.find().lean();
    res.json(docs);
  } catch (err) {
    console.error('❌ Failed to fetch EBC status logs:', err);
    res.status(500).json({ error: 'Could not fetch EBC logs' });
  }
});

// PATCH /api/ebcstatus/append
router.patch('/append', async (req, res) => {
  const { site, charcodeId, status, reason } = req.body;

  if (!site || !charcodeId || !status) {
    return res.status(400).json({ error: 'Missing site, charcodeId, or status' });
  }

  const now = new Date();
  const ebcDate = now.toISOString().split('T')[0];
  const ebcTime = now.toTimeString().slice(0, 5).replace(':', '-');

  const newEntry = {
    'charcodeId': charcodeId,
    'EBC Date': ebcDate,
    'EBC Time': ebcTime,
    'EBC Cert Status': status,
    'EBC Status Reason': reason || ''
  };

  try {
    const result = await EbcStatus.findOneAndUpdate(
      { site },
      { $push: { data: newEntry } },
      { upsert: true, new: true }
    );

    res.json({ message: 'EBC status appended', updated: result });
  } catch (err) {
    console.error('🧨 EBC status append error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
