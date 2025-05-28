const express = require("express");
const siteController = require("../controllers/siteController");
const { verifyToken } = require("../middleware/auth");

const siteRoutes = express.Router();

siteRoutes.post("/new", verifyToken, siteController.createSite);
siteRoutes.get("/", verifyToken, siteController.getSites);
siteRoutes.get("/:siteName/bags", verifyToken, siteController.getBagsBySiteAndDate);


module.exports = siteRoutes;