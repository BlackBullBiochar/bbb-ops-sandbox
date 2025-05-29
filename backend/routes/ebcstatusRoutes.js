const express = require("express");
const ebcStatusController = require("../controllers/ebcStatusController");

const ebcstatusRoutes = express.Router();

ebcstatusRoutes.post('/backfill', ebcStatusController.backfillStatuses);
ebcstatusRoutes.patch('/update-pending', ebcStatusController.updatePendingStatuses);
ebcstatusRoutes.get('/data/by-file/:filename', ebcStatusController.getFileData);
ebcstatusRoutes.delete('/data/by-file/:filename', ebcStatusController.deleteUpload);
ebcstatusRoutes.get("/", ebcStatusController.listAllStatuses);
ebcstatusRoutes.get("/:site", ebcStatusController.getStatusesForSite);
ebcstatusRoutes.post("/add", ebcStatusController.addStatus);
ebcstatusRoutes.patch("/append", ebcStatusController.appendStatus);

module.exports = ebcstatusRoutes;
