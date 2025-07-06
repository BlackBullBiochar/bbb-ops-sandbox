import React, { useContext, useState } from "react";
import { UserContext } from "../../UserContext";
import { API } from '../../config/api';

const UploadForm = () => {
  const { user } = useContext(UserContext);
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [uploadType, setUploadType] = useState("");

  // Must match how your controller buckets “ara” vs. “jnr”
  const sourceOptions = ["ara", "jnr"];

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    const displayName = `${uploadType}${selectedLabel}`.trim();
    formData.append('file', file);
    formData.append('customName', displayName);

    // Decide which endpoint to call: (no “/api” prefix)
    let uploadEndpoint;
    if (uploadType === "dat") {
      uploadEndpoint = `${API}/tempData/upload`;
    } else if (uploadType === "for") {
      uploadEndpoint = `${API}/forms/upload`;
    } else {
      alert("Unknown upload type");
      return;
    }

    try {
      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Upload failed: ${res.status} ${res.statusText}\n${text}`
        );
      }

      // If server responds with JSON, parse it
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponse(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Upload CSV or JSON File</h2>

      {/* 1) File picker */}
      <input type="file" accept=".csv,.json" onChange={handleChange} />

      {/* 2) Site label dropdown */}
      <label
        style={{
          display: "block",
          margin: "1rem 0 0.5rem",
        }}
      >
        Select upload label (site):
      </label>
      <select
        value={selectedLabel}
        onChange={(e) => setSelectedLabel(e.target.value)}
        style={{
          width: "100%",
          marginBottom: "1rem",
        }}
      >
        <option value="">-- Choose a site --</option>
        {sourceOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt.toUpperCase()}
          </option>
        ))}
      </select>

      {/* 3) Upload type selector */}
      <label
        style={{
          display: "block",
          margin: "0.5rem 0",
        }}
      >
        Select Upload Type:
      </label>
      <select
        value={uploadType}
        onChange={(e) => setUploadType(e.target.value)}
        style={{
          width: "100%",
          marginBottom: "1rem",
        }}
      >
        <option value="">-- Choose an upload type --</option>
        <option value="dat">Data Upload</option>
        <option value="for">Form Upload</option>
      </select>

      {/* 4) Optional date range */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
      </div>

      {/* 5) Upload button */}
      <button
        onClick={handleUpload}
        style={{ marginTop: "1rem" }}
      >
        Upload
      </button>

      {/* 6) Show server response (or errors) */}
      {response && (
        <pre
          style={{
            background: "#f4f4f4",
            padding: "1rem",
            marginTop: "1rem",
            whiteSpace: "pre-wrap",
          }}
        >
          {response}
        </pre>
      )}
    </div>
  );
};

export default UploadForm;
