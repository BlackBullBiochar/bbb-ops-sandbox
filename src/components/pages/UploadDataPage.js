// UploadDataPage.jsx
import React, { useEffect, useState, useContext } from "react";
import styles from "./UploadDataPage.module.css";
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from "../ModuleMain.js";
import { UserContext } from "../../UserContext.js";

const UploadedDataPage = () => {
  const { user } = useContext(UserContext);

  // State for tempData buckets vs. form buckets, both keyed by "site-year-month"
  const [tempBuckets, setTempBuckets] = useState({});
  const [formBuckets, setFormBuckets] = useState({});

  // Which buckets are expanded
  const [expanded, setExpanded] = useState([]);

  // Cache of fetched rows for each bucket
  const [rowsCache, setRowsCache] = useState({});

  useEffect(() => {
    if (!user.token || !user.backEndURL) return;

    // 1) Fetch tempData buckets
    fetch(`${user.backEndURL}/tempData`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((json) => {
        // Expect: { success: true, data: { uploads: [ { site, year, month, data: [...] }, … ] } }
        const uploads = (json.data && json.data.uploads) || [];
        const m = {};
        uploads.forEach((doc) => {
          const key = `${doc.site}-${doc.year}-${doc.month}`;
          m[key] = doc;
        });
        setTempBuckets(m);
      })
      .catch((err) => {
        console.error("TempData fetch error:", err);
      });

    // 2) Fetch form-data buckets (now grouped by site/year/month)
    fetch(`${user.backEndURL}/forms`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((json) => {
        let uploads = Array.isArray(json) ? json : null;
        if (!uploads && json.data && Array.isArray(json.data)) {
          uploads = json.data;
        }
        const m = {};
        uploads.forEach((doc) => {
          const key = `${doc.site}-${doc.year}-${doc.month}`;
          m[key] = doc;
        });
        setFormBuckets(m);
      })
      .catch((err) => {
        console.error("Forms fetch error:", err);
      });
  }, [user.token, user.backEndURL]);

  // Toggle expansion for a bucket; fetch detailed rows on first expand
  const toggle = async (source, type) => {
    if (!user.token || !user.backEndURL) return;

    if (!expanded.includes(source)) {
      // First time expanding: fetch rows
      const [site, year, month] = source.split("-");
      let url;
      if (type === "data") {
        url = `${user.backEndURL}/tempData/data?site=${site}&year=${year}&month=${month}`;
      } else {
        url = `${user.backEndURL}/forms/data?site=${site}&year=${year}&month=${month}`;
      }

      try {
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        });
        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}`);
        }
        const payload = await res.json();
        // Both endpoints return { success: true, data: { data: [...] } }
        const dataRows = (payload.data && Array.isArray(payload.data.data))
          ? payload.data.data
          : [];
        setRowsCache((prev) => ({ ...prev, [source]: dataRows }));
      } catch (err) {
        console.error(`${type} toggle fetch failed:`, err);
      }
    }

    setExpanded((list) =>
      list.includes(source) ? list.filter((x) => x !== source) : [...list, source]
    );
  };

  // Delete a bucket (tempData or forms)
  const handleDelete = async (source, type) => {
    if (!window.confirm(`Delete all ${type} for "${source}"?`)) return;
    if (!user.token || !user.backEndURL) return;

    const [site, year, month] = source.split("-");
    let url;
    if (type === "data") {
      url = `${user.backEndURL}/tempData?site=${site}&year=${year}&month=${month}`;
    } else {
      url = `${user.backEndURL}/forms?site=${site}&year=${year}&month=${month}`;
    }

    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status} ${res.statusText}`);
      }

      if (type === "data") {
        setTempBuckets((prev) => {
          const copy = { ...prev };
          delete copy[source];
          return copy;
        });
      } else {
        setFormBuckets((prev) => {
          const copy = { ...prev };
          delete copy[source];
          return copy;
        });
      }
      setExpanded((list) => list.filter((x) => x !== source));
      setRowsCache((prev) => {
        const copy = { ...prev };
        delete copy[source];
        return copy;
      });
    } catch (err) {
      console.error(`${type} delete error:`, err);
    }
  };

  // Render one bucket (either tempData or forms)
  const renderTable = (source, summary, type) => {
    const isOpen = expanded.includes(source);
    const cachedRows = rowsCache[source] ?? [];
    // Until expanded, we show only summary.data for tempData; for forms we show nothing until expanded
    const fallbackRows =
      type === "data" && Array.isArray(summary.data) ? summary.data : [];
    const rows = cachedRows.length > 0 ? cachedRows : fallbackRows;

    const headers = rows.length
      ? Object.keys(rows[0]).filter((k) => k !== "_id" && k !== "__v")
      : [];

    return (
      <div
        key={`${type}-${source}`}
        style={{
          marginBottom: "1rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
          padding: "1rem",
        }}
      >
        <div
          className={styles.detailsRowSectionHeader}
          onClick={() => toggle(source, type)}
          style={{
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <strong>{source}</strong> &nbsp;|&nbsp;{" "}
            {type === "data"
              ? `Updated: ${new Date(summary.updated || summary.created).toLocaleString()}`
              : `Updated: ${new Date(summary.uploadDate || summary.created).toLocaleString()}`}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(source, type);
            }}
            style={{
              backgroundColor: "red",
              color: "white",
              border: "none",
              padding: "0.4rem 0.8rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>

        {isOpen && (
          <table
            border="1"
            cellPadding="8"
            style={{
              width: "100%",
              fontSize: "1rem",
              marginTop: "0.5rem",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                {headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {headers.map((h) => (
                    <td key={h}>{String(row[h])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div className={styles.mainWhiteContainer} style={{ padding: 0, margin: 0 }}>
      <ScreenHeader name="Uploaded Data" />
      <ModuleMain>
        {/* ‒‒‒ TEMP DATA UPLOADS SECTION ‒‒‒ */}
        <div style={{ marginBottom: "2rem" }}>
          <h3>Data Uploads</h3>
          {Object.entries(tempBuckets).length > 0 ? (
            Object.entries(tempBuckets).map(([key, bucket]) =>
              renderTable(key, bucket, "data")
            )
          ) : (
            <p>No data uploads found.</p>
          )}
        </div>

        {/* ‒‒‒ FORM DATA UPLOADS SECTION ‒‒‒ */}
        <div style={{ marginBottom: "2rem" }}>
          <h3>Form Uploads</h3>
          {Object.entries(formBuckets).length > 0 ? (
            Object.entries(formBuckets).map(([key, bucket]) =>
              renderTable(key, bucket, "forms")
            )
          ) : (
            <p>No form uploads found.</p>
          )}
        </div>
      </ModuleMain>
    </div>
  );
};

export default UploadedDataPage;
