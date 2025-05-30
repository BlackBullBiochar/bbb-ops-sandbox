// controllers/ebcStatusController.js
const db = require("../models/index");
const {
  successResponse,
  successResponseCreated,
  errorResponseHandler,
} = require("../Helpers");

const ebcStatusController = {};

// silent trampoline so we don’t touch the real res
ebcStatusController.backfillStatusesSilently = async () => {
  const fakeRes = { json: () => {}, status: () => fakeRes, send: () => {} };
  await ebcStatusController.backfillStatuses(null, fakeRes);
};

async function getLatestStatusMap() {
  const map = {};
  const docs = await db.EbcStatus.find().lean();
  for (const doc of docs) {
    for (const entry of doc.data || []) {
      // later entries overwrite earlier → ends up with most recent
      map[entry.charcodeId] = entry["EBC Cert Status"];
    }
  }
  return map;
}

async function getTempDataBySiteAndDate() {
  const tempDocs = await db.TempData.find().lean();
  const result   = { ara: {}, jnr: {} };

  for (const doc of tempDocs) {
    const fn   = (doc.site||"").toLowerCase();
    const site = fn.includes("ara") ? "ara"
               : fn.includes("jnr") ? "jnr"
               : null;
    if (!site) continue;

    for (const row of doc.data||[]) {
      const raw       = String(row.timestamp||"").trim();
      if (!raw) continue;

      // Pull off the date part (before any whitespace)
      const dateOnly  = raw.split(/\s+/)[0]; // e.g. "2025-05-06" or "06/05/2025"

      let iso;
      if (dateOnly.includes("/")) {
        // European style DD/MM/YYYY
        const [d,m,y] = dateOnly.split("/");
        if ([d,m,y].some(x=>!x)) continue;
        iso = `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
      } else if (dateOnly.includes("-")) {
        // Already ISO
        iso = dateOnly;
      } else {
        continue;
      }
      // now collect temps as before
      const temps = [];
      if (site === "ara") {
        const t1 = parseFloat(row["Reactor 1 Temperature (°C)"]);
        const t2 = parseFloat(row["Reactor 2 Temperature (°C)"]);
        if (!isNaN(t1)) temps.push(t1);
        if (!isNaN(t2)) temps.push(t2);
      } else {
        const t5 = parseFloat(row["T5 Pyrolysis Temperature (°C)"]);
        if (!isNaN(t5)) temps.push(t5);
      }
      result[site][iso] = (result[site][iso]||[]).concat(temps);
      
    }
  }
  
  return result;
}


function evaluateEBC(temps) {
  if (!temps || !temps.length) {
    return {
      status: "Pending",
      reason: "No temperature data found for date"
    };
  }
  const allInSpec = temps.every(t => t >= 520 && t <= 780);
  return allInSpec
    ? { status: "Approved", reason: "All temperatures in spec" }
    : { status: "Flagged",  reason: "One or more temperatures out of spec" };
}

ebcStatusController.backfillStatuses = async (req, res) => {
  try {
    const tempMap   = await getTempDataBySiteAndDate();
    const latestMap = await getLatestStatusMap();
    const bags      = await db.Bags.find();
    let   added     = 0;

    for (const bag of bags) {
      const code = bag.charcode;
      if (!code) continue;

      // resolve site name
      let site = null;
      if (bag._site) {
        const sd = await db.Site.findById(bag._site).lean();
        site = sd?.name?.toLowerCase();
      }
      if (!site) continue;

      const latestStatus = latestMap[code];
      if (latestStatus === "Approved" || latestStatus === "Flagged") {
        // final, skip
        continue;
      }

      // decide on bagging date
      const date  = bag.bagging_date.toISOString().slice(0,10);
      const temps = tempMap[site]?.[date] || [];
      const { status, reason } = evaluateEBC(temps);

      // if still Pending and we already had a Pending → skip
      if (status === "Pending" && latestStatus === "Pending") {
        continue;
      }

      // push new entry (could be first Pending, or Approved/Flagged now)
      const now = new Date();
      const entry = {
        bagId:            bag._id,
        charcodeId:       code,
        "EBC Date":       now.toISOString().slice(0,10),
        "EBC Time":       now.toTimeString().slice(0,5),
        "EBC Cert Status": status,
        "EBC Status Reason": reason
      };

      await db.EbcStatus.findOneAndUpdate(
        { site },
        { $push: { data: entry } },
        { upsert: true }
      );
      added++;
    }

    return successResponseCreated(res, {
      message: `Backfill complete, ${added} new entries`
    });

  } catch (err) {
    console.error("Backfill error:", err);
    return errorResponseHandler(err, res);
  }
};

ebcStatusController.updatePendingStatuses = async (req, res) => {
  try {
    const tempMap = await getTempDataBySiteAndDate();
    const docs    = await db.EbcStatus.find();
    let updated   = 0;

    for (const doc of docs) {
      const site = doc.site;
      for (const entr of doc.data || []) {
        if (entr["EBC Cert Status"] !== "Pending") continue;
        const date = entr["EBC Date"];
        const temps = tempMap[site]?.[date] || [];
        if (!temps.length) continue;

        const { status, reason } = evaluateEBC(temps);
        if (status === "Pending") continue;

        // push the new (now-final) entry
        const now = new Date();
        await db.EbcStatus.findOneAndUpdate(
          { site },
          {
            $push: {
              data: {
                bagId:            entr.bagId,
                charcodeId:       entr.charcodeId,
                "EBC Date":       now.toISOString().slice(0,10),
                "EBC Time":       now.toTimeString().slice(0,5),
                "EBC Cert Status": status,
                "EBC Status Reason": reason
              }
            }
          },
          { upsert: true }
        );
        updated++;
      }
    }

    return successResponse(res, {
      message: `Pending statuses updated: ${updated}`
    });

  } catch (err) {
    console.error("Update-pending error:", err);
    return errorResponseHandler(err, res);
  }
};

ebcStatusController.getFileData = async (req, res) => {
  try {
    const fn  = decodeURIComponent(req.params.filename);
    const doc = await db.TempData.findOne({ filename: fn }).lean();
    if (!doc) return res.status(404).json({ error: "File not found" });
    return successResponse(res, doc.data);
  } catch (err) {
    console.error("Get file data error:", err);
    return errorResponseHandler(err, res);
  }
};

ebcStatusController.deleteUpload = async (req, res) => {
  try {
    const fn = decodeURIComponent(req.params.filename);
    const { deletedCount } = await db.TempData.deleteOne({ filename: fn });
    return successResponse(res, { deletedCount });
  } catch (err) {
    console.error("Delete upload error:", err);
    return errorResponseHandler(err, res);
  }
};

ebcStatusController.listAllStatuses = async (req, res) => {
  try {
    const docs = await db.EbcStatus.find().lean();
    return successResponse(res, { sites: docs });
  } catch (err) {
    return errorResponseHandler(err, res);
  }
};

ebcStatusController.getStatusesForSite = async (req, res) => {
  try {
    const site = req.params.site.toLowerCase();
    const doc  = await db.EbcStatus.findOne({ site }).lean();
    if (!doc) return res.status(404).json({ error: "Site not found" });
    return successResponse(res, doc.data);
  } catch (err) {
    return errorResponseHandler(err, res);
  }
};

ebcStatusController.addStatus = async (req, res) => {
  try {
    const { site, charcodeId, date, time, status, reason } = req.body;
    if (!site || !charcodeId || !date || !time || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const entry = {
      charcodeId,
      "EBC Date":         date,
      "EBC Time":         time,
      "EBC Cert Status":  status,
      "EBC Status Reason": reason || ""
    };
    await db.EbcStatus.findOneAndUpdate(
      { site },
      { $push: { data: entry } },
      { upsert: true }
    );
    return successResponseCreated(res, { message: "Status added", entry });
  } catch (err) {
    return errorResponseHandler(err, res);
  }
};

ebcStatusController.appendStatus = async (req, res) => {
  try {
    const { site, charcodeId, status, reason } = req.body;
    if (!site || !charcodeId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const now = new Date();
    const entry = {
      charcodeId,
      "EBC Date":         now.toISOString().slice(0,10),
      "EBC Time":         now.toTimeString().slice(0,5),
      "EBC Cert Status":  status,
      "EBC Status Reason": reason || ""
    };
    const updated = await db.EbcStatus.findOneAndUpdate(
      { site },
      { $push: { data: entry } },
      { upsert: true, new: true }
    );
    return successResponse(res, { message: "Status appended", updated });
  } catch (err) {
    return errorResponseHandler(err, res);
  }
};

ebcStatusController.listStatuses = async (req, res) => {
  try {
    const docs = await db.EbcStatus.find().lean();
    return successResponse(res, docs);
  } catch (err) {
    console.error('❌ Failed to fetch EBC statuses:', err);
    return errorResponseHandler(err, res);
  }
};

module.exports = ebcStatusController;
