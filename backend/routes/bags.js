const express = require("express");
const bagController = require("../controllers/bagController");
const { verifyToken } = require("../middleware/auth");

const bagRoutes = express.Router();

bagRoutes.post("/new", verifyToken, bagController.newCharcodes);
bagRoutes.put("/:charcode", verifyToken, bagController.updateBagByCharcode);
bagRoutes.get("/:charcodeId", verifyToken, bagController.getBag);
bagRoutes.get("/", verifyToken, bagController.getBags);
bagRoutes.put("/status/update", verifyToken, bagController.updateBagsStatus);

module.exports = bagRoutes;