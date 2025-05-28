const PlantData = require("../models/PlantData");
const Site = require("../models/Site");
const multer = require("multer");
const csv = require("csv-parser");
const path = require("path");
const { Readable } = require("stream");

const upload = multer({ storage: multer.memoryStorage() });

const headerMap = {
  'time': 'timestamp',
  'timestamp': 'timestamp',
  'prozess.sensor.temp.t5': 'T5 Pyrolysis Temperature (°C)',
  'temperatur_reaktor_1 ( c)': 'Reactor 1 Temperature (°C)',
  'temperatur_reaktor_2 ( c)': 'Reactor 2 Temperature (°C)',
  'abgastemperatur_1 ( c)': 'Exhaust Gas Temperature 1 (°C)',
  'abgastemperatur_2 ( c)': 'Exhaust Gas Temperature 2 (°C)',
  'temperatur_pyrolysegas ( c)': 'Pyrolysis Gas Temperature (°C)',
};

const cleanString = (s) =>
  String(s).replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();

const plantDataController = {};

// POST /api/tempdata
plantDataController.upload = [
  upload.single("file"),
  async (req, res) => {
    const { site } = req.body;

    if (!req.file || !site) {
      return res.status(400).json({ error: "Missing file or site" });
    }

    // Validate the site ID
    const siteExists = await Site.exists({ _id: site });
    if (!siteExists) {
      return res.status(404).json({ error: "Site ID not found" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = (req.body.customName || req.file.originalname)
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9-_.]/g, "");

    try {
      if (ext === ".csv") {
        const rows = [];
        Readable.from(req.file.buffer)
          .pipe(csv())
          .on("data", (rawRow) => {
            const translated = {};
            for (const rawKey in rawRow) {
              const cleanKey = cleanString(rawKey.toLowerCase());
              const mappedKey = headerMap[cleanKey] || cleanKey;
              translated[mappedKey] = cleanString(rawRow[rawKey]);
            }
            rows.push(translated);
          })
          .on("end", async () => {
            const doc = new PlantData({
              filename,
              filetype: "csv",
              site,
              data: rows,
            });
            await doc.save();
            res.json({ message: "CSV saved", count: rows.length });
          });
      } else if (ext === ".json") {
        const json = JSON.parse(req.file.buffer.toString("utf8"));
        const rows = Array.isArray(json) ? json : [json];
        const doc = new PlantData({
          filename,
          filetype: "json",
          site,
          data: rows,
        });
        await doc.save();
        res.json({ message: "JSON saved", count: rows.length });
      } else {
        res.status(400).json({ error: "Only .csv or .json supported" });
      }
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Failed to process upload" });
    }
  },
];

// GET /api/tempdata
plantDataController.listAll = async (req, res) => {
  try {
    const docs = await PlantData.find().sort({ uploadDate: -1 }).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Fetch error" });
  }
};

// GET /api/tempdata/data/by-file/:filename
plantDataController.getByFilename = async (req, res) => {
  try {
    const fn = decodeURIComponent(req.params.filename);
    const doc = await PlantData.findOne({ filename: fn }).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc.data);
  } catch (err) {
    res.status(500).json({ error: "Fetch error" });
  }
};

// DELETE /api/tempdata/data/by-file/:filename
plantDataController.deleteByFilename = async (req, res) => {
  try {
    const fn = decodeURIComponent(req.params.filename);
    const result = await PlantData.deleteOne({ filename: fn });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};

module.exports = plantDataController;
