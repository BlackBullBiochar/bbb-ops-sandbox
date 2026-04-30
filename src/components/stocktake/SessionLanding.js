import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../config/api";
import styles from "./SessionLanding.module.css";
import bbbLogo from "../../assets/images/bbbLogo.png";

const isTokenValid = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const SessionLanding = () => {
  const navigate = useNavigate();

  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [name, setName] = useState(""); // only used for join
  const [sessionCode, setSessionCode] = useState("");
  const [mode, setMode] = useState(""); // "start" | "join"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Detect crashed session in localStorage and offer rejoin
  const [crashedSession, setCrashedSession] = useState(() => {
    try {
      const stored = localStorage.getItem("stocktake_session");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // Login popup state (for unauthenticated start-session)
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/sites`)
      .then((r) => r.json())
      .then((json) => {
        const all = json?.data?.sites || json?.sites || json?.data || [];
        const relevant = all.filter(
          (s) => (s.category === "Pyrolysis" || s.category === "Storage") &&
                 !/test/i.test(s.name) && !/test/i.test(s.full_name)
        );
        setSites(relevant);
        if (relevant.length) setSelectedSiteId(relevant[0]._id);
      })
      .catch((e) => setError(`Failed to load sites from ${API} — ${e.message}`));
  }, []);

  const selectedSite = sites.find((s) => s._id === selectedSiteId);

  const validateNameForJoin = () => {
    if (!name.trim()) { setError("Please enter your first name"); return false; }
    setError("");
    return true;
  };

  // ---- Start Session ----
  const getNameFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.first_name || payload.firstName || payload.name || "Ops";
    } catch {
      return "Ops";
    }
  };

  const doStartSession = async (token) => {
    setLoading(true);
    setError("");
    const starterName = getNameFromToken(token);
    try {
      const res = await fetch(`${API}/stocktake/session/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ siteId: selectedSiteId, starterName }),
      });
      const json = await res.json();

      if (res.status === 409) {
        setError(`A session is already active for this site code. Check ops app for active session`);
        return;
      }
      if (!res.ok) {
        setError(json.error || "Failed to start session");
        return;
      }

      navigate("/stocktake/session/scanning", {
        state: { stocktake: json.stocktake, site: selectedSite, name: starterName },
      });
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = () => {
    const token = localStorage.getItem("token");
    if (token && isTokenValid(token)) {
      doStartSession(token);
    } else {
      setShowLoginPopup(true);
    }
  };

  // ---- Login popup submit ----
  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Please enter email and password");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const json = await res.json();
      if (!json.success) {
        setLoginError(json.message || "Invalid credentials");
        return;
      }
      const token = json.data?.token || json.token;
      localStorage.setItem("token", token);
      setShowLoginPopup(false);
      doStartSession(token);
    } catch {
      setLoginError("Network error");
    } finally {
      setLoginLoading(false);
    }
  };

  // ---- Rejoin crashed session ----
  const handleRejoin = async () => {
    if (!crashedSession) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/stocktake/session/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_code: crashedSession.stocktake.session_code,
          name: crashedSession.name,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Session no longer active — clear stale data and show normal screen
        localStorage.removeItem("stocktake_session");
        setCrashedSession(null);
        setError(json.error || "Session is no longer active");
        return;
      }
      navigate("/stocktake/session/scanning", {
        state: { stocktake: json.stocktake, site: json.site, name: crashedSession.name },
      });
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  // ---- Join Session ----
  const handleJoinSession = async () => {
    if (!validateNameForJoin()) return;
    if (!sessionCode.trim()) { setError("Please enter a session code"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/stocktake/session/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_code: sessionCode.trim().toUpperCase(), name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Session not found");
        return;
      }
      navigate("/stocktake/session/scanning", {
        state: { stocktake: json.stocktake, site: json.site, name: name.trim() },
      });
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img src={bbbLogo} alt="BBB" className={styles.logo} />
        {mode === "" && <h1 className={styles.title}>Stocktake</h1>}
        {mode === "" && <p className={styles.subtitle}>Black Bull Biochar</p>}

        {/* Site selector (only for start) */}
        {mode === "start" && (
          <>
            <label className={styles.label}>Site</label>
            <select
              className={styles.select}
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
            >
              {sites.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.full_name} ({s.category})
                </option>
              ))}
            </select>
          </>
        )}

        {/* Join flow: name + session code */}
        {mode === "join" && (
          <>
            <label className={styles.label}>Your first name</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. James"
            />
            <label className={styles.label}>Session code</label>
            <input
              className={styles.input}
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              placeholder="e.g. BOW657"
              maxLength={8}
              style={{ textTransform: "uppercase", letterSpacing: "2px", fontWeight: "700" }}
            />
          </>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {/* Crashed session — offer rejoin */}
        {crashedSession && mode === "" && (
          <div className={styles.rejoinBanner}>
            <div className={styles.rejoinText}>
              Looks like you were in session <strong>{crashedSession.stocktake.session_code}</strong> as <strong>{crashedSession.name}</strong>
            </div>
            <div className={styles.btnStack}>
              <button className={styles.btnPrimary} onClick={handleRejoin} disabled={loading}>
                {loading ? "Rejoining…" : "Rejoin Session"}
              </button>
              <button className={styles.btnGhost} onClick={() => { localStorage.removeItem("stocktake_session"); setCrashedSession(null); }}>
                Start fresh
              </button>
            </div>
          </div>
        )}

        {/* Mode buttons */}
        {!crashedSession && mode === "" && (
          <div className={styles.btnStack}>
            <button
              className={styles.btnPrimary}
              onClick={() => { setMode("start"); setError(""); }}
            >
              Start New Stocktake
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => { setMode("join"); setError(""); }}
            >
              Join Existing Session
            </button>
          </div>
        )}

        {mode === "start" && (
          <div className={styles.btnStack}>
            <button
              className={styles.btnPrimary}
              onClick={handleStartSession}
              disabled={loading}
            >
              {loading ? "Starting…" : "Start Session"}
            </button>
            <button
              className={styles.btnGhost}
              onClick={() => { setMode(""); setError(""); }}
            >
              Back
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className={styles.btnStack}>
            <button
              className={styles.btnPrimary}
              onClick={handleJoinSession}
              disabled={loading}
            >
              {loading ? "Joining…" : "Join Session"}
            </button>
            <button
              className={styles.btnGhost}
              onClick={() => { setMode(""); setError(""); }}
            >
              Back
            </button>
          </div>
        )}
      </div>

      {/* Login popup */}
      {showLoginPopup && (
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <h2 className={styles.popupTitle}>Ops Login Required</h2>

            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Email"
            />

            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Password"
            />

            {loginError && <div className={styles.error}>{loginError}</div>}

            <div className={styles.btnStack}>
              <button
                className={styles.btnPrimary}
                onClick={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading ? "Logging in…" : "Login & Start Session"}
              </button>
              <button
                className={styles.btnGhost}
                onClick={() => { setShowLoginPopup(false); setLoginError(""); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionLanding;
