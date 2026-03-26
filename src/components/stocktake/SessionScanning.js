import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "../../config/api";
import { useStocktakeSocket } from "../../hooks/useStocktakeSocket";
import StocktakeScanner from "./StocktakeScanner";
import styles from "./SessionScanning.module.css";

const SessionScanning = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Recover from state or localStorage if user refreshed
  const [sessionData] = useState(() => {
    if (state?.stocktake) {
      const d = { stocktake: state.stocktake, site: state.site, name: state.name };
      localStorage.setItem("stocktake_session", JSON.stringify(d));
      return d;
    }
    try {
      const stored = localStorage.getItem("stocktake_session");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [view, setView] = useState("scanning"); // "scanning" | "allBags"
  const [bags, setBags] = useState(sessionData?.stocktake?.bags || []);
  const [progress, setProgress] = useState({
    scanned: sessionData?.stocktake?.bags?.length || 0,
    total: sessionData?.stocktake?.dbbags?.length || 0,
  });

  // Modal states
  const [scanModal, setScanModal] = useState(null); // { type, message, charcode, onConfirm }
  const [editOverlay, setEditOverlay] = useState(null); // bag object being edited/removed
  const [editValue, setEditValue] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [toast, setToast] = useState("");

  const session_code = sessionData?.stocktake?.session_code;
  const name = sessionData?.name;

  const showToast = (msg, ms = 2000) => {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  };

  // Socket.io — live updates
  useStocktakeSocket(session_code, name, (evt, data) => {
    if (evt === "bag_scanned" || evt === "bag_updated" || evt === "bag_removed") {
      setBags(data.bags);
      setProgress(data.progress);
    }
    if (evt === "session_ended") {
      localStorage.removeItem("stocktake_session");
      navigate("/stocktake/session/done", { state: { ended: true } });
    }
  });

  // Fetch fresh session on mount (handles page refresh / re-entry)
  useEffect(() => {
    if (!session_code) return;
    fetch(`${API}/stocktake/session/${session_code}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.stocktake) {
          setBags(json.stocktake.bags || []);
          setProgress({
            scanned: json.stocktake.bags?.length || 0,
            total: json.stocktake.dbbags?.length || 0,
          });
          // Keep localStorage up-to-date so future re-entries have the latest bags
          try {
            const stored = localStorage.getItem("stocktake_session");
            if (stored) {
              const parsed = JSON.parse(stored);
              parsed.stocktake.bags = json.stocktake.bags || [];
              localStorage.setItem("stocktake_session", JSON.stringify(parsed));
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, [session_code]);

  if (!sessionData) {
    return (
      <div className={styles.page}>
        <div className={styles.errMsg}>
          No session found.{" "}
          <span
            className={styles.link}
            onClick={() => navigate("/stocktake/session")}
          >
            Go back
          </span>
        </div>
      </div>
    );
  }

  const progressPct =
    progress.total > 0
      ? Math.min(100, Math.round((progress.scanned / progress.total) * 100))
      : 0;

  // ---- Scan handler ----
  const handleScan = useCallback(
    async (charcode, force = false) => {
      const res = await fetch(`${API}/stocktake/session/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_code, charcode, name, force }),
      });
      const json = await res.json();

      if (json.status === "duplicate") {
        showToast("Already scanned");
        return;
      }
      if (json.status === "not_found") {
        setScanModal({
          charcode,
          type: "not_found",
          message: `"${charcode}" does not exist in the database. Add it anyway?`,
          onConfirm: () => { setScanModal(null); handleScan(charcode, true); },
        });
        return;
      }
      if (json.status === "wrong_site") {
        setScanModal({
          charcode,
          type: "wrong_site",
          message: `This bag is registered at: ${json.location}. Add it to this stocktake anyway?`,
          onConfirm: () => { setScanModal(null); handleScan(charcode, true); },
        });
        return;
      }
      // ok — socket will update bags/progress for everyone
    },
    [session_code, name]
  );

  // ---- Edit scan ----
  const openEditOverlay = (bag) => {
    setEditOverlay(bag);
    setEditValue(bag.charcode);
    setEditError("");
  };

  const handleEditSubmit = async (force = false) => {
    if (editValue.trim() === editOverlay.charcode && !force) {
      setEditOverlay(null);
      return;
    }
    setEditLoading(true);
    setEditError("");
    const res = await fetch(`${API}/stocktake/session/scan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_code,
        oldCharcode: editOverlay.charcode,
        newCharcode: editValue.trim(),
        name,
        force,
      }),
    });
    const json = await res.json();
    setEditLoading(false);

    if (json.status === "duplicate") { setEditError("Already scanned"); return; }
    if (json.status === "not_found") {
      setEditError(`"${editValue}" not in DB`);
      return;
    }
    if (json.status === "wrong_site") {
      setScanModal({
        charcode: editValue.trim(),
        type: "wrong_site",
        message: `This bag is at: ${json.location}. Update anyway?`,
        onConfirm: () => { setScanModal(null); handleEditSubmit(true); },
      });
      return;
    }
    setEditOverlay(null);
  };

  // ---- Remove scan ----
  const handleRemove = async (charcode) => {
    await fetch(`${API}/stocktake/session/scan`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_code, charcode }),
    });
    setEditOverlay(null);
  };

  const myScans = [...bags].filter((b) => b.scanned_by === name).reverse().slice(0, 3);
  const site = sessionData.site;
  const dateStr = new Date(sessionData.stocktake.date).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ---- All Bags view ----
  if (view === "allBags") {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setView("scanning")}>← Back to Scanner</button>
        </div>
        <div className={styles.allBagsTop}>
          <span className={styles.headerTitle}>Scanned Bags</span>
          <span className={styles.headerCount}>{bags.length}/{progress.total}</span>
        </div>
        <div className={styles.allBagsList}>
          {bags.length === 0 && (
            <div className={styles.emptyMsg}>No bags scanned yet</div>
          )}
          {[...bags].reverse().map((bag) => (
            <div
              key={bag.charcode}
              className={styles.bagRow}
              onClick={() => openEditOverlay(bag)}
            >
              <span className={styles.bagCode}>{bag.charcode}</span>
              {bag.note && <span className={styles.bagNote}>{bag.note.replace("_", " ")}</span>}
              <span className={styles.bagBy}>{bag.scanned_by}</span>
            </div>
          ))}
        </div>

        {editOverlay && (
          <EditOverlay
            bag={editOverlay}
            editValue={editValue}
            setEditValue={setEditValue}
            editError={editError}
            editLoading={editLoading}
            onSave={() => handleEditSubmit(false)}
            onRemove={() => handleRemove(editOverlay.charcode)}
            onClose={() => setEditOverlay(null)}
          />
        )}
        {scanModal && (
          <ConfirmModal
            message={scanModal.message}
            onConfirm={scanModal.onConfirm}
            onCancel={() => setScanModal(null)}
          />
        )}
      </div>
    );
  }

  // ---- Scanning view ----
  return (
    <div className={styles.page}>
      {/* Site header */}
      <div className={styles.siteHeader}>
        <div className={styles.metaRow}>
          <div className={styles.siteName}>{site?.name}</div>
          <span className={styles.metaItem}>{dateStr}</span>
          <span className={styles.sessionCode}>{session_code}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressLabel}>
          {progress.scanned} / {progress.total} bags
          <span className={styles.progressPct}> {progressPct}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Scanner */}
      <StocktakeScanner
        onScan={(charcode) => handleScan(charcode, false)}
        disabled={!!scanModal || !!editOverlay}
      />

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* Last 3 scanned — always rendered so layout never shifts */}
      <div className={styles.recentSection}>
        {myScans.length > 0 && (
          <div className={styles.recentLabel}>Recently scanned</div>
        )}
        {myScans.map((bag) => (
          <div
            key={bag.charcode}
            className={styles.recentBag}
            onClick={() => openEditOverlay(bag)}
          >
            <span className={styles.recentCode}>{bag.charcode}</span>
            {bag.note && <span className={styles.bagNote}>{bag.note.replace("_", " ")}</span>}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className={styles.actionBtns}>
        <button className={styles.btnSecondary} onClick={() => setView("allBags")}>
          See All Bags ({bags.length})
        </button>
        <button
          className={styles.btnLeave}
          onClick={() =>
            navigate("/stocktake/session/leave", {
              state: { stocktake: { ...sessionData.stocktake, bags }, site, name, progress },
            })
          }
        >
          Leave Session
        </button>
      </div>

      {/* Edit overlay */}
      {editOverlay && (
        <EditOverlay
          bag={editOverlay}
          editValue={editValue}
          setEditValue={setEditValue}
          editError={editError}
          editLoading={editLoading}
          onSave={() => handleEditSubmit(false)}
          onRemove={() => handleRemove(editOverlay.charcode)}
          onClose={() => setEditOverlay(null)}
        />
      )}

      {/* Scan warning modal */}
      {scanModal && (
        <ConfirmModal
          message={scanModal.message}
          onConfirm={scanModal.onConfirm}
          onCancel={() => setScanModal(null)}
        />
      )}
    </div>
  );
};

// ---- Shared sub-components ----

const EditOverlay = ({
  bag, editValue, setEditValue, editError, editLoading, onSave, onRemove, onClose,
}) => {
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <div className={styles.overlayBg}>
      <div className={styles.overlayCard}>
        <div className={styles.overlayTitle}>Edit Bag</div>
        <div className={styles.overlayMeta}>Scanned by {bag.scanned_by}</div>

        <input
          className={styles.overlayInput}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && onSave()}
          placeholder="CHA-000000"
        />

        {editError && <div className={styles.overlayError}>{editError}</div>}

        <button
          className={styles.overlayBtn}
          onClick={onSave}
          disabled={editLoading}
        >
          {editLoading ? "Saving…" : "Update Charcode"}
        </button>

        {!confirmRemove ? (
          <button
            className={styles.overlayBtnRemove}
            onClick={() => setConfirmRemove(true)}
          >
            Remove Bag
          </button>
        ) : (
          <div className={styles.confirmRemove}>
            <div className={styles.confirmMsg}>
              Are you sure you want to remove {bag.charcode}?
            </div>
            <button className={styles.overlayBtnRemove} onClick={onRemove}>
              Yes, Remove
            </button>
            <button className={styles.overlayBtnGhost} onClick={() => setConfirmRemove(false)}>
              Cancel
            </button>
          </div>
        )}

        <button className={styles.overlayBtnGhost} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className={styles.overlayBg}>
    <div className={styles.overlayCard}>
      <div className={styles.overlayTitle}>Warning</div>
      <div className={styles.confirmMsg}>{message}</div>
      <button className={styles.overlayBtn} onClick={onConfirm}>
        Yes, Add Anyway
      </button>
      <button className={styles.overlayBtnGhost} onClick={onCancel}>
        No, Cancel
      </button>
    </div>
  </div>
);

export default SessionScanning;
