// DataAnalysisLocal.js

/**
 * Helpers to fetch & filter data for a single bagging date.
 * These do *not* touch Context; they only return a filtered result object.
 */

/**
 * Fetch + process ARA data for exactly one bagDate and charcodeId.
 * @param {string} bagDate    // "YYYY-MM-DD"
 * @param {string} charcodeId // e.g. "ABC123"
 * @returns {Promise<{ temps1: Array< { time:string, temp:number } >, temps2: Array< { time:string, temp:number } >, faults: Array<{ date:string, message:string }>, ebcHistory: Array<{ date:string, time:string, status:string, reason:string }> }>}
 */
export async function fetchAraOverlayData(bagDate, charcodeId) {
  // Default return shape
  const result = {
    temps1: [],
    temps2: [],
    faults: [],
    ebcHistory: [],
  };

  if (!bagDate) {
    return result;
  }

  try {
    // --- (a) Temperature data ---
    const dataRes = await fetch('http://localhost:5000/api/tempData');
    const dataJson = await dataRes.json();
    const dataDocs = dataJson.uploads || dataJson.data || dataJson;
    const allTempRows = dataDocs.flatMap((doc) => doc.data || []);

    const rawTemps1 = [];
    const rawTemps2 = [];

    allTempRows.forEach((row) => {
      // timestamp format assumed "YYYY-MM-DD HH:MM:SS"
      const [datePart = '', timePart = ''] = String(row.timestamp || '').split(' ');
      if (datePart !== bagDate) {
        return;
      }
      const t1 = parseFloat(row['Reactor 1 Temperature (°C)']);
      const t2 = parseFloat(row['Reactor 2 Temperature (°C)']);
      if (!isNaN(t1)) {
        rawTemps1.push({ time: timePart, temp: t1 });
      }
      if (!isNaN(t2)) {
        rawTemps2.push({ time: timePart, temp: t2 });
      }
    });

    rawTemps1.sort((a, b) => a.time.localeCompare(b.time));
    rawTemps2.sort((a, b) => a.time.localeCompare(b.time));
    result.temps1 = rawTemps1;
    result.temps2 = rawTemps2;

    // --- (b) Forms for ARA (fault messages) ---
    const formRes = await fetch('http://localhost:5000/api/forms');
    const formJson = await formRes.json();
    const formDocs = formJson.data || formJson.forms || formJson;

    const thisDayFaults = [];
    formDocs.forEach((doc) => {
      doc.data?.forEach((row) => {
        // Possible date format "YYYY-DD-MM" or "YYYY-MM-DD"
        // In the original code we assumed "YYYY-DD-MM", so we swap:
        const [year = '', dd = '', mm = ''] = String(row.Date || '').split('-');
        const iso = `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        if (iso !== bagDate) return;

        // ARA fault field
        const msg = row['P500 Fault Message(s)'];
        if (msg && !['', '0', 'N/A', 'None'].includes(msg.trim())) {
          thisDayFaults.push({ date: row.Date, message: msg });
        }
      });
    });
    result.faults = thisDayFaults;

    // --- (c) EBC status history for ARA ---
    const ebcRes = await fetch('http://localhost:5000/api/ebcstatus');
    const ebcJson = await ebcRes.json();
    const ebcDocs = ebcJson.sites || [];

    const siteDoc = ebcDocs.find((d) => d.site.toLowerCase() === 'ara');
    if (siteDoc) {
      const historyRows = siteDoc.data
        .filter((row) => String(row.charcodeId || '').trim() === charcodeId)
        .map((row) => ({
          date: row['EBC Date'],
          time: row['EBC Time'],
          status: row['EBC Cert Status'],
          reason: row['EBC Status Reason'],
        }));

      historyRows.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return a.time.localeCompare(b.time);
      });
      result.ebcHistory = historyRows;
    }

    return result;
  } catch (err) {
    console.error('fetchAraOverlayData error:', err);
    return result;
  }
}

/**
 * Fetch + process JNR data for exactly one bagDate and charcodeId.
 * @param {string} bagDate
 * @param {string} charcodeId
 * @returns {Promise<{ temps1: Array<{ time:string, temp:number }>, temps2: Array<{ time:string, temp:number }>, faults: Array<{ date:string, message:string }>, ebcHistory: Array<{ date:string, time:string, status:string, reason:string }> }>}
 */
export async function fetchJnrOverlayData(bagDate, charcodeId) {
  const result = {
    temps1: [],
    temps2: [],
    faults: [],
    ebcHistory: [],
  };

  if (!bagDate) {
    return result;
  }

  try {
    // --- (a) Temperature data for JNR ("T5 Pyrolysis Temperature (°C)") ---
    const dataRes = await fetch('http://localhost:5000/api/tempData');
    const dataJson = await dataRes.json();
    const dataDocs = dataJson.uploads || dataJson.data || dataJson;
    const allTempRows = dataDocs.flatMap((doc) => doc.data || []);

    const rawTemps1 = [];
    const rawTemps2 = [];

    allTempRows.forEach((row) => {
      const [datePart = '', timePart = ''] = String(row.timestamp || '').split(' ');
      if (datePart !== bagDate) return;

      const t5 = parseFloat(row['T5 Pyrolysis Temperature (°C)']);
      if (!isNaN(t5)) {
        rawTemps1.push({ time: timePart, temp: t5 });
        rawTemps2.push({ time: timePart, temp: t5 });
      }
    });

    rawTemps1.sort((a, b) => a.time.localeCompare(b.time));
    rawTemps2.sort((a, b) => a.time.localeCompare(b.time));
    result.temps1 = rawTemps1;
    result.temps2 = rawTemps2;

    // --- (b) Forms for JNR (fault messages) ---
    const formRes = await fetch('http://localhost:5000/api/forms');
    const formJson = await formRes.json();
    const formDocs = formJson.data || formJson.forms || formJson;

    const thisDayFaults = [];
    formDocs.forEach((doc) => {
      doc.data?.forEach((row) => {
        // Again assume "YYYY-DD-MM" → swap to "YYYY-MM-DD"
        const [year = '', dd = '', mm = ''] = String(row.Date || '').split('-');
        const iso = `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        if (iso !== bagDate) return;

        const msg = row['C500-I Fault Messages'];
        if (
          msg &&
          !['', '0', 'N/A', 'None', 'clear', 'CLEAR', 'n/a'].includes(msg.trim())
        ) {
          thisDayFaults.push({ date: row.Date, message: msg });
        }
      });
    });
    result.faults = thisDayFaults;

    // --- (c) EBC status history for JNR ---
    const ebcRes = await fetch('http://localhost:5000/api/ebcstatus');
    const ebcJson = await ebcRes.json();
    const ebcDocs = ebcJson.sites || [];

    const siteDoc = ebcDocs.find((d) => d.site.toLowerCase() === 'jnr');
    if (siteDoc) {
      const historyRows = siteDoc.data
        .filter((row) => String(row.charcodeId || '').trim() === charcodeId)
        .map((row) => ({
          date: row['EBC Date'],
          time: row['EBC Time'],
          status: row['EBC Cert Status'],
          reason: row['EBC Status Reason'],
        }));

      historyRows.sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return a.time.localeCompare(b.time);
      });
      result.ebcHistory = historyRows;
    }

    return result;
  } catch (err) {
    console.error('fetchJnrOverlayData error:', err);
    return result;
  }
}
