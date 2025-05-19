const express = require('express');
const Check = require('../models/check');
const router = express.Router();

router.post('/', async (req, res) => {
  const check = new Check(req.body);
  await check.save();
  res.send(check);
});

router.get('/', async (req, res) => {
  const checks = await Check.find();
  res.send(checks);
});

module.exports = router;
