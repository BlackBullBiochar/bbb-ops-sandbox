"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { CSVLink } from "react-csv";
import IndexSearch from "../IndexSearchbar";
import { useInventorySearch } from "../../hooks/useInventorySearch";
import styles from "./DbSearch.module.css";
import ScreenHeader from "../ScreenHeader";
import ModuleMain from "../ModuleMain";
import Module from "../Module";
import MultiSelector from "../MultiSelect";
import iconCSV from "../../assets/images/iconCSV.png";
import CharcodeOverlayCard from "../CharcodeOverlayCard";
import { FilterProvider } from "../../contexts/FilterContext";

// ---------- LOGGING HELPERS ----------
const NS = "DbSearch";
const log = (...args) => console.log(`[%c${NS}%c]`, "color:#34B61F;font-weight:bold", "color:inherit", ...args);
const warn = (...args) => console.warn(`[%c${NS}%c]`, "color:#B0E000;font-weight:bold", "color:inherit", ...args);
const err = (...args) => console.error(`[%c${NS}%c]`, "color:#ff5555;font-weight:bold", "color:inherit", ...args);

// ---------- CONSTS ----------
const INDEX_OPTIONS = [
  { value: "bags", label: "Bags" },
  { value: "orders", label: "Orders" },
  { value: "deliveries", label: "Deliveries" },
];

const DEFAULT_FIELDS_BY_INDEX = {
  bags: ["charcode", "bagging_date", "status", "site", "weight", "ebc_status"],
  orders: ["charcode", "bagging_date", "status", "order_id", "delivery_date"],
  deliveries: ["charcode", "bagging_date", "status", "delivery_id", "delivery_date"],
};

const FIELD_LABELS = {
  charcode: "Charcode",
  bagging_date: "Bagging date",
  weight: "Weight (kg)",
  moisture_content: "Moisture (%)",
  status: "Bag Status",
  site: "Site",
  order_id: "Order ID",
  delivery_id: "Delivery ID",
  delivery_date: "Delivery date",
  pickup_date: "Pickup date",
  ebc_status: "EBC Status",
  application_date: "Application Date",
};

const ALL_FIELDS = [
  "charcode",
  "bagging_date",
  "ebc_status",
  "weight",
  "status",
  "site",
  "moisture_content",
  "order_id",
  "delivery_id",
  "delivery_date",
  "pickup_date",
  "application_date",
];

const labelize = (key) =>
  FIELD_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ---------- HELPERS ----------
const mapSiteToCodeAndId = (siteLike) => {
  if (!siteLike) return { siteCode: null, siteId: null };
  if (typeof siteLike === "object") {
    const siteId = siteLike._id || siteLike.id || null;
    const raw = (siteLike.code || siteLike.name || "").toString().toUpperCase();
    const siteCode = raw === "ARA" || raw === "JNR" ? raw : null;
    return { siteCode, siteId };
  }
  const raw = siteLike.toString().toUpperCase();
  if (raw === "ARA" || raw === "JNR") return { siteCode: raw, siteId: null };
  return { siteCode: null, siteId: raw || null };
};

