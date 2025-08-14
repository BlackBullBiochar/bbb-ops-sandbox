// src/components/UploadForm.jsx
import React, { useContext, useState } from "react";
import { UserContext } from "../../UserContext";
import { useUpload }   from "../../hooks/useUpload";
import styles from "./UploadForm.module.css";
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from '../ModuleMain.js'
import Module from '../Module.js';
import JNRStaging from '../../assets/images/JNRStaging.png';
import AHLStaging from '../../assets/images/AHLStaging.png';
import JNRProduction from '../../assets/images/JNRProduction.png'
import AHLProduction from '../../assets/images/AHLProduction.png'

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

  const isProductionLaunch = () => {
  const { hostname, href } = window.location;
  const isLocalhost = hostname === 'localhost';
  const isNgrok = href.includes('ngrok');
  const isStaging = href.includes('staging');
  return !(isLocalhost || isNgrok || isStaging); // only true for real production launch
};

const getQR = (site) => {
  const prod = isProductionLaunch();
  if (site === 'AHL') return prod ? AHLProduction : AHLStaging;
  if (site === 'JNR') return prod ? JNRProduction : JNRStaging;
  throw new Error('Unknown site (use "AHL" or "JNR")');
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
                <div>
                  <div className={styles.title}>Ahlstrom</div>
                  <img src={getQR('AHL')} className={styles.bbbLogo} alt="Ahlstrom QR" />
                </div>
                <div>
                  <div className={styles.title}>Jenkinson</div>
                  <img src={getQR('JNR')} className={styles.bbbLogo} alt="Jenkinson QR" />
                </div>
              </div>
            </Module>
          </div>
          {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
          {data  && <pre style={{ background: '#f4f4f4', borderRadius: '1rem',  padding: 16 }}>{JSON.stringify(data, null, 2)}</pre>}
        </ModuleMain>
    </div>
  );
}
