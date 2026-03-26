import { useState, useContext, useMemo, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { QRCodeSVG } from "qrcode.react";

import { useStocktakes } from "../../hooks/useStocktakes";
import { UserContext } from "../../UserContext";
import { API } from "../../config/api";

import ScreenHeader from "../ScreenHeader";
import styles from "./StocktakePage.module.css";

// ── Custom BBB-themed map marker ────────────────────────────────────────────
const makeSiteIcon = (hasStocktake, name, labelSide = "above") => {
  const labelStyle = `
    position:absolute;
    background:#fff;
    color:#323232;
    font-size:11px;
    font-weight:700;
    font-family:sans-serif;
    padding:2px 6px;
    border-radius:4px;
    white-space:nowrap;
    box-shadow:0 1px 4px rgba(0,0,0,0.25);
  `;
  const labelPos =
    labelSide === "right"  ? "top:50%;left:calc(100% + 5px);transform:translateY(-50%);" :
    labelSide === "left"   ? "top:50%;right:calc(100% + 5px);transform:translateY(-50%);" :
                             "bottom:calc(100% + 3px);left:50%;transform:translateX(-50%);";

  const html = `<div style="position:relative;width:14px;height:14px;">
    <div style="
      width:14px;height:14px;border-radius:50%;
      background:${hasStocktake ? "#B0E000" : "#575757"};
      border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    "></div>
    <div style="${labelStyle}${labelPos}">${name}</div>
  </div>`;

  return L.divIcon({ className: "", html, iconSize: [14, 14], iconAnchor: [7, 7] });
};

// ── Bag comparison builder ───────────────────────────────────────────────────
function buildRows(dbbags = [], bags = []) {
  const bagByCode = new Map(
    bags.map((b) => (typeof b === "string" ? [b, { charcode: b, note: "", location: "" }] : [b.charcode, b]))
  );
  const dbSet = new Set(dbbags);
  const rows = [];

  for (const code of dbbags) {
    if (bagByCode.has(code)) {
      const bag = bagByCode.get(code);
      rows.push({ db: code, scanned: code, note: bag.note || "", location: bag.location || "", match: true });
    } else {
      rows.push({ db: code, scanned: null, note: "", location: "", match: false });
    }
  }

  for (const [code, bag] of bagByCode) {
    if (!dbSet.has(code)) {
      rows.push({ db: null, scanned: code, note: bag.note || "", location: bag.location || "", match: false });
    }
  }

  return rows;
}

// ── Helper: last stocktake per site ─────────────────────────────────────────
function lastStocktakeForSite(stocktakes, siteId) {
  const forSite = stocktakes.filter(
    (s) => (s._site?._id || s._site) === siteId
  );
  if (!forSite.length) return null;
  return forSite.sort((a, b) => new Date(b.starttime) - new Date(a.starttime))[0];
}

// ── Map click-away helper ────────────────────────────────────────────────────
function MapClickAway({ onClickAway }) {
  useMapEvents({ click: onClickAway });
  return null;
}

const StocktakePage = () => {
  const { user } = useContext(UserContext);
  const { stocktakes, sites, loading, error, refetch } = useStocktakes();

  const qrUrl = `${window.location.origin}/stocktake/session`;

  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const [endingCode, setEndingCode] = useState(null);
  const [endCountdown, setEndCountdown] = useState(0);

  const [removingMemberKey, setRemovingMemberKey] = useState(null);
  const [opsNotice, setOpsNotice] = useState("");

  const [startSiteId, setStartSiteId] = useState("");
  const [startLoading, setStartLoading] = useState(false);
  const [startResult, setStartResult] = useState(null);

  const [comparisonStocktake, setComparisonStocktake] = useState(null);
  const [mapSite, setMapSite] = useState(null);

  const fetchActiveSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/stocktake/active`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const json = await res.json();
      setActiveSessions(json.stocktakes || []);
    } catch (err) {
      console.error("Failed to fetch active sessions", err);
    }
  }, [user.token]);

  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);

  // simple polling fallback so UI refreshes even if socket event is missed
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActiveSessions();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchActiveSessions]);

  // local ops countdown display after requesting full end
  useEffect(() => {
    if (!endingCode) return;
    if (endCountdown <= 0) {
      setEndingCode(null);
      fetchActiveSessions();
      refetch();
      return;
    }

    const t = setTimeout(() => setEndCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [endingCode, endCountdown, fetchActiveSessions, refetch]);

  const mappableSites = useMemo(
    () => sites.filter((s) => s.lat != null && s.lng != null),
    [sites]
  );

  const relevantSites = useMemo(
    () =>
      sites.filter(
        (s) =>
          (s.category === "Pyrolysis" || s.category === "Storage" || s.category === "Processing") &&
          !/test/i.test(s.name) &&
          !/test/i.test(s.full_name)
      ),
    [sites]
  );

  const showOpsNotice = (msg, ms = 5000) => {
    setOpsNotice(msg);
    setTimeout(() => setOpsNotice(""), ms);
  };

  const handleEndSession = async (session_code) => {
    setEndingCode(session_code);
    setEndCountdown(5);

    try {
      const res = await fetch(`${API}/stocktake/session/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ session_code }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEndingCode(null);
        setEndCountdown(0);
        alert(json.error || "Failed to request session end");
      }
    } catch (err) {
      console.error("Failed to end session", err);
      setEndingCode(null);
      setEndCountdown(0);
      alert("Network error");
    }
  };

  const handleRemoveMember = async ({ session_code, member }) => {
    const memberKey = `${session_code}:${member}`;
    setRemovingMemberKey(memberKey);

    try {
      const res = await fetch(`${API}/stocktake/session/remove-member`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ session_code, member }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || "Failed to request user removal");
      } else {
        showOpsNotice(`${member} will be logged out in 5 seconds unless they cancel.`);
      }
    } catch (err) {
      console.error("Failed to remove member", err);
      alert("Network error");
    } finally {
      setRemovingMemberKey(null);
    }
  };

  const handleStartSession = async () => {
    if (!startSiteId) return;
    setStartLoading(true);

    try {
      const res = await fetch(`${API}/stocktake/session/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ siteId: startSiteId }),
      });

      const json = await res.json();

      if (res.status === 409) {
        setStartResult({ code: json.session_code, isExisting: true });
        return;
      }

      if (!res.ok) {
        alert(json.error || "Failed to start session");
        return;
      }

      setStartResult({ code: json.stocktake.session_code, isExisting: false });
      refetch();
      fetchActiveSessions();
    } catch {
      alert("Network error");
    } finally {
      setStartLoading(false);
    }
  };

  // ── Ops socket — joins active session rooms to receive cancellation events ──
  const opsSocketRef = useRef(null);
  const joinedRoomsRef = useRef(new Set());
  const opsHandlersRef = useRef({});

  // Keep handlers ref fresh every render so socket callbacks never go stale
  opsHandlersRef.current = {
    onEndCancelled: (data) => {
      setEndingCode(null);
      setEndCountdown(0);
      fetchActiveSessions();
      showOpsNotice(
        data?.name
          ? `${data.name} cancelled session termination as they are still scanning.`
          : "Session termination was cancelled."
      );
    },
    onRemovalCancelled: (data) => {
      fetchActiveSessions();
      showOpsNotice(
        data?.name
          ? `${data.name} cancelled their logout as they are still scanning.`
          : "User logout was cancelled."
      );
    },
    onSessionEnded: () => {
      setEndingCode(null);
      setEndCountdown(0);
      fetchActiveSessions();
      refetch();
    },
    onMemberRemoved: () => {
      fetchActiveSessions();
    },
  };

  // Create the socket once on mount
  useEffect(() => {
    const socket = io(API, { transports: ["websocket", "polling"] });
    opsSocketRef.current = socket;

    // Re-join known rooms after a reconnect
    socket.on("connect", () => {
      joinedRoomsRef.current.forEach((code) => {
        socket.emit("join_session", { session_code: code });
      });
    });

    socket.on("session_end_cancelled",   (data) => opsHandlersRef.current.onEndCancelled(data));
    socket.on("member_removal_cancelled",(data) => opsHandlersRef.current.onRemovalCancelled(data));
    socket.on("session_ended",           ()     => opsHandlersRef.current.onSessionEnded());
    socket.on("member_removed",          ()     => opsHandlersRef.current.onMemberRemoved());

    return () => socket.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Join/leave rooms as the active session list changes
  useEffect(() => {
    const socket = opsSocketRef.current;
    if (!socket) return;

    const currentCodes = new Set(activeSessions.map((s) => s.session_code));

    currentCodes.forEach((code) => {
      if (!joinedRoomsRef.current.has(code)) {
        socket.emit("join_session", { session_code: code });
        joinedRoomsRef.current.add(code);
      }
    });

    joinedRoomsRef.current.forEach((code) => {
      if (!currentCodes.has(code)) {
        socket.emit("leave_session", { session_code: code });
        joinedRoomsRef.current.delete(code);
      }
    });
  }, [activeSessions]);

  const openComparison = (stocktake) => setComparisonStocktake(stocktake);
  const closeComparison = () => setComparisonStocktake(null);

  return (
    <div className={styles.page}>
      <ScreenHeader name="Stocktake" content="Manage bag stocktakes across all sites" />

      {opsNotice && <div className={styles.opsNotice}>{opsNotice}</div>}

      <div className={styles.topBar}>
        <div className={styles.qrBlock}>
          <QRCodeSVG value={qrUrl} size={"fill-content"} bgColor="#fff" fgColor="#323232" />
          <div className={styles.qrLabel}>
            Scan to start or join a session on your phone
          </div>
          <div className={styles.qrUrl}>{qrUrl}</div>
        </div>

        <div className={styles.startBlock}>
          <div className={styles.startTitle}>Start New Session</div>
          <select
            className={styles.siteSelect}
            value={startSiteId}
            onChange={(e) => setStartSiteId(e.target.value)}
          >
            <option value="">Select site…</option>
            {relevantSites.map((s) => (
              <option key={s._id} value={s._id}>
                {s.full_name} ({s.category})
              </option>
            ))}
          </select>

          <button
            className={styles.startBtn}
            onClick={handleStartSession}
            disabled={startLoading || !startSiteId}
          >
            {startLoading ? "Starting…" : "Start Session"}
          </button>

          {startResult && (
            <div className={styles.startResult}>
              <div className={styles.startResultLabel}>
                {startResult.isExisting ? "⚠ Active session already exists" : "✓ Session started"}
              </div>
              <div className={styles.startResultCode}>{startResult.code}</div>
              <div className={styles.startResultSub}>Share this code with your team</div>
              <button className={styles.startResultClose} onClick={() => setStartResult(null)}>
                Dismiss
              </button>
            </div>
          )}
        </div>

        <div className={styles.activeBlock}>
          <div className={styles.activeTitle}>Active Sessions</div>

          {activeSessions.length === 0 && (
            <div className={styles.activeEmpty}>No active sessions</div>
          )}

          {activeSessions.map((st) => {
            const siteName = st._site?.full_name ?? "Unknown site";
            const isSelected = selectedSessionId === st._id;
            const isEnding = endingCode === st.session_code;
            const members = st.active_members || [];

            return (
              <div key={st._id} className={styles.activeSessionCard}>
                <button
                  className={styles.activeSessionSummary}
                  onClick={() =>
                    setSelectedSessionId((prev) => (prev === st._id ? null : st._id))
                  }
                >
                  <div className={styles.activeSessionSummaryLeft}>
                    <div className={styles.activeSessionSite}>{siteName}</div>
                    <div className={styles.activeSessionMeta}>
                      {st.bags?.length ?? 0} / {st.dbbags?.length ?? 0} bags
                      {members.length > 0 && (
                        <> · {members.length} user{members.length !== 1 ? "s" : ""} logged in</>
                      )}
                    </div>
                  </div>

                  <div className={styles.activeSessionSummaryRight}>
                    <div className={styles.activeSessionCode}>{st.session_code}</div>
                    <div className={styles.activeSessionExpand}>
                      {isSelected ? "Hide" : "View"}
                    </div>
                  </div>
                </button>

                {isSelected && (
                  <div className={styles.activeSessionDetails}>
                    <div className={styles.activeUsersTitle}>Logged-in users</div>

                    {members.length === 0 ? (
                      <div className={styles.activeEmpty}>No users currently logged in</div>
                    ) : (
                      <div className={styles.activeUsersList}>
                        {members.map((member, i) => {
                          const memberName =
                            typeof member === "string"
                              ? member
                              : member?.name || member?.full_name || member?.username || `User ${i + 1}`;

                          const rowKey = `${st.session_code}:${memberName}`;
                          const isRemoving = removingMemberKey === rowKey;

                          return (
                            <div key={rowKey} className={styles.activeUserRow}>
                              <div className={styles.activeUserInfo}>
                                <div className={styles.activeUserName}>{memberName}</div>
                              </div>

                              <button
                                className={styles.removeUserBtn}
                                onClick={() =>
                                  handleRemoveMember({
                                    session_code: st.session_code,
                                    member: memberName,
                                  })
                                }
                                disabled={!!endingCode || isRemoving}
                              >
                                {isRemoving ? "Requesting…" : "Remove User"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className={styles.sessionActions}>
                      {isEnding ? (
                        <div className={styles.endingLabel}>Ending in {endCountdown}s…</div>
                      ) : (
                        <button
                          className={styles.endBtn}
                          onClick={() => handleEndSession(st.session_code)}
                          disabled={endingCode !== null}
                        >
                          End Session For Everyone
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Sites</div>

        {loading && <div className={styles.loadingMsg}>Loading…</div>}
        {error && <div className={styles.errorMsg}>{error}</div>}

        {!loading && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Site</th>
                  <th className={`${styles.th} ${styles.thCenter}`}>Category</th>
                  <th className={`${styles.th} ${styles.thCenter}`}>Expected Bags</th>
                  <th className={`${styles.th} ${styles.thCenter}`}>Last Stocktake</th>
                  <th className={`${styles.th} ${styles.thCenter}`}>Discrepancy</th>
                  <th className={`${styles.th} ${styles.thCenter}`}>Date</th>
                </tr>
              </thead>
              <tbody>
                {relevantSites.map((site) => {
                  const last = lastStocktakeForSite(stocktakes, site._id);
                  const dbCount = last?.dbbags?.length ?? "—";
                  const scannedCount = last?.bags?.length ?? "—";
                  const disc = last ? (() => {
                    const dbSet = new Set(last.dbbags ?? []);
                    const bags = last.bags ?? [];
                    const correctCount = bags.filter(b => !b.note && dbSet.has(b.charcode)).length;
                    const incorrectCount = bags.filter(b => b.note).length;
                    const missingCount = (last.dbbags?.length ?? 0) - correctCount;
                    return missingCount + incorrectCount;
                  })() : null;
                  const dateStr = last
                    ? new Date(last.starttime).toLocaleDateString("en-GB")
                    : "No stocktake";

                  return (
                    <tr
                      key={site._id}
                      className={styles.tr}
                      onClick={() => last && openComparison(last)}
                      title={last ? "Click to view bag comparison" : "No stocktake yet"}
                    >
                      <td className={styles.td}>{site.full_name}</td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>
                        <span
                          className={
                            site.category === "Pyrolysis"
                              ? styles.badgePyro
                              : site.category === "Processing"
                              ? styles.badgeProcessing
                              : styles.badgeStorage
                          }
                        >
                          {site.category}
                        </span>
                      </td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>{dbCount}</td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>{scannedCount}</td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>
                        {disc !== null ? (
                          <span className={disc === 0 ? styles.discGood : styles.discBad}>
                            {disc === 0 ? "✓" : disc}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={`${styles.td} ${styles.tdCenter}`}>{dateStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Site Map</div>
        {mappableSites.length === 0 ? (
          <div className={styles.mapPlaceholder}>
            No site coordinates configured yet. Add <code>lat</code> and <code>lng</code> values to
            sites to display them on the map.
          </div>
        ) : (
          <div className={styles.mapWrap}>
            <MapContainer
              center={[54.5, -2]}
              zoom={6}
              className={styles.map}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapClickAway onClickAway={() => setMapSite(null)} />
              {mappableSites.map((site) => {
                const last = lastStocktakeForSite(stocktakes, site._id);
                return (
                  <Marker
                    key={site._id}
                    position={[site.lat, site.lng]}
                    icon={makeSiteIcon(
                      !!last,
                      site.full_name,
                      /jenkinson/i.test(site.full_name) ? "right"
                      : /bowness/i.test(site.full_name) ? "left"
                      : "above"
                    )}
                    eventHandlers={{
                      click: (e) => {
                        e.originalEvent.stopPropagation();
                        setMapSite(site);
                      },
                    }}
                  />
                );
              })}
            </MapContainer>

            {mapSite && (
              <MapSiteOverlay
                site={mapSite}
                stocktakes={stocktakes.filter(
                  (s) => (s._site?._id || s._site) === mapSite._id
                )}
                onSelectStocktake={openComparison}
                onClose={() => setMapSite(null)}
              />
            )}
          </div>
        )}
      </div>

      {comparisonStocktake && (
        <BagComparisonPopup stocktake={comparisonStocktake} onClose={closeComparison} />
      )}
    </div>
  );
};

const MapSiteOverlay = ({ site, stocktakes, onSelectStocktake, onClose }) => {
  const last = stocktakes[0]
    ? [...stocktakes].sort((a, b) => new Date(b.starttime) - new Date(a.starttime))[0]
    : null;

  return (
    <div className={styles.mapOverlay}>
      <button className={styles.mapOverlayClose} onClick={onClose}>✕</button>
      <div className={styles.mapOverlaySite}>{site.full_name}</div>
      <div className={styles.mapOverlayCategory}>{site.category}</div>

      {last && (
        <div className={styles.mapOverlayCounts}>
          <span className={styles.mapOverlayCount}>{last.dbbags?.length ?? 0} in DB</span>
          <span className={styles.mapOverlaySep}>·</span>
          <span className={styles.mapOverlayCount}>{last.bags?.length ?? 0} last stocktake</span>
        </div>
      )}

      <div className={styles.mapOverlayHistory}>
        {stocktakes.length === 0 && (
          <div className={styles.mapOverlayEmpty}>No stocktakes yet</div>
        )}
        {[...stocktakes]
          .sort((a, b) => new Date(b.starttime) - new Date(a.starttime))
          .map((st) => (
            <div
              key={st._id}
              className={styles.mapOverlayRow}
              onClick={() => onSelectStocktake(st)}
            >
              <span className={styles.mapOverlayDate}>
                {new Date(st.starttime).toLocaleDateString("en-GB")}
              </span>
              <span className={styles.mapOverlayBags}>
                {st.bags?.length ?? 0} / {st.dbbags?.length ?? 0}
              </span>
              <span className={styles.mapOverlayArrow}>›</span>
            </div>
          ))}
      </div>
    </div>
  );
};

const BagComparisonPopup = ({ stocktake, onClose }) => {
  const rows = buildRows(stocktake.dbbags, stocktake.bags);
  const matched = rows.filter((r) => r.match).length;
  const total = stocktake.dbbags?.length ?? 0;

  const site = stocktake._site;
  const siteName = typeof site === "object" ? site.full_name : "Site";
  const dateStr = new Date(stocktake.starttime).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={styles.popupBg} onClick={onClose}>
      <div className={styles.popupCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.popupHeader}>
          <div>
            <div className={styles.popupSite}>{siteName}</div>
            <div className={styles.popupDate}>{dateStr} · {matched}/{total} matched</div>
          </div>
          <button className={styles.popupClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.compCols}>
          <div className={styles.compColHeader}>Expected Bags</div>
          <div className={styles.compColHeader}>Scanned</div>
        </div>

        <div className={styles.compRows}>
          {rows.map((row, i) => (
            <div
              key={i}
              className={row.match ? styles.compRowGreen : styles.compRowRed}
            >
              <span className={styles.compCell}>{row.db ?? ""}</span>
              <span className={styles.compCell}>
                {row.scanned ?? ""}
                {row.scanned && row.note === "wrong_site" && <><span className={styles.noteWrongSite}>wrong site</span>{row.location && <span className={styles.noteLocation}>{row.location}</span>}</>}
                {row.scanned && row.note === "unlabelled"  && <span className={styles.noteUnlabelled}>unlabelled</span>}
                {row.scanned && row.note === "not_in_db"   && <span className={styles.noteNotInDb}>not in DB</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StocktakePage;