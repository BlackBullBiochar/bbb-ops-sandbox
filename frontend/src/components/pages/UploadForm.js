import React, { useState } from 'react';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [uploadType, setUploadType] = useState('dat');

  const sourceOptions = [' ara', ' jnr'];

  const handleChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    const dateLabel = fromDate && toDate ? ` ${fromDate}-${toDate}` : '';
    const displayName = `${uploadType}${selectedLabel}${dateLabel}`.trim();
    
    formData.append('file', file);
    formData.append('customName', displayName);

    // Point at the correct endpoint based on uploadType
    let uploadEndpoint = '';
    if (uploadType === 'dat') {
      uploadEndpoint = 'http://localhost:5000/api/upload';
    } else if (uploadType === 'char') {
      uploadEndpoint = 'http://localhost:5000/api/charcodes';
    } else if (uploadType === 'for') {
      uploadEndpoint = 'http://localhost:5000/api/forms';
    }    

    try {
      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponse(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ paddingLeft: '2rem' }}>
      <h2>Upload CSV or JSON File</h2>

      {/* file input */}
      <input type="file" accept=".csv,.json" onChange={handleChange} />

      {/* label dropdown */}
      <label style={{ display: 'block', margin: '1rem 0 0.5rem' }}>
        Select upload label:
      </label>
      <select
        value={selectedLabel}
        onChange={(e) => setSelectedLabel(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      >
        <option value="">-- Choose a label --</option>
        {sourceOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>

      {/* upload type toggle */}
      <label style={{ display: 'block', margin: '0.5rem 0' }}>
        Select Upload Type:
      </label>
      <select
        value={uploadType}
        onChange={(e) => setUploadType(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      >
        <option value="dat">Data Upload</option>
        <option value="char">Charcodes Upload</option>
        <option value="for">Form Upload</option>
      </select>

      {/* date range */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label>From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* upload button */}
      <button onClick={handleUpload} style={{ marginTop: '1rem' }}>
        Upload
      </button>

      {/* response */}
      {response && (
        <pre style={{ background: '#f4f4f4', padding: '1rem', marginTop: '1rem' }}>
          {response}
        </pre>
      )}
    </div>
  );
};

export default UploadForm;