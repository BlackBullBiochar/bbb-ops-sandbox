// src/components/UploadForm.jsx
import React, { useContext, useState } from "react";
import { UserContext } from "../../UserContext";
import { useUpload }   from "../../hooks/useUpload";
import styles from "./UploadForm.module.css";
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from '../ModuleMain.js'
import Module from '../Module.js';
import EditableParagraph from "../EditableParagraph.js";

const SITECODE_OPTIONS   = ["ARA","JNR"];

export default function UploadForm() {
  const { user } = useContext(UserContext);
  const { upload, data, loading, error } = useUpload({ token: user.token });

  const [file, setFile] = useState(null);
  const [siteCode, setSiteCode] = useState("");
  const [type, setType] = useState("temp");

  const handleChange = e => setFile(e.target.files[0] || null);

  const handleUpload = async () => {
    if (!file || !siteCode) {
      alert("Please pick file, site and upload type");
      return;
    }

    const path = `/temp/upload?siteCode=${siteCode}`;
    const customName = `${type}_${siteCode}`;
    
    try {
      await upload(path, file, { customName });
      // success data is in `data`
    } catch {
      // error is in `error`
    }
  };

  return (
    <div className={styles.mainWhiteContainer}>
        <ScreenHeader name={"Upload Portal"}/>
        <ModuleMain>
          <div className={styles.contentGrid}>
            <Module name="Upload TempData" spanColumn={12} spanRow={2}>
              <div className={styles.title}>Upload CSV or JSON File</div>
              <div className= {styles.formContainer}>
                <input type="file" accept=".csv,.json" onChange={handleChange} />
                  <select value={siteCode} onChange={e => setSiteCode(e.target.value)}>
                    <option value="">-- select site --</option>
                      {SITECODE_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  <button onClick={handleUpload} disabled={loading}>
                {loading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </Module>
            <Module name="Plant Forms" spanColumn={12} spanRow={2}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
              </div>
            </Module>
          </div>
          {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
          {data  && <pre style={{ background: '#f4f4f4', borderRadius: '1rem',  padding: 16 }}>{JSON.stringify(data, null, 2)}</pre>}
        </ModuleMain>
    </div>
  );
}
