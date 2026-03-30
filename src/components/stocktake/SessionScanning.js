import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "../../config/api";
import { useStocktakeSocket } from "../../hooks/useStocktakeSocket";
import StocktakeScanner from "./StocktakeScanner";
import styles from "./SessionScanning.module.css";

const SessionScanning = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

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

  const [bags, setBags] = useState(sessionData?.stocktake?.bags || []);
  const [progress, setProgress] = useState({
    scanned: sessionData?.stocktake?.bags?.length || 0,
    total: sessionData?.stocktake?.dbbags?.length || 0,
  });

  const [scanModal, setScanModal] = useState(null);
  const [editOverlay, setEditOverlay] = useState(null);
  const [endingCountdown, setEndingCountdown] = useState(null);
  const [removalCountdown, setRemovalCountdown] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [toast, setToast] = useState("");
  const [view, setView] = useState("scanning");
  const [scannedOpen, setScannedOpen] = useState(true);
  const [missingOpen, setMissingOpen] = useState(false);

  const session_code = sessionData?.stocktake?.session_code;
  const name = sessionData?.name;

  const showToast = (msg, ms = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  };

  useStocktakeSocket(session_code, name, (evt, data) => {
    if (evt === "bag_scanned" || evt === "bag_updated" || evt === "bag_removed") {
      setBags(data.bags);
      setProgress(data.progress);
    }

    if (evt === "session_ended") {
      localStorage.removeItem("stocktake_session");
      navigate("/stocktake/session/done", { state: { ended: true } });
    }

    if (evt === "session_ending") {
      setEndingCountdown(data.seconds ?? 5);
    }

    if (evt === "session_end_cancelled") {
      setEndingCountdown(null);
      if (data?.by) {
        showToast(`${data.by} cancelled session termination`);
      } else {
        showToast("Session termination cancelled");
      }
    }

    if (evt === "member_removal_requested" && data.name === name) {
      setRemovalCountdown(data.seconds ?? 5);
    }

    if (evt === "member_removal_cancelled" && data.name === name) {
      setRemovalCountdown(null);
      showToast("Logout cancelled");
    }

    if (evt === "member_removed" && data.name === name) {
      localStorage.removeItem("stocktake_session");
      navigate("/stocktake/session/done", {
        state: { removed: true, message: "You were removed from the session." },
      });
    }
  });

  useEffect(() => {
    if (endingCountdown === null) return;
    if (endingCountdown === 0) return;
    const t = setTimeout(() => setEndingCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [endingCountdown]);

  useEffect(() => {
    if (removalCountdown === null) return;
    if (removalCountdown === 0) return;
    const t = setTimeout(() => setRemovalCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [removalCountdown]);

  const handleCancelEnd = async () => {
    try {
      await fetch(`${API}/stocktake/session/end/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_code, name }),
      });
      setEndingCountdown(null);
    } catch {}
  };

  const handleCancelRemoval = async () => {
    try {
      await fetch(`${API}/stocktake/session/remove-member/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_code, name }),
      });
      setRemovalCountdown(null);
    } catch {}
  };

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

  const matchedCount = bags.filter((b) => !b.note).length;
  const progressPct =
    progress.total > 0
      ? Math.min(100, Math.round((matchedCount / progress.total) * 100))
      : 0;

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
    },
    [session_code, name]
  );

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

  const scannedCodes = new Set(bags.map((b) => b.charcode));
  const missingBags = (sessionData.stocktake.dbbags || []).filter((code) => !scannedCodes.has(code));

  if (view === "allBags") {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setView("scanning")}>← Back to Scanner</button>
        </div>

        <div className={styles.allBagsList}>
          <div className={styles.accordion}>
            <button className={styles.accordionBtn} onClick={() => setScannedOpen((v) => !v)}>
              <span className={styles.accordionLabel}>Scanned Bags</span>
              <span className={styles.accordionCount}>{bags.length}</span>
              <span className={styles.accordionArrow}>{scannedOpen ? "▲" : "▼"}</span>
            </button>
            {scannedOpen && (
              <div className={styles.accordionList}>
                {bags.length === 0 && <div className={styles.emptyMsg}>No bags scanned yet</div>}
                {[...bags].reverse().map((bag) => (
                  <div key={bag.charcode} className={styles.bagRow} onClick={() => openEditOverlay(bag)}>
                    <span className={styles.bagCode}>{bag.charcode}</span>
                    {bag.note && <span className={styles.bagNote}>{bag.note.replace("_", " ")}</span>}
                    <span className={styles.bagBy}>{bag.scanned_by}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.accordion}>
            <button className={styles.accordionBtn} onClick={() => setMissingOpen((v) => !v)}>
              <span className={styles.accordionLabel}>Missing Bags</span>
              <span className={styles.accordionCount}>{missingBags.length}</span>
              <span className={styles.accordionArrow}>{missingOpen ? "▲" : "▼"}</span>
            </button>
            {missingOpen && (
              <div className={styles.accordionList}>
                {missingBags.length === 0 && <div className={styles.emptyMsg}>All bags scanned!</div>}
                {missingBags.map((code) => (
                  <div key={code} className={styles.bagRow}>
                    <span className={styles.bagCode}>{code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
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

        {endingCountdown !== null && (
          <SessionEndingModal countdown={endingCountdown} onCancel={handleCancelEnd} />
        )}

        {removalCountdown !== null && (
          <SessionRemovalModal countdown={removalCountdown} onCancel={handleCancelRemoval} />
        )}

        {toast && <div className={styles.toast}>{toast}</div>}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.siteHeader}>
        <div className={styles.metaRow}>
          <div className={styles.siteName}>{site?.name}</div>
          <span className={styles.metaItem}>{dateStr}</span>
          <span className={styles.sessionCode}>{session_code}</span>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressLabelRow}>
          <div className={styles.progressLabel}>
            {matchedCount} / {progress.total} bags
            <span className={styles.progressPct}> {progressPct}%</span>
          </div>
          <div className={styles.totalScanned}>
            Total scanned: <span className={styles.totalScannedNum}>{bags.length}</span>
          </div>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <StocktakeScanner
        onScan={(charcode) => {
          if (charcode === "UNLABELLED") {
            const n = bags.filter((b) => b.charcode.startsWith("UNLABELLED ")).length + 1;
            handleScan(`UNLABELLED ${n}`, true);
          } else {
            handleScan(charcode, false);
          }
        }}
        disabled={!!scanModal || !!editOverlay || endingCountdown !== null || removalCountdown !== null}
      />

      {toast && <div className={styles.toast}>{toast}</div>}

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

      {endingCountdown !== null && (
        <SessionEndingModal countdown={endingCountdown} onCancel={handleCancelEnd} />
      )}

      {removalCountdown !== null && (
        <SessionRemovalModal countdown={removalCountdown} onCancel={handleCancelRemoval} />
      )}
    </div>
  );
};

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

const SessionEndingModal = ({ countdown, onCancel }) => (
  <div className={styles.overlayBg}>
    <div className={styles.overlayCard}>
      <div className={styles.overlayTitle}>Session Ending</div>
      <div className={styles.confirmMsg}>
        Ops is ending this session. You will be logged out in{" "}
        <strong>{countdown}</strong> second{countdown !== 1 ? "s" : ""}.
      </div>
      <button className={styles.overlayBtn} onClick={onCancel}>
        I’m Still Scanning
      </button>
    </div>
  </div>
);

const SessionRemovalModal = ({ countdown, onCancel }) => (
  <div className={styles.overlayBg}>
    <div className={styles.overlayCard}>
      <div className={styles.overlayTitle}>You Are Being Logged Out</div>
      <div className={styles.confirmMsg}>
        Ops requested to remove you from this session. You will be logged out in{" "}
        <strong>{countdown}</strong> second{countdown !== 1 ? "s" : ""}.
      </div>
      <button className={styles.overlayBtn} onClick={onCancel}>
        I’m Still Scanning
      </button>
    </div>
  </div>
);

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