import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "../../config/api";
import { useStocktakeSocket } from "../../hooks/useStocktakeSocket";
import styles from "./SessionLeave.module.css";

const SessionLeave = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [modal, setModal] = useState(null); // null | "end" | "pause" | "cancelled"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [endingCountdown, setEndingCountdown] = useState(null);
  const [cancelledBy, setCancelledBy] = useState(null);

  const session_code = state?.stocktake?.session_code;
  const { stocktake, site, name, progress } = state ?? {};

  useStocktakeSocket(session_code, name, (evt, data) => {
    if (evt === "session_ending") {
      setEndingCountdown(data.seconds ?? 5);
    }
    if (evt === "session_ended") {
      localStorage.removeItem("stocktake_session");
      navigate("/stocktake/session/done", { state: { ended: true } });
    }
    if (evt === "session_end_cancelled") {
      setEndingCountdown(null);
      setCancelledBy(data.name || null);
      setModal("cancelled");
    }
  });

  useEffect(() => {
    if (endingCountdown === null || endingCountdown === 0) return;
    const t = setTimeout(() => setEndingCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [endingCountdown]);

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

  const dateStr = new Date(stocktake.date).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const handleEnd = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/stocktake/session/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_code }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Something went wrong"); setModal(null); return; }
      setModal(null);
      // Wait for session_ended or session_end_cancelled socket events
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

  const handleLeaveOnly = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/stocktake/session/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_code, name, pause: false }),
      });
      if (res.ok) {
        localStorage.removeItem("stocktake_session");
        navigate("/stocktake/session/done", { state: { ended: false } });
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.siteName}>{site?.name}</div>
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
          Leave Stocktake Session
        </button>

        <button className={styles.btnGhost} onClick={() => navigate(-1)}>
          Go back to scanning
        </button>
      </div>

      {/* Waiting for session end */}
      {endingCountdown !== null && (
        <div className={styles.overlayBg}>
          <div className={styles.overlayCard}>
            <div className={styles.overlayTitle}>Ending Session</div>
            <div className={styles.overlayMsg}>
              Ending session for everyone in{" "}
              <strong>{endingCountdown}</strong> second{endingCountdown !== 1 ? "s" : ""}…
            </div>
          </div>
        </div>
      )}

      {/* End confirmation popup */}
      {modal === "end" && (
        <div className={styles.overlayBg}>
          <div className={styles.overlayCard}>
            <div className={styles.overlayTitle}>End Session?</div>
            <div className={styles.overlayMsg}>
              By ending the session all members will be logged out and will not be able to edit this stocktake.
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
            <div className={styles.overlayTitle}>Leave Session</div>
            <div className={styles.overlayMsg}>
              To rejoin the session, find the session code on the ops app.
            </div>
            <div className={styles.overlayCode}>{session_code}</div>
            <button
              className={styles.overlayBtnPause}
              onClick={handlePause}
              disabled={loading}
            >
              {loading ? "Please wait…" : "Leave Session"}
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

      {/* Session end cancelled popup */}
      {modal === "cancelled" && (
        <div className={styles.overlayBg}>
          <div className={styles.overlayCard}>
            <div className={styles.overlayTitle}>Session Not Ended</div>
            <div className={styles.overlayMsg}>
              {cancelledBy
                ? <><strong>{cancelledBy}</strong> is still scanning and has kept the session open.</>
                : "Someone is still scanning and has kept the session open."
              }{" "}
              If you're done, you can leave without ending it for everyone else.
            </div>
            <button
              className={styles.overlayBtnEnd}
              onClick={handleLeaveOnly}
              disabled={loading}
            >
              {loading ? "Please wait…" : "Leave Session"}
            </button>
            <button
              className={styles.overlayBtnGhost}
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Keep Scanning
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionLeave;
