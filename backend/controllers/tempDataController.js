const db = require("../models/index");
const ebcStatusController = require("./ebcStatusController");
const path = require("path");
const csv = require("csv-parser");
const { Readable } = require("stream");
const {
  successResponseCreated,
  successResponse,
  errorResponseHandler,
} = require("../Helpers");

// Map German headers → English field names
const headerMap = {
  time: "timestamp",
  timestamp: "timestamp",
  "abgasgebläse_1_geschwindigkeit (%)": "Exhaust Fan 1 Speed (%)",
  "abgasgebläse_2_geschwindigkeit (%)": "Exhaust Fan 2 Speed (%)",
  "unterdruck_reaktor_1 (pa)": "Vacuum Reactor 1 (pa)",
  "unterdruck_reaktor_2 (pa)": "Vacuum Reactor 2 (pa)",
  "temperatur_zyklon ( c)": "Cyclone Temperature (°c)",
  "temperatur_abgas_vor_bomat (°c)": "Exhaust Temp Pre Bomat (°c)",
  "abgasventilator1 (%)": "Exhaust Fan 1 (%)",
  "abgasventilator2 (%)": "Exhaust Fan 2 (%)",
  "agr (%)": "AGR (%)",
  "temperatur_reaktor_1 ( c)": "Reactor 1 Temperature (°C)",
  "temperatur_reaktor_2 ( c)": "Reactor 2 Temperature (°C)",
  "abgastemperatur_1 ( c)": "Exhaust Gas Temperature 1 (°C)",
  "abgastemperatur_2 ( c)": "Exhaust Gas Temperature 2 (°C)",
  "prozess.sensor.temp.t5": "T5 Pyrolysis Temperature (°C)",
  "temperatur_pyrolysegas ( c)": "Pyrolysis Gas Temperature (°C)",
};

const cleanString = (s) =>
  String(s)
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tempDataController = {};

// Upload CSV or JSON and bucket into monthly docs by site/year/month
tempDataController.uploadFile = async (req, res) => {
  try {
    if (!req.file) throw new Error("No file uploaded");
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = (req.body.customName || req.file.originalname)
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9-_.]/g, "");

    const processRows = async (rows) => {
      // bucket rows by site/year/month
      const buckets = {};
      rows.forEach((row) => {
        const fn = filename.toLowerCase();
        const site = fn.includes("_ara_")
          ? "ara"
          : fn.includes("_jnr_")
          ? "jnr"
          : null;
        if (!site || !row.timestamp) return;
        const ts = new Date(row.timestamp);
        if (isNaN(ts)) return;
        const year = ts.getFullYear();
        const month = ts.getMonth() + 1;
        const key = `${site}|${year}|${month}`;
        if (!buckets[key]) buckets[key] = { site, year, month, rows: [] };
        buckets[key].rows.push(row);
      });

      // upsert each bucket
      await Promise.all(
        Object.values(buckets).map(async ({ site, year, month, rows }) => {
          await db.TempData.findOneAndUpdate(
            { site, year, month },
            {
              $push: { data: { $each: rows } },
              $set: { updated: new Date() },
              $setOnInsert: { created: new Date(), filetype: ext.slice(1) },
            },
            { upsert: true }
          );
        })
      );

      successResponseCreated(res, {
        message: `Saved ${rows.length} rows into ${Object.keys(buckets).length} month-docs`,
      });

      // background backfill
      ebcStatusController.backfillStatusesSilently().catch(console.error);
    };

    if (ext === ".csv") {
      const rows = [];
      Readable.from(req.file.buffer)
        .pipe(csv())
        .on("data", (raw) => {
          const obj = {};
          for (const k in raw) {
            const key = cleanString(k.toLowerCase());
            obj[headerMap[key] || key] = cleanString(raw[k]);
          }
          rows.push(obj);
        })
        .on("end", () => processRows(rows))
        .on("error", (err) => {
          console.error("CSV parse error:", err);
          errorResponseHandler(err, res);
        });
    } else if (ext === ".json") {
      const json = JSON.parse(req.file.buffer.toString("utf8"));
      const rows = Array.isArray(json) ? json : [json];
      await processRows(rows);
    } else {
      throw new Error("Only .csv or .json supported");
    }
  } catch (err) {
    console.error("Upload error:", err);
    errorResponseHandler(err, res);
  }
};

// list all monthly docs
tempDataController.listUploads = async (req, res) => {
  try {
    const docs = await db.TempData.find().sort({ created: -1 }).lean();
    successResponse(res, { uploads: docs });
  } catch (err) {
    console.error("Fetch error:", err);
    errorResponseHandler(err, res);
  }
};

// fetch one month doc by query params (site, year, month)
tempDataController.getData = async (req, res) => {
  try {
    const { site, year, month } = req.query;
    const doc = await db.TempData.findOne({ site, year: +year, month: +month }).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    successResponse(res, { data: doc.data });
  } catch (err) {
    console.error("Fetch rows error:", err);
    errorResponseHandler(err, res);
  }
};

// delete one month doc by query params
tempDataController.deleteUpload = async (req, res) => {
  try {
    const { site, year, month } = req.query;
    const { deletedCount } = await db.TempData.deleteOne({ site, year: +year, month: +month });
    successResponse(res, { deletedCount });
  } catch (err) {
    console.error("Delete error:", err);
    errorResponseHandler(err, res);
  }
};

module.exports = tempDataController;
