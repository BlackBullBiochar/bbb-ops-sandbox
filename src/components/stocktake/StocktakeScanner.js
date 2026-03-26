import { Html5Qrcode } from "html5-qrcode";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./StocktakeScanner.module.css";

const CAMERA_KEY = "bbb_stocktake_camera_id";

const normalizeCharcode = (raw) => {
  const s = String(raw ?? "").trim();
  const m = s.match(/CHA-(\d{1,6})/i);
  if (!m) return null;
  return `CHA-${m[1].padStart(6, "0")}`;
};

/**
 * QR scanner adapted for stocktake sessions.
 * Props:
 *   onScan(charcode) — called with a valid normalised charcode
 *   disabled         — pauses scanning (e.g. while a modal is open)
 */
const StocktakeScanner = ({ onScan, disabled = false }) => {
  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState("");
  const [scannerReady, setScannerReady] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [manualValue, setManualValue] = useState("CHA-00");
  const [showUnlabelledConfirm, setShowUnlabelledConfirm] = useState(false);
  const [feedback, setFeedback] = useState("");

  const html5Ref = useRef(null);
  const runningRef = useRef(false);
  const switchingRef = useRef(false);
  const cooldownRef = useRef(false);
  const feedbackTimer = useRef(null);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const showFeedback = useCallback((msg, ms = 1200) => {
    setFeedback(msg);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(""), ms);
  }, []);

  const setCooldown = (ms) => {
    cooldownRef.current = true;
    setTimeout(() => (cooldownRef.current = false), ms);
  };

  const handleScan = useCallback(
    (raw) => {
      if (cooldownRef.current || disabledRef.current) return;
      setCooldown(800);

      const charcode = normalizeCharcode(raw);
      if (!charcode) {
        showFeedback("Invalid format");
        return;
      }

      onScanRef.current(charcode);
    },
    [showFeedback]
  );

  // Create scanner instance once
  useEffect(() => {
    html5Ref.current = new Html5Qrcode("stocktake-reader");
    return () => {
      (async () => {
        try {
          if (runningRef.current) await html5Ref.current?.stop?.();
        } catch {}
        try {
          await html5Ref.current?.clear?.();
        } catch {}
        html5Ref.current = null;
      })();
    };
  }, []);

  // Get camera list
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (cancelled) return;
        const list = (devices || []).map((d, i) => ({
          id: d.id,
          label: d.label || `Camera ${i + 1}`,
        }));
        setCameras(list);
        if (!list.length) return;

        let stored = "";
        try { stored = localStorage.getItem(CAMERA_KEY) || ""; } catch {}

        const storedValid = stored && list.some((c) => c.id === stored);
        if (storedValid) { setCameraId(stored); return; }

        const back = list.find((c) => /back|rear|environment/i.test(c.label));
        const id = back?.id || list[1]?.id || list[0].id;
        setCameraId(id);
        try { localStorage.setItem(CAMERA_KEY, id); } catch {}
      } catch (e) {
        console.error("getCameras failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Start/switch camera
  useEffect(() => {
    if (!cameraId || !html5Ref.current) return;
    let cancelled = false;

    (async () => {
      if (switchingRef.current) return;
      switchingRef.current = true;
      try {
        setScannerReady(false);
        if (runningRef.current) {
          try { await html5Ref.current.stop(); } catch {}
          runningRef.current = false;
        }
        if (cancelled) return;

        await html5Ref.current.start(
          { deviceId: { exact: cameraId } },
          { fps: 10 },
          handleScan,
          () => {}
        );
        runningRef.current = true;
        if (!cancelled) setScannerReady(true);
      } catch (e) {
        console.error("Camera start failed", e);
        showFeedback("Camera failed — check permissions & HTTPS");
      } finally {
        switchingRef.current = false;
      }
    })();

    return () => { cancelled = true; };
  }, [cameraId, handleScan, showFeedback]);

  const switchCamera = (id) => {
    setCameraId(id);
    try { localStorage.setItem(CAMERA_KEY, id); } catch {}
    setShowCameraMenu(false);
    setCooldown(800);
  };

  const submitManual = () => {
    const isEmpty = !manualValue.trim() || manualValue.trim() === "CHA-00";
    if (isEmpty) {
      setShowUnlabelledConfirm(true);
    } else {
      handleScan(manualValue);
      setManualValue("CHA-00");
    }
  };

  const confirmUnlabelled = () => {
    setShowUnlabelledConfirm(false);
    onScanRef.current("UNLABELLED");
  };

  return (
    <div className={styles.scanner}>
      {/* Camera viewfinder */}
      <div className={styles.readerWrap}>
        <div id="stocktake-reader" className={styles.reader} />

        {!scannerReady && (
          <div className={styles.scannerMsg}>Starting camera…</div>
        )}

        {/* Manual input — overlaid at bottom of camera */}
        <div className={styles.manualRow}>
          <input
            className={styles.manualInput}
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitManual()}
            placeholder="CHA-000000"
          />
          <button className={styles.manualBtn} onClick={submitManual}>
            &gt;
          </button>
        </div>
      </div>

      {/* Camera switcher — below the viewfinder, full width */}
      {cameras.length > 1 && (
        <div className={styles.cameraOverlay}>
          <button
            className={styles.switchBtn}
            onClick={() => setShowCameraMenu((v) => !v)}
          >
            Switch camera
          </button>
          {showCameraMenu && (
            <select
              className={styles.cameraSelect}
              value={cameraId}
              onChange={(e) => switchCamera(e.target.value)}
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {feedback && <div className={styles.feedback}>{feedback}</div>}

      {showUnlabelledConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <p className={styles.confirmText}>Add an unlabelled bag?</p>
            <div className={styles.confirmBtns}>
              <button className={styles.confirmNo} onClick={() => setShowUnlabelledConfirm(false)}>No</button>
              <button className={styles.confirmYes} onClick={confirmUnlabelled}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StocktakeScanner;
