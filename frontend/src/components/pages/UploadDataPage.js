import React, { useEffect, useState } from 'react';
import styles from './UploadDataPage.module.css';
import helpers from '../../helpers.js';
import ScreenHeader from "../ScreenHeader.js";
import Module from '../Module.js';
import ModuleMain from '../ModuleMain.js'

const UploadedDataPage = () => {
  const [groupedData, setGroupedData] = useState({});
  const [groupedCharcodes, setGroupedCharcodes] = useState({});  // New state for charcodes data
  const [expandedSources, setExpandedSources] = useState([]);
  const [groupedForms, setGroupedForms] = useState({});
  const [fileRows, setFileRows] = useState({});

  useEffect(() => {
    // Data uploads (unchanged)
    fetch('http://localhost:5000/api/upload')
      .then((res) => res.json())
      .then((docs) => {
        console.log('Data:', docs);
        const grouped = {};
        docs.forEach((doc) => {
          const src = doc.filename;
          grouped[src] = doc;
        });
        setGroupedData(grouped);
      })
      .catch((err) => console.error('Error fetching data:', err));

    // Charcodes uploads
    fetch('http://localhost:5000/api/charcodes')
      .then((res) => res.json())
      .then((docs) => {
        console.log('Charcodes:', docs);
        const grouped = {};
        docs.forEach((doc) => {
          const src = doc.filename;
          grouped[src] = doc;
        });
        setGroupedCharcodes(grouped);
      })
      .catch((err) => console.error('Error fetching charcodes:', err));

    //Form Uploads
    fetch('http://localhost:5000/api/forms')
      .then(res => res.json())
      .then(docs => {
        const grouped = {};
        docs.forEach(doc => (grouped[doc.filename] = doc));
        setGroupedForms(grouped);
      })
      .catch((err) => console.error('Error fetching forms:', err));
  }, []);
  

  const toggleExpand = async (source, type) => {
    if (!expandedSources.includes(source)) {
      try {
        let url;
        if (type === 'data') {
          url = `http://localhost:5000/api/upload/data/by-file/${encodeURIComponent(source)}`;
        } else if (type === 'charcodes') {
          url = `http://localhost:5000/api/charcodes/data/by-file/${encodeURIComponent(source)}`;
        } else if (type === 'forms') {
          url = `http://localhost:5000/api/forms/data/by-file/${encodeURIComponent(source)}`;
        } else {
          throw new Error(`Unknown type "${type}"`);
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch rows for ${type}`);
        const rows = await res.json();
        setFileRows(prev => ({ ...prev, [source]: rows }));
      } catch (err) {
        console.error('Failed to fetch row data:', err.message);
      }
    }

    setExpandedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const handleDelete = async (source, type) => {
    if (!window.confirm(`Delete all ${type} data from "${source}"?`)) return;

    try {
      let url;
      if (type === 'data') {
        url = `http://localhost:5000/api/upload/data/by-file/${encodeURIComponent(source)}`;
      } else if (type === 'charcodes') {
        url = `http://localhost:5000/api/charcodes/data/by-file/${encodeURIComponent(source)}`;
      } else if (type === 'forms') {
        url = `http://localhost:5000/api/forms/data/by-file/${encodeURIComponent(source)}`;
      } else {
        throw new Error(`Unknown type "${type}"`);
      }

      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await res.json();

      // remove from UI
      setGroupedData(prev => { const u = { ...prev }; delete u[source]; return u; });
      setGroupedCharcodes(prev => { const u = { ...prev }; delete u[source]; return u; });
      setGroupedForms(prev => { const u = { ...prev }; delete u[source]; return u; });
      setExpandedSources(prev => prev.filter(s => s !== source));

    } catch (err) {
      console.error('Delete failed:', err.message);
    }
  };

  return (
    <div className={styles.mainWhiteContainer} style = {{padding: '0rem', margin: '0rem'}}>
          <ScreenHeader name={"Uploaded Data"} content={""}/>
    <ModuleMain>
      <div style={{ marginBottom: '1rem' }}>
        <h3>Data Uploads</h3>
        {Object.entries(groupedData).map(([source, summary]) => {
          const isExpanded = expandedSources.includes(source);
          const uploadTime = new Date(summary.uploadDate).toLocaleString();
          const rows = fileRows[source] || summary.data || [];
          const headers = rows.length
            ? Object.keys(rows[0]).filter(k => k !== '_id' && k !== '__v')
            : [];

          return (
            <div
              key={source}
              style={{ marginBottom: '2rem', border: '1px solid #ccc', borderRadius: '6px', padding: '1rem'}}
            >
              <div
                className={styles.detailsRowSectionHeader}
                onClick={() => toggleExpand(source, 'data')}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between'}}
              >
                <div className={styles.buttonRow}>
                  <strong>{source}</strong>
                  <span>Uploaded: {uploadTime}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(source, 'data');
                      }}
                      style={{
                        backgroundColor: 'red',
                        color: 'white',
                        border: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete Upload
                    </button>
                  </div>
                </div>

              {isExpanded && (
                <table border="1" cellPadding="8" style={{ width: '100%', marginTop: '0.5rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {headers.map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>
                        {headers.map((key) => (
                          <td key={key}>{String(row[key])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Charcodes Uploads</h3>
        {Object.entries(groupedCharcodes).map(([source, summary]) => {
          const isExpanded = expandedSources.includes(source);
          const uploadTime = new Date(summary.uploadDate).toLocaleString();
          const rows = fileRows[source] || summary.data || [];
          const headers = rows.length
            ? Object.keys(rows[0]).filter(k => k !== '_id' && k !== '__v')
            : [];

          return (
            <div key={source} 
            style={{ marginBottom: '2rem', border: '1px solid #ccc', borderRadius: '6px', padding: '1rem' }}>
              <div
                className={styles.detailsRowSectionHeader}
                onClick={() => toggleExpand(source, 'charcodes')}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between'}}
              >
                <div className={styles.buttonRow}>
                <strong>{source}</strong> <span>Uploaded: {uploadTime}</span>
                <button onClick={e => {e.stopPropagation(); handleDelete(source, 'charcodes')}}
                  style={{
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}>
                  Delete Upload
                </button>
              </div>
              </div>
              {isExpanded && (
                <table border="1" cellPadding="8" style={{ width: '100%', marginTop: '0.5rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((row,i) => (
                      <tr key={i}>
                        {headers.map(h => <td key={h}>{String(row[h])}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginBottom: '2rem' }}>
        <h3>Form Uploads</h3>
        {Object.entries(groupedForms).map(([source, summary]) => {
          const isExpanded = expandedSources.includes(source);
          const uploadTime = new Date(summary.uploadDate).toLocaleString();
          const rows = fileRows[source] || summary.data || [];
          const headers = rows.length
            ? Object.keys(rows[0]).filter(k => k !== '_id' && k !== '__v')
            : [];

          return (
            <div key={source} style={{ marginBottom: '2rem', border: '1px solid #ccc', borderRadius: '6px', padding: '1rem' }}>
              <div
                className={styles.detailsRowSectionHeader}
                onClick={() => toggleExpand(source, 'forms')}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between'}}
              >
                <div className={styles.buttonRow}>
                  <strong>{source}</strong>
                  <span>Uploaded: {uploadTime}</span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(source, 'forms'); }}
                    style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px' }}
                  >
                    Delete Upload
                  </button>
                </div>
              </div>
              {isExpanded && (
                <table border="1" cellPadding="8" style={{fontSize: '0.5rem', width: '100%', marginTop: '0.5rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.map((row,i) => (
                      <tr key={i}>
                        {headers.map(h => <td key={h}>{String(row[h])}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </ModuleMain>
    </div>
  );
};

export default UploadedDataPage;