// ---------- COMPONENT ----------
const DbSearch = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    log("Mounted");
  }, []);

  const [selectedIndex, setSelectedIndex] = useState("bags");
  const [fields, setFields] = useState(ALL_FIELDS);
  const [selectedFields, setSelectedFields] = useState(DEFAULT_FIELDS_BY_INDEX["bags"]);
  const [query, setQuery] = useState("");

  // date state (auto-applied if set)
  const [isRange, setIsRange] = useState(false);
  const [singleDate, setSingleDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // multi-select filters
  const [statusFilters, setStatusFilters] = useState([]);
  const [ebcStatusFilters, setEbcStatusFilters] = useState([]);
  const [siteFilters, setSiteFilters] = useState([]);

  const { fetchInventory, loading, error, rows } = useInventorySearch();

  // overlay state
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedBag, setSelectedBag] = useState(null);

  // interactive guard (safe for text nodes)
  const isInteractive = (el, container) => {
    const node = el && el.nodeType === 1 ? el : el?.parentElement || null;
    if (!node) return false;

    const hit = node.closest("a,button,input,select,textarea,label,[role='button']");
    // treat the row itself as non-interactive; only block if a *descendant* control was hit
    if (!hit) return false;
    if (container && hit === container) return false;
    return true;
  };


  // DEBUG effects for state
  useEffect(() => { log("selectedIndex:", selectedIndex); }, [selectedIndex]);
  useEffect(() => { log("selectedFields:", selectedFields); }, [selectedFields]);
  useEffect(() => { log("query:", query); }, [query]);
  useEffect(() => { log("filters:", { statusFilters, ebcStatusFilters, siteFilters }); }, [statusFilters, ebcStatusFilters, siteFilters]);
  useEffect(() => { log("date:", { isRange, singleDate, fromDate, toDate }); }, [isRange, singleDate, fromDate, toDate]);
  useEffect(() => { log("loading:", loading, "error:", error); }, [loading, error]);
  useEffect(() => { log("rows length:", rows?.length ?? 0); }, [rows]);

  // adjust defaults when index changes
  useEffect(() => {
    const next = DEFAULT_FIELDS_BY_INDEX[selectedIndex] || ALL_FIELDS.slice(0, 5);
    log("Index changed, setting default fields:", next);
    setSelectedFields(next);
  }, [selectedIndex]);

  // whether date filtering is active
  const isDateActive = useMemo(() => {
    const active = isRange ? Boolean(fromDate && toDate) : Boolean(singleDate);
    log("isDateActive recompute:", active);
    return active;
  }, [isRange, singleDate, fromDate, toDate]);

  const handleFieldToggle = (field) => {
    log("Toggle field:", field);
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleToggleRange = () => {
    log("Toggle range before:", isRange);
    setIsRange((v) => !v);
  };

  const handleDateChange = (type, value) => {
    log("Date change:", type, value);
    if (type === "single") setSingleDate(value);
    if (type === "from") setFromDate(value);
    if (type === "to") setToDate(value);
  };

  const handleSearch = async () => {
    // fields the overlay needs to render fully
    const requiredForOverlay = [
      "_id",
      "charcode",
      "bagging_date",          // ISO date we slice to YYYY-MM-DD
      "_site", "site", "site_id", "siteId",
      "weight",
      "status",
      "batch_id", "batchId",
      "ebc_status",            // current
      "ebc_status_history",    // <-- full history (snake_case)
      "ebc_status_reason",
      "ebcStatusReason",
      "faultMessages"
    ];

    // don’t show these extra columns; just fetch them
    const fieldsForFetch = Array.from(new Set([
      ...selectedFields,            // user-selected visible columns
      ...requiredForOverlay         // invisible overlay data
    ]));

    const payload = {
      selectedIndex,
      queryText: query,
      selectedFields: fieldsForFetch,
      isRange,
      singleDate: isDateActive && !isRange ? singleDate : "",
      fromDate: isDateActive && isRange ? fromDate : "",
      toDate: isDateActive && isRange ? toDate : "",
      statusFilters,
      ebcStatusFilters,
      siteFilters,
    };

    console.groupCollapsed("[DbSearch] handleSearch payload");
    console.table(payload);
    console.groupEnd();

    try {
      await fetchInventory(payload);
      console.log("[DbSearch] fetchInventory OK");
    } catch (e) {
      console.error("[DbSearch] fetchInventory error:", e);
    }
  };


  // search gating
  const isFirstRun = useRef(true);
  const initialFieldCount = useRef(selectedFields.length);

  useEffect(() => {
    const hasQuery = query.trim() !== "";
    const fieldCountChanged = selectedFields.length !== initialFieldCount.current;

    log("search effect →", { hasQuery, fieldCountChanged, isFirstRun: isFirstRun.current });

    if (isFirstRun.current) {
      isFirstRun.current = false;
      if (!fieldCountChanged && !hasQuery) {
        warn("First run, no query and no field-count change → skip search");
        return;
      }
    }
    if (fieldCountChanged || hasQuery) {
      handleSearch().then(() => {
        initialFieldCount.current = selectedFields.length;
        log("Search done; updated initialFieldCount:", initialFieldCount.current);
      });
    }
  }, [
    selectedFields.length,
    query,
    selectedIndex,
    isRange,
    singleDate,
    fromDate,
    toDate,
    statusFilters,
    ebcStatusFilters,
    siteFilters,
  ]);

  const openOverlay = (item) => {
    console.groupCollapsed(`[${NS}] openOverlay raw item`);
    console.log(item);
    console.groupEnd();

    const siteLike = item._site ?? item.site ?? item.site_id ?? item.siteId ?? null;
    const { siteCode, siteId } = mapSiteToCodeAndId(siteLike);

    const parsed = {
      ...item,
      _id: item._id ?? item.id ?? null,
      charcode: item.charcode ?? item.code ?? "",
      bagging_date: String(item.bagging_date ?? item.baggingDate ?? ""),
      _site: siteId || null,
      _siteCode: siteCode || null,
      ebcStatuses: item.ebcStatuses ?? item.ebc_status_history ?? [],
      ebcCertStatus: item.ebcCertStatus ?? item.ebc_status ?? "",
      ebcStatusReason: item.ebcStatusReason ?? item.ebc_status_reason ?? "",
      faultMessages: item.faultMessages ?? [],
      weight: item.weight ?? null,
      batch_id: item.batch_id ?? item.batchId ?? null,
      status: item.status ?? "",
    };

    console.groupCollapsed(`[${NS}] parsed for overlay`);
    console.table(parsed);
    console.groupEnd();

    setSelectedBag(parsed);
    setOverlayOpen(true);
    log("Overlay open → true");
  };

  const closeOverlay = () => {
    log("Closing overlay");
    setOverlayOpen(false);
    setSelectedBag(null);
  };

  return (
    <FilterProvider>
      <div className={styles.mainWhiteContainer}>
        <ScreenHeader name={"Inventory"} />
        <ModuleMain>
          <div className={styles.container}>
            {/* Top search + date */}
            <div className={styles.topBar}>
              <IndexSearch
                isRange={isRange}
                singleDate={singleDate}
                fromDate={fromDate}
                toDate={toDate}
                onToggle={handleToggleRange}
                onChange={handleDateChange}
                onFetch={() => { log("IndexSearch onFetch"); handleSearch(); }}
                selectedIndex={selectedIndex}
                indexOptions={INDEX_OPTIONS}
                onIndexChange={(v) => { log("Index change:", v); setSelectedIndex(v); }}
                onKeyDown={handleSearch}
                searchQuery={query}
                onSearchChange={(v) => { log("Search change:", v); setQuery(v); }}
              />
              {rows.length > 0 && (
                <CSVLink
                  data={rows.map((row) => {
                    const obj = {};
                    selectedFields.forEach((f) => (obj[f] = row[f]));
                    return obj;
                  })}
                  headers={selectedFields.map((f) => ({ label: labelize(f), key: f }))}
                  filename={`${selectedIndex}-inventory-export.csv`}
                  className={styles.downloadButton}
                  onClick={() => log("CSV export click")}
                >
                  <img src={iconCSV} className={styles.iconCSV} />
                </CSVLink>
              )}
            </div>

            {/* Filters */}
            <div className={styles.filtersRow}>
              <MultiSelector
                name="Status"
                placeholder="All"
                labelStyle="top"
                data={[
                  { name: "Bagged", value: "bagged" },
                  { name: "Picked Up", value: "pickedUp" },
                  { name: "Delivered", value: "delivered" },
                  { name: "Storage", value: "delivered_to_storage" },
                  { name: "Applied", value: "applied" },
                ]}
                values={statusFilters}
                onChange={(v) => { log("Status filter:", v); setStatusFilters(v); }}
              />

              <MultiSelector
                name="EBC Status"
                placeholder="All"
                labelStyle="top"
                data={[
                  { name: "Approved", value: "Approved" },
                  { name: "Flagged", value: "Flagged" },
                  { name: "Rejected", value: "Rejected" },
                  { name: "Post-Approved", value: "Post-Approved" },
                  { name: "Pending", value: "Pending" },
                ]}
                values={ebcStatusFilters}
                onChange={(v) => { log("EBC filter:", v); setEbcStatusFilters(v); }}
              />

              <MultiSelector
                name="Site"
                placeholder="All"
                labelStyle="top"
                data={[
                  { name: "Ahlstrom", value: "ARA" },
                  { name: "Jenkinson", value: "JNR" },
                ]}
                values={siteFilters}
                onChange={(v) => { log("Site filter:", v); setSiteFilters(v); }}
              />
            </div>

            {/* Field selector */}
            <div className={styles.contentGrid}>
              {fields.map((field) => {
                const id = `field-${field}`;
                return (
                  <ModuleMain
                    key={field}
                    spanRow={1}
                    spanColumn={2}
                    height="4rem"
                    alignItems="center"
                    marginBottom="0rem"
                  >
                    <label className={styles.fieldLabel} htmlFor={id} title={field}>
                      <input
                        id={id}
                        type="checkbox"
                        checked={selectedFields.includes(field)}
                        onChange={() => handleFieldToggle(field)}
                        className={styles.cb}
                      />
                      {labelize(field)}
                    </label>
                  </ModuleMain>
                );
              })}
            </div>

            {/* Results table */}
            <div className={styles.tableContainer}>
              <ModuleMain marginBottom="0rem">
                <table className={styles.orderTable}>
                  <thead>
                    <tr className={styles.orderHeaderRow}>
                      {selectedFields.map((field) => (
                        <th key={field}>{labelize(field)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr className={styles.tableRow}>
                        <td colSpan={selectedFields.length}>Loading…</td>
                      </tr>
                    )}
                    {error && !loading && (
                      <tr className={styles.tableRow}>
                        <td colSpan={selectedFields.length}>{String(error)}</td>
                      </tr>
                    )}
                    {!loading && !error && rows.map((item, idx) => {
                      const clickable = Boolean(item?.charcode);
                      return (
                        <tr
                          key={idx}
                          className={`${styles.tableRow} ${clickable ? styles.clickableRow : ""}`}
                          onClick={(e) => {
                            log("Row click idx:", idx, "clickable:", clickable);
                            if (clickable && !isInteractive(e.target, e.currentTarget)) openOverlay(item);
                          }}
                          onKeyDown={(e) => {
                            if (!clickable) return;
                            if (!isInteractive(e.target, e.currentTarget) && (e.key === "Enter" || e.key === " ")) {
                              e.preventDefault();
                              log("Row keydown open idx:", idx);
                              openOverlay(item);
                            }
                          }}
                          role={clickable ? "button" : undefined}
                        >
                          {selectedFields.map((field) => {
                            let raw;
                            try {
                              raw =
                                field === "bagging_date" ||
                                field === "delivery_date" ||
                                field === "pickup_date" ||
                                field === "application_date"
                                  ? item[field]?.split("T")[0] || ""
                                  : typeof item[field] === "object"
                                  ? JSON.stringify(item[field])
                                  : item[field] ?? "";
                            } catch (e) {
                              err("Cell render error:", { field, item, e });
                              raw = "";
                            }

                            if (field === "status") {
                              const cls =
                                raw === "delivered"
                                  ? styles.statusDelivered
                                  : raw === "upcoming"
                                  ? styles.statusUpcoming
                                  : raw === "applied"
                                  ? styles.statusApplied
                                  : raw === "cancelled"
                                  ? styles.statusCancelled
                                  : undefined;

                              return (
                                <td key={field} className={cls}>
                                  {raw || "N/A"}
                                </td>
                              );
                            }

                            if (field === "ebc_status") {
                              const cls =
                                raw === "Approved"
                                  ? styles.statusDelivered
                                  : raw === "Flagged"
                                  ? styles.statusCancelled
                                  : raw === "Rejected"
                                  ? styles.statusCancelled
                                  : raw === "Post-Approved"
                                  ? styles.statusDelivered
                                  : raw === "Pending"
                                  ? styles.statusPending
                                  : undefined;
                              return (
                                <td key={field} className={cls}>
                                  {raw || "N/A"}
                                </td>
                              );
                            }

                            const isBold =
                              field === "charcode" ||
                              field === "order_id" ||
                              field === "delivery_id";

                            return (
                              <td key={field}>
                                {isBold ? (
                                  <span className={styles.dataBold}>{raw}</span>
                                ) : (
                                  raw
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ModuleMain>
            </div>
          </div>
        </ModuleMain>

        {/* Overlay via portal into body (single shared provider) */}
        {mounted && overlayOpen && selectedBag &&
          createPortal(
            <CharcodeOverlayCard parsed={selectedBag} onClose={closeOverlay} />,
            document.body
          )
        }
      </div>
    </FilterProvider>
  );
};

export default DbSearch;
