// DataAnalysisLocal.js
/**
 * Helpers to fetch overlay data for ARA and JNR.
 *
 * You must pass in a `user` object that has:
 *   - API  (e.g. "http://localhost:4000")
 *   - user.token       (JWT string, e.g. "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
 *
 * Then, inside your component, do:
 *
 *   const { user } = useContext(UserContext);
 *   useEffect(() => {
 *     fetchAraOverlayData(user, bagDate, charcodeId).then(...);
 *   }, [user, bagDate, charcodeId]);
 *
 * and similarly for `fetchJnrOverlayData`.
 */
import { API } from '../config/api';

export async function fetchAraOverlayData(user, bagDate, charcodeId) {
  const result = {
    temps1: [],
    temps2: [],
    faults: [],
    ebcHistory: [],
  };

  if (!user || !API || !user.token || !bagDate) {
    return result;
  }

  try {
    // --- (a) Fetch temperature uploads from /tempData ---
    const dataRes = await fetch(`${API}/tempData`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    });
    if (!dataRes.ok) {
      throw new Error(`TempData fetch failed: ${dataRes.status}`);
    }
    const dataJson = await dataRes.json();
    // New API shape: { success: true, data: { uploads: [...] } }
    const dataDocs = Array.isArray(dataJson.data?.uploads)
      ? dataJson.data.uploads
      : [];

    // Flatten all “row” objects across those monthly buckets
    const allTempRows = dataDocs.flatMap((doc) => doc.data || []);

    // For ARA, we look at “Reactor 1 Temperature (°C)” and “Reactor 2 Temperature (°C)”
    const rawTemps1 = [];
    const rawTemps2 = [];

    allTempRows.forEach((row) => {
      // row.timestamp format: "YYYY-MM-DD HH:MM:SS"
      const [datePart = '', timePart = ''] = String(row.timestamp || '').split(' ');
      if (datePart !== bagDate) return;

      const t1 = parseFloat(row['Reactor 1 Temperature (°C)']);
      const t2 = parseFloat(row['Reactor 2 Temperature (°C)']);
      if (!isNaN(t1)) rawTemps1.push({ time: timePart, temp: t1 });
      if (!isNaN(t2)) rawTemps2.push({ time: timePart, temp: t2 });
    });

    rawTemps1.sort((a, b) => a.time.localeCompare(b.time));
    rawTemps2.sort((a, b) => a.time.localeCompare(b.time));
    result.temps1 = rawTemps1;
    result.temps2 = rawTemps2;

    // --- (b) Fetch form‐upload faults from /forms endpoint ---
    const formRes = await fetch(`${API}/forms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    });
    if (!formRes.ok) {
      throw new Error(`Forms fetch failed: ${formRes.status}`);
    }
    const formJson = await formRes.json();
    // New API shape: raw array of { filename, filetype, data: [...] }
    const formDocs = Array.isArray(formJson) ? formJson : [];

    const thisDayFaults = [];
    formDocs.forEach((doc) => {
      (doc.data || []).forEach((row) => {
        const [year = '', dd = '', mm = ''] = String(row.Date || '').split('-');
        const iso = `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        if (iso !== bagDate) return;

        const msg = row['P500 Fault Message(s)'];
        if (msg && !['', '0', 'N/A', 'None'].includes(msg.trim())) {
          thisDayFaults.push({ date: row.Date, message: msg });
        }
      });
    });
    result.faults = thisDayFaults;

    // --- (c) Fetch EBC status history from the new per-site endpoint ---
    const ebcRes = await fetch(
      `${API}/ebc/statuses/ara`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      }
    );
    if (!ebcRes.ok) {
      throw new Error(`EBC fetch failed: ${ebcRes.status}`);
    }
    const ebcJson = await ebcRes.json();
    // Now the flat route returns { success: true, data: [ { site, charcodeId, date, time, status, reason }, … ] }
    const statuses = Array.isArray(ebcJson.data) ? ebcJson.data : [];

    // Filter for this charcodeId
    const historyRows = statuses
      .filter((row) => String(row.charcodeId || '').trim() === charcodeId)
      .map((row) => ({
        date: row.date,
        time: row.time,
        status: row.status,
        reason: row.reason,
      }))
      .sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return a.time.localeCompare(b.time);
      });

    result.ebcHistory = historyRows;

    return result;
  } catch (err) {
    console.error('fetchAraOverlayData error:', err);
    return result;
  }
}

export async function fetchJnrOverlayData(user, bagDate, charcodeId) {
  const result = {
    temps1: [],
    temps2: [],
    faults: [],
    ebcHistory: [],
  };

  if (!user || !API || !user.token || !bagDate) {
    return result;
  }

  try {
    // --- (a) Fetch temperature uploads (JNR) from /tempData ---
    const dataRes = await fetch(`${API}/tempData`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    });
    if (!dataRes.ok) {
      throw new Error(`TempData fetch failed: ${dataRes.status}`);
    }
    const dataJson = await dataRes.json();
    const dataDocs = Array.isArray(dataJson.data?.uploads)
      ? dataJson.data.uploads
      : [];

    const allTempRows = dataDocs.flatMap((doc) => doc.data || []);
    const rawTemps1 = [];
    const rawTemps2 = [];

    allTempRows.forEach((row) => {
      const [datePart = '', timePart = ''] = String(row.timestamp || '').split(' ');
      if (datePart !== bagDate) return;

      // For JNR we use the “T5 Pyrolysis Temperature (°C)”
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

    // --- (b) Fetch form‐upload faults for JNR from /forms ---
    const formRes = await fetch(`${API}/forms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    });
    if (!formRes.ok) {
      throw new Error(`Forms fetch failed: ${formRes.status}`);
    }
    const formJson = await formRes.json();
    const formDocs = Array.isArray(formJson) ? formJson : [];

    const thisDayFaults = [];
    formDocs.forEach((doc) => {
      (doc.data || []).forEach((row) => {
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

    const ebcRes = await fetch(
      `${API}/ebc/statuses/jnr`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      }
    );
    if (!ebcRes.ok) {
      throw new Error(`EBC fetch failed: ${ebcRes.status}`);
    }
    const ebcJson = await ebcRes.json();
    const statuses = Array.isArray(ebcJson.data) ? ebcJson.data : [];

    const historyRows = statuses
      .filter((row) => String(row.charcodeId || '').trim() === charcodeId)
      .map((row) => ({
        date: row.date,
        time: row.time,
        status: row.status,
        reason: row.reason,
      }))
      .sort((a, b) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return a.time.localeCompare(b.time);
      });

    result.ebcHistory = historyRows;

    return result;
  } catch (err) {
    console.error('fetchJnrOverlayData error:', err);
    return result;
  }
}
