import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "../../config/api";
import styles from "./SessionLeave.module.css";

const SessionLeave = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // null | "end" | "pause"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!state?.stocktake) {
    return (
      <div className={styles.page}>
        <div className={styles.msg}>
          No session data.{" "}
          <span className={styles.link} onClick={() => navigate("/stocktake/session")}>
            Go back
          </span>
        </div>
      </div>
    );
  }

  const { stocktake, site, name, progress } = state;
  const session_code = stocktake.session_code;

  const dateStr = new Date(stocktake.date).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const handleEnd = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/stocktake/session/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_code, name, pause: false }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Something went wrong"); setModal(null); return; }
      localStorage.removeItem("stocktake_session");
      navigate("/stocktake/session/done", { state: { ended: json.ended } });
    } catch {
      setError("Network error, please try again");
      setModal(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/stocktake/session/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_code, name, pause: true }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Something went wrong"); setModal(null); return; }
      localStorage.removeItem("stocktake_session");
      navigate("/stocktake/session/done", { state: { ended: false, paused: true } });
    } catch {
      setError("Network error, please try again");
      setModal(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.siteName}>{site?.full_name}</div>
        <div className={styles.date}>{dateStr}</div>
        <div className={styles.code}>{session_code}</div>

        <div className={styles.divider} />

        <div className={styles.countRow}>
          <span className={styles.countNum}>
            {progress?.scanned ?? stocktake.bags?.length ?? 0}
          </span>
          <span className={styles.countSep}>/</span>
          <span className={styles.countTotal}>
            {progress?.total ?? stocktake.dbbags?.length ?? 0}
          </span>
          <span className={styles.countLabel}> bags logged in stocktake</span>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.btnEnd} onClick={() => setModal("end")}>
          End Stocktake Session
        </button>

        <button className={styles.btnPause} onClick={() => setModal("pause")}>
          Pause Stocktake Session
        </button>

        <button className={styles.btnGhost} onClick={() => navigate(-1)}>
          Go back to scanning
        </button>
      </div>

      {/* End confirmation popup */}
      {modal === "end" && (
        <div className={styles.overlayBg}>
          <div className={styles.overlayCard}>
            <div className={styles.overlayTitle}>End Session?</div>
            <div className={styles.overlayMsg}>
              By ending the session you will not be able to edit this stocktake.
              If there are any more bags to scan, pause the session instead.
            </div>
            <button
              className={styles.overlayBtnEnd}
              onClick={handleEnd}
              disabled={loading}
            >
              {loading ? "Please wait…" : "End Session"}
            </button>
            <button
              className={styles.overlayBtnGhost}
              onClick={() => setModal(null)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pause confirmation popup */}
      {modal === "pause" && (
        <div className={styles.overlayBg}>
          <div className={styles.overlayCard}>
            <div className={styles.overlayTitle}>Pause Session</div>
            <div className={styles.overlayMsg}>
              To rejoin the session, find the session code on the ops app.
            </div>
            <div className={styles.overlayCode}>{session_code}</div>
            <button
              className={styles.overlayBtnPause}
              onClick={handlePause}
              disabled={loading}
            >
              {loading ? "Please wait…" : "Pause Session"}
            </button>
            <button
              className={styles.overlayBtnGhost}
              onClick={() => setModal(null)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionLeave;
