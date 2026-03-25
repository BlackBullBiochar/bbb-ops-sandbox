import { useState, useContext, useMemo } from "react";
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
const makeSiteIcon = (hasStocktake) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${hasStocktake ? "#B0E000" : "#575757"};
      border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

// ── Bag comparison builder ───────────────────────────────────────────────────
function buildRows(dbbags = [], bags = []) {
  const scannedSet = new Set(bags.map((b) => (typeof b === "string" ? b : b.charcode)));
  const dbSet = new Set(dbbags);
  const rows = [];

  for (const code of dbbags) {
    if (scannedSet.has(code)) {
      rows.push({ db: code, scanned: code, match: true });
    } else {
      rows.push({ db: code, scanned: null, match: false });
    }
  }
  for (const bag of bags) {
    const code = typeof bag === "string" ? bag : bag.charcode;
    if (!dbSet.has(code)) {
      rows.push({ db: null, scanned: code, match: false });
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

// ── Main page ────────────────────────────────────────────────────────────────
const StocktakePage = () => {
  const { user } = useContext(UserContext);
  const { stocktakes, sites, loading, error, refetch } = useStocktakes();

  // QR code URL
  const qrUrl = `${window.location.origin}/stocktake/session`;

  // Start session state (desktop)
  const [startSiteId, setStartSiteId] = useState("");
  const [startLoading, setStartLoading] = useState(false);
  const [startResult, setStartResult] = useState(null); // { code, isExisting }

  // Bag comparison popup
  const [comparisonStocktake, setComparisonStocktake] = useState(null);

  // Map selected site overlay
  const [mapSite, setMapSite] = useState(null);

  // Sites with map coordinates
  const mappableSites = useMemo(
    () => sites.filter((s) => s.lat != null && s.lng != null),
    [sites]
  );

  // Relevant sites for stocktake (Pyrolysis + Storage)
  const relevantSites = useMemo(
    () => sites.filter(
      (s) => (s.category === "Pyrolysis" || s.category === "Storage") &&
             !/test/i.test(s.name) && !/test/i.test(s.full_name)
    ),
    [sites]
  );

  // ── Start session from desktop ──
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
    } catch {
      alert("Network error");
    } finally {
      setStartLoading(false);
    }
  };

  // ── Comparison popup ──
  const openComparison = (stocktake) => setComparisonStocktake(stocktake);
  const closeComparison = () => setComparisonStocktake(null);

  return (
    <div className={styles.page}>
      <ScreenHeader name="Stocktake" content="Manage bag stocktakes across all sites" />

      {/* ── Top action bar ── */}
      <div className={styles.topBar}>
        {/* QR Code */}
        <div className={styles.qrBlock}>
          <QRCodeSVG value={qrUrl} size={100} bgColor="#fff" fgColor="#323232" />
          <div className={styles.qrLabel}>
            Scan to start or join a session on your phone
          </div>
          <div className={styles.qrUrl}>{qrUrl}</div>
        </div>

        {/* Start session */}
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
      </div>

      {/* ── Sites summary table ── */}
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
                  <th className={styles.th}>Category</th>
                  <th className={styles.th}>DB Bags</th>
                  <th className={styles.th}>Last Stocktake</th>
                  <th className={styles.th}>Discrepancy</th>
                  <th className={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {relevantSites.map((site) => {
                  const last = lastStocktakeForSite(stocktakes, site._id);
                  const dbCount = last?.dbbags?.length ?? "—";
                  const scannedCount = last?.bags?.length ?? "—";
                  const disc =
                    typeof dbCount === "number" && typeof scannedCount === "number"
                      ? dbCount - scannedCount
                      : null;
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
                      <td className={styles.td}>
                        <span className={site.category === "Pyrolysis" ? styles.badgePyro : styles.badgeStorage}>
                          {site.category}
                        </span>
                      </td>
                      <td className={styles.td}>{dbCount}</td>
                      <td className={styles.td}>{scannedCount}</td>
                      <td className={styles.td}>
                        {disc !== null ? (
                          <span className={disc === 0 ? styles.discGood : styles.discBad}>
                            {disc === 0 ? "✓" : `−${disc}`}
                          </span>
                        ) : "—"}
                      </td>
                      <td className={styles.td}>{dateStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Leaflet map ── */}
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
                    icon={makeSiteIcon(!!last)}
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

            {/* Map site overlay */}
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

      {/* ── Bag comparison popup ── */}
      {comparisonStocktake && (
        <BagComparisonPopup
          stocktake={comparisonStocktake}
          onClose={closeComparison}
        />
      )}
    </div>
  );
};

// ── Map site overlay ─────────────────────────────────────────────────────────
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

// ── Bag comparison popup ─────────────────────────────────────────────────────
const BagComparisonPopup = ({ stocktake, onClose }) => {
  const rows = buildRows(stocktake.dbbags, stocktake.bags);
  const matched = rows.filter((r) => r.match).length;
  const total = stocktake.dbbags?.length ?? 0;

  const site = stocktake._site;
  const siteName = typeof site === "object" ? site.full_name : "Site";
  const dateStr = new Date(stocktake.starttime).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
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
          <div className={styles.compColHeader}>In Database</div>
          <div className={styles.compColHeader}>Scanned</div>
        </div>

        <div className={styles.compRows}>
          {rows.map((row, i) => (
            <div
              key={i}
              className={row.match ? styles.compRowGreen : styles.compRowRed}
            >
              <span className={styles.compCell}>{row.db ?? ""}</span>
              <span className={styles.compCell}>{row.scanned ?? ""}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StocktakePage;
