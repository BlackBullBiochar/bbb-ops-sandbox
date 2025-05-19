const express = require('express');
const Stock = require('../models/stock');
const router = express.Router();

router.post('/', async (req, res) => {
  const stock = new Stock(req.body);
  await stock.save();
  res.send(stock);
});

router.get('/', async (req, res) => {
  const stocks = await Stock.find();
  res.send(stocks);
});

module.exports = router;
