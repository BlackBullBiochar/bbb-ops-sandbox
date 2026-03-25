import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "../../config/api";
import styles from "./SessionLeave.module.css";

const SessionLeave = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
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

  const isLast = stocktake.active_members?.length <= 1;

  const dateStr = new Date(stocktake.date).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const handleLeaveOrEnd = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/stocktake/session/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_code, name }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Something went wrong"); return; }

      localStorage.removeItem("stocktake_session");
      navigate("/stocktake/session/done", { state: { ended: json.ended } });
    } catch {
      setError("Network error, please try again");
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

        <button
          className={isLast ? styles.btnEnd : styles.btnLeave}
          onClick={handleLeaveOrEnd}
          disabled={loading}
        >
          {loading
            ? "Please wait…"
            : isLast
            ? "End Stocktake Session"
            : "Leave Stocktake Session"}
        </button>

        <button
          className={styles.btnGhost}
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          Go back to scanning
        </button>
      </div>
    </div>
  );
};

export default SessionLeave;
