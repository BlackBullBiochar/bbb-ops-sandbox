// src/components/UploadForm.jsx
import React, { useContext, useState } from "react";
import { UserContext } from "../../UserContext";
import { useUpload }   from "../../hooks/useUpload";
import styles from "./UploadForm.module.css";
import Button from "../Button.js";
import ScreenHeader from "../ScreenHeader.js";
import JNRStaging from '../../assets/images/JNRStaging.png'; // QR Codes
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
        <div className={styles.uploadContainer}>
          <div className={styles.cardsGrid}>
            {/* Upload TempData Card */}
            <div className={styles.uploadCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Upload TempData</h2>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.subtitle}>Upload CSV or JSON File</div>
                <div className={styles.formContainer}>
                  <input type="file" accept=".csv,.json" onChange={handleChange} />
                  <select value={siteCode} onChange={e => setSiteCode(e.target.value)}>
                    <option value="">-- select site --</option>
                      {SITECODE_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  <Button
                    name={loading ? "Uploading…" : "Upload"}
                    onPress={handleUpload}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Plant Forms Card */}
            <div className={styles.plantFormsCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Plant Forms</h2>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.qrContainer}>
                  <div className={styles.qrSection}>
                    <div className={styles.siteName}>Ahlstrom</div>
                    <img src={getQR('AHL')} className={styles.qrCode} alt="Ahlstrom QR" />
                  </div>
                  <div className={styles.qrSection}>
                    <div className={styles.siteName}>Jenkinson</div>
                    <img src={getQR('JNR')} className={styles.qrCode} alt="Jenkinson QR" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {error && <p className={styles.errorMessage}>Error: {error.message}</p>}
          {data && <pre className={styles.dataOutput}>{JSON.stringify(data, null, 2)}</pre>}
        </div>
    </div>
  );
}
