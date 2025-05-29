const express = require("express");
const multer = require("multer");
const tempDataController = require("../controllers/tempDataController");

const upload = multer({ storage: multer.memoryStorage() });
const tempDataRoutes = express.Router();

tempDataRoutes.post("/", upload.single("file"), tempDataController.uploadFile);
tempDataRoutes.get("/", tempDataController.listUploads);
tempDataRoutes.get("/data", tempDataController.getData);
tempDataRoutes.delete("/", tempDataController.deleteUpload);

module.exports = tempDataRoutes;
