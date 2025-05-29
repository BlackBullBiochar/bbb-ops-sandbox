import React, { useEffect, useState } from 'react';
import styles from './UploadDataPage.module.css';
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from '../ModuleMain.js';

const UploadedDataPage = () => {
  const [tempBuckets, setTempBuckets] = useState({});
  const [formBuckets, setFormBuckets] = useState({});
  const [expanded, setExpanded] = useState([]);
  const [rowsCache, setRowsCache] = useState({});

  useEffect(() => {
    fetch('http://localhost:5000/api/tempData')
      .then(r => r.json())
      .then(({ uploads }) => {
        const m = {};
        uploads.forEach(doc => {
          const key = `${doc.site}-${doc.year}-${doc.month}`;
          m[key] = doc;
        });
        setTempBuckets(m);
      })
      .catch(console.error);

    fetch('http://localhost:5000/api/forms')
      .then(r => r.json())
      .then(docs => {
        const m = {};
        docs.forEach(doc => { m[doc.filename] = doc; });
        setFormBuckets(m);
      })
      .catch(console.error);
  }, []);

  const toggle = async (source, type) => {
    if (!expanded.includes(source)) {
      let url;
      if (type === 'data') {
        const [site, year, month] = source.split('-');
        url = `http://localhost:5000/api/tempData/data?site=${site}&year=${year}&month=${month}`;
      } else {
        url = `http://localhost:5000/api/forms/data/by-file/${encodeURIComponent(source)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const payload = await res.json();
        const data = payload.data ?? payload;
        setRowsCache(prev => ({ ...prev, [source]: data }));
      }
    }
    setExpanded(xs => xs.includes(source) ? xs.filter(x => x !== source) : [...xs, source]);
  };

  const handleDelete = async (source, type) => {
    if (!window.confirm(`Delete all ${type} from "${source}"?`)) return;
    let url, opts = { method: 'DELETE' };
    if (type === 'data') {
      const [site, year, month] = source.split('-');
      url = `http://localhost:5000/api/tempData?site=${site}&year=${year}&month=${month}`;
    } else {
      url = `http://localhost:5000/api/forms/data/by-file/${encodeURIComponent(source)}`;
    }
    const res = await fetch(url, opts);
    if (res.ok) {
      setTempBuckets(prev => { const c = { ...prev }; delete c[source]; return c; });
      setFormBuckets(prev => { const c = { ...prev }; delete c[source]; return c; });
      setExpanded(xs => xs.filter(x => x !== source));
    }
  };

  const renderTable = (source, summary, type) => {
    const isOpen = expanded.includes(source);
    const rows = rowsCache[source] ?? (type === 'data' ? summary.data : summary.data);
    const headers = rows.length
      ? Object.keys(rows[0]).filter(k => k !== '_id' && k !== '__v')
      : [];
    return (
      <div key={source} style={{ marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '6px', paddingLeft: '1rem', paddingRight: '1rem' }}>
        <div
          className={styles.detailsRowSectionHeader}
          onClick={() => toggle(source, type)}
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
        >
          <div className={styles.buttonRow}>
            <strong>{source}</strong>
            <span>
              {type === 'data'
                ? `Uploaded: ${new Date(summary.updated || summary.created).toLocaleString()}`
                : `Uploaded: ${new Date(summary.uploadDate).toLocaleString()}`}
            </span>
            <button
              onClick={e => { e.stopPropagation(); handleDelete(source, type); }}
              style={{
                backgroundColor: 'red',
                color: 'white',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >Delete Upload</button>
          </div>
        </div>
        {isOpen && (
          <table border="1" cellPadding="8" style={{ width: '100%', fontSize: '1rem', marginTop: '0.5rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>{headers.map(h => <td key={h}>{String(row[h])}</td>)}</tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div className={styles.mainWhiteContainer} style={{ padding: '0rem', margin: '0rem' }}>
      <ScreenHeader name="Uploaded Data" />
      <ModuleMain>
        <div style={{ marginBottom: '2rem' }}>
          <h3>Data Uploads</h3>
          {Object.entries(tempBuckets).map(([k, v]) => renderTable(k, v, 'data'))}
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <h3>Form Uploads</h3>
          {Object.entries(formBuckets).map(([k, v]) => renderTable(k, v, 'forms'))}
        </div>
      </ModuleMain>
    </div>
  );
};

export default UploadedDataPage;
