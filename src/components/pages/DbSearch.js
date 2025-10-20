"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { CSVLink } from "react-csv";
import { useInventorySearch } from "../../hooks/useInventorySearch";
import styles from "./DbSearch.module.css";
import ScreenHeader from "../ScreenHeader";
import ModuleMain from "../ModuleMain";
import Module from "../Module";
import MultiSelector from "../MultiSelect";
import iconCSV from "../../assets/images/iconCSV.png";
import CharcodeOverlayCard from "../CharcodeOverlayCard";
import { FilterProvider } from "../../contexts/FilterContext";
import Button from "../Button.js";
import ToggleSwitch from "../ToggleSwitch";
import helpers from "../../helpers";
import arrowGrey from "../../assets/images/selectArrowGrey.png";

// ---------- LOGGING HELPERS ----------
const NS = "DbSearch";

// ---------- CONSTS ----------
const INDEX_OPTIONS = [
  { value: "bags", label: "Bags" },
  { value: "orders", label: "Orders" },
  { value: "deliveries", label: "Deliveries" },
  { value: "batches", label: "Batches" },
  { value: "users", label: "Users" },
];

const DEFAULT_FIELDS_BY_INDEX = {
  bags: ["charcode", "bagging_date", "status", "site", "weight", "ebc_status", "batch_id", "moisture_content"],
  orders: ["charcode", "bagging_date", "status", "order_id", "delivery_date"],
  deliveries: ["charcode", "bagging_date", "status", "delivery_id", "delivery_date"],
  batches: ["batch_id","charcode", "bagging_date", "status", "site", "weight", "ebc_status"],
  users: ["user", "charcode", "bagging_date", "status", "site", "weight", "ebc_status"],
};

const FIELD_LABELS = {
  charcode: "Charcode",
  bagging_date: "Bagging date",
  weight: "Weight (kg)",
  moisture_content: "Moisture (%)",
  status: "Bag Status",
  site: "Site",
  batch_id: "Batch ID",
  order_id: "Order ID",
  delivery_id: "Delivery ID",
  delivery_date: "Delivery date",
  pickup_date: "Pickup date",
  ebc_status: "EBC Status",
  application_date: "Application Date",
  user: "User",
  applied_to: "Applied To",
  internal_temperature: "Internal Temp (°C)",
  storage_order_id: "Storage Order ID",
  storage_pickup_date: "Storage Pickup Date",
  storage_delivery_date: "Storage Delivery Date",
};

const ALL_FIELDS = [
  "charcode",
  "bagging_date",
  "ebc_status",
  "weight",
  "status",
  "site",
  "batch_id",
  "moisture_content",
  "order_id",
  "delivery_id",
  "pickup_date",
  "delivery_date",
  "application_date",
  "user",
  "applied_to",
  "internal_temperature",
  "storage_order_id",
  "storage_pickup_date",
  "storage_delivery_date",
];

const labelize = (key) =>
  FIELD_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Format bag status with proper capitalization and no underscores
const formatBagStatus = (status) => {
  if (!status) return "N/A";
  
  // Handle camelCase (like "pickedUp") and snake_case (like "delivered_to_storage")
  const formatted = status
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
    
  return formatted;
};

// Format date to dd/mm/yy format
const formatDate = (dateString) => {
  if (!dateString) return "";
  
  try {
    // Handle ISO format dates (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2); // Last 2 digits of year
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateString; // Return original if formatting fails
  }
};

// Get color class for bag status based on completion order
const getStatusColorClass = (status) => {
  if (!status) return styles.statusUnassigned;
  
  const normalizedStatus = status.toLowerCase().replace(/_/g, '');
  
  switch (normalizedStatus) {
    case 'unassigned':
      return styles.statusUnassigned;
    case 'bagged':
      return styles.statusBagged;
    case 'pickedup':
      return styles.statusPickedUp;
    case 'delivered':
    case 'deliveredtostorage':
      return styles.statusDelivered;
    case 'applied':
      return styles.statusApplied;
    default:
      return styles.statusUnassigned;
  }
};

// Helper function for normalizing options
const normalizeOptions = (options = []) =>
  options.map((opt, i) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt, __i: i };
    }
    const value = String(opt?.value ?? '');
    const label = String(opt?.label ?? value);
    return { value, label, __i: i };
  });

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

// ---------- LIGHTWEIGHT OVERLAY (header totals) ----------
const HeaderTotalsOverlay = ({ open, onClose, title, lines }) => {
  if (!open) return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} totals`}
      onClick={onClose}
      className={styles.totalOverlay}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={styles.totalOverlayCard}
      >
        <div className={styles.totalOverlayHeader}>
          <h3 className={styles.totalOverlayTitle}>{title}</h3>
          <Button
            name="✕"
            onPress={onClose}
            color="Coal"
            size="small"
            customStyle={{ minWidth: '36px', height: '36px' }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          {lines.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No totals available for this column.</div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {lines.map((line, i) => (
                <li key={i} className={styles.totalOverlayItem}>
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ---------- COMPONENT ----------
const DbSearch = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
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

  // inventory
  const { fetchInventory, loading, error, rows = [] } = useInventorySearch();

  // Charcode overlay
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedBag, setSelectedBag] = useState(null);

  // Header totals overlay
  const [headerOverlayOpen, setHeaderOverlayOpen] = useState(false);
  const [headerOverlayTitle, setHeaderOverlayTitle] = useState("");
  const [headerOverlayLines, setHeaderOverlayLines] = useState([]);

  // Index dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // interactive guard (safe for text nodes)
  const isInteractive = (el, container) => {
    const node = el && el.nodeType === 1 ? el : el?.parentElement || null;
    if (!node) return false;
    const hit = node.closest("a,button,input,select,textarea,label,[role='button']");
    if (!hit) return false;
    if (container && hit === container) return false;
    return true;
  };

  // adjust defaults when index changes
  useEffect(() => {
    const next = DEFAULT_FIELDS_BY_INDEX[selectedIndex] || ALL_FIELDS.slice(0, 5);
    setSelectedFields(next);
  }, [selectedIndex]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // whether date filtering is active
  const isDateActive = useMemo(() => {
    const active = isRange ? Boolean(fromDate && toDate) : Boolean(singleDate);
    return active;
  }, [isRange, singleDate, fromDate, toDate]);

  // pre-aggregated maps for fast header stats
  const aggregates = useMemo(() => {
    const byStatus = {};
    const byEbc = {};
    const bySite = {};
    const byOrderId = {};
    const byDeliveryId = {};
    const byBatchId = {};
    const byUser = {};

    for (const r of rows) {
      const s = (r.status ?? "").toString().trim();
      if (s) byStatus[s] = (byStatus[s] || 0) + 1;

      const ebc = (r.ebc_status ?? "").toString().trim();
      if (ebc) byEbc[ebc] = (byEbc[ebc] || 0) + 1;

      const siteLike = r._site ?? r.site ?? r.site_id ?? r.siteId ?? null;
      const { siteCode, siteId } = mapSiteToCodeAndId(siteLike);
      const siteKey = siteCode || (siteId ? String(siteId) : "");
      if (siteKey) bySite[siteKey] = (bySite[siteKey] || 0) + 1;

      const oid = r.order_id ?? null;
      if (oid) byOrderId[oid] = (byOrderId[oid] || 0) + 1;

      const did = r.delivery_id ?? null;
      if (did) byDeliveryId[did] = (byDeliveryId[did] || 0) + 1;
      
      const bid = (r.batch_id ?? "").toString().trim();
      if (bid) byBatchId[bid] = (byBatchId[bid] || 0) + 1;
    }

    return {
      totalRows: rows.length,
      byStatus,
      byEbc,
      bySite,
      byOrderId,
      byDeliveryId,
      byBatchId,
      byUser,
      distinctBatchIds: Object.keys(byBatchId).length,
      distinctUsers: Object.keys(byUser).length,
      distinctOrderIds: Object.keys(byOrderId).length,
      distinctDeliveryIds: Object.keys(byDeliveryId).length,
    };
  }, [rows]);

  const handleFieldToggle = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleToggleRange = () => {
    setIsRange((v) => !v);
  };

  const handleDateChange = (type, value) => {
    if (type === "single") setSingleDate(value);
    if (type === "from") setFromDate(value);
    if (type === "to") setToDate(value);
  };

  const handleSearch = async () => {
    const trimmed = (query || "").trim();
    if (selectedIndex === "users" && !trimmed) {
      console.warn("[DbSearch] Skipping fetch: Users index requires a query (q/email/first/last).");
      return;
    }
    const requiredForOverlay = [
      "_id",
      "charcode",
      "bagging_date",
      "_site",
      "site",
      "batch_id",
      "site_id",
      "siteId",
      "weight",
      "status",
      "batch_id",
      "ebc_status",
      "ebc_status_history",
      "ebc_status_reason",
      "ebcStatusReason",
      "faultMessages",
      "order_id",
      "delivery_id",
    ];

    const fieldsForFetch = Array.from(new Set([...selectedFields, ...requiredForOverlay]));

    // top-level in DbSearch.jsx
    const TABLE_LIMIT = 5000; // or 20000 if you need; keep sensible

    // inside handleSearch() payload:
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
      page: 1,
      limit: TABLE_LIMIT,   // <-- add this
    };

    try {
      await fetchInventory(payload);
    } catch (e) {
    }
  };

  const handleReset = () => {
    setQuery("");
    setIsRange(false);
    setSingleDate("");
    setFromDate("");
    setToDate("");
    setStatusFilters([]);
    setEbcStatusFilters([]);
    setSiteFilters([]);
    setSelectedFields(DEFAULT_FIELDS_BY_INDEX[selectedIndex] || []);
  };

  // Helper functions for individual components
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const options = normalizeOptions(INDEX_OPTIONS);
  const selectedOption = options.find(opt => opt.value === selectedIndex);


  // Open per-row overlay
  const openOverlay = (item) => {

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

    setSelectedBag(parsed);
    setOverlayOpen(true);
  };

  const closeOverlay = () => {
    setOverlayOpen(false);
    setSelectedBag(null);
  };

  // Build content for header totals overlay for a specific field
  const buildHeaderOverlay = (field) => {
    const readable = labelize(field);
    const lines = [];

    switch (field) {
      case "charcode":
        lines.push(`Total rows — ${aggregates.totalRows}`);
        break;

      case "status": {
        const any = Object.keys(aggregates.byStatus).length > 0;
        if (!any) break;
        lines.push(`By ${readable}:`);
        for (const [k, v] of Object.entries(aggregates.byStatus).sort(([a],[b]) => a.localeCompare(b))) {
          lines.push(`• ${k}: ${v}`);
        }
        break;
      }

      case "site": {
        const any = Object.keys(aggregates.bySite).length > 0;
        if (!any) break;
        lines.push(`By ${readable}:`);
        for (const [k, v] of Object.entries(aggregates.bySite).sort(([a],[b]) => a.localeCompare(b))) {
          lines.push(`• ${k}: ${v}`);
        }
        break;
      }

      case "ebc_status": {
        const any = Object.keys(aggregates.byEbc).length > 0;
        if (!any) break;
        lines.push(`By ${readable}:`);
        for (const [k, v] of Object.entries(aggregates.byEbc).sort(([a],[b]) => a.localeCompare(b))) {
          lines.push(`• ${k}: ${v}`);
        }
        break;
      }

      case "order_id": {
        const any = Object.keys(aggregates.byOrderId).length > 0;
        lines.push(`Distinct ${readable}s — ${aggregates.distinctOrderIds}`);
        if (any) {
          lines.push(`By ${readable}:`);
          // Sort by count desc then id asc
          const entries = Object.entries(aggregates.byOrderId).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
          for (const [k, v] of entries.slice(0, 50)) {
            lines.push(`• ${k}: ${v}`);
          }
          if (entries.length > 50) lines.push(`… +${entries.length - 50} more`);
        }
        break;
      }

      case "delivery_id": {
        const any = Object.keys(aggregates.byDeliveryId).length > 0;
        lines.push(`Distinct ${readable}s — ${aggregates.distinctDeliveryIds}`);
        if (any) {
          lines.push(`By ${readable}:`);
          const entries = Object.entries(aggregates.byDeliveryId).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
          for (const [k, v] of entries.slice(0, 50)) {
            lines.push(`• ${k}: ${v}`);
          }
          if (entries.length > 50) lines.push(`… +${entries.length - 50} more`);
        }
        break;
      }

      case "batch_id": {
        const any = Object.keys(aggregates.byBatchId).length > 0;
        lines.push(`Distinct ${readable}s — ${aggregates.distinctBatchIds}`);
        if (any) {
          lines.push(`By ${readable}:`);
          // sort by count desc, then batch_id asc; cap to top 50 for safety
          const entries = Object.entries(aggregates.byBatchId)
            .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
          for (const [k, v] of entries.slice(0, 50)) {
            lines.push(`• ${k}: ${v}`);
          }
          if (entries.length > 50) lines.push(`… +${entries.length - 50} more`);
        }
        break;
      }

      // explicitly no totals
      case "bagging_date":
      default:
        // No totals for this column
        break;
    }

    setHeaderOverlayTitle(`${readable} — totals`);
    setHeaderOverlayLines(lines);
    setHeaderOverlayOpen(true);
  };

  // Render header cell with an inline Σ icon button
  const renderHeaderCell = (field) => {
    const canHaveTotals =
      field === "charcode" ||
      field === "status" ||
      field === "site" ||
      field === "ebc_status" ||
      field === "order_id" ||
      field === "batch_id" ||
      field === "delivery_id";

    return (
      <th key={field} style={{ whiteSpace: "nowrap" }}>
        <span>{labelize(field)}</span>
        {canHaveTotals && (
          <span
            onClick={() => buildHeaderOverlay(field)}
            title={`Show ${labelize(field)} totals`}
            aria-label={`Show ${labelize(field)} totals`}
            className={styles.totalIcon}
          >
            i
          </span>
        )}
      </th>
    );
  };

  return (
    <FilterProvider>
      <div className={styles.mainWhiteContainer}>
        <ScreenHeader name={"Search the Database"} />
        <ModuleMain>
          <div className={styles.container}>
            {/* CSV Export in upper right of module */}
            {rows.length > 0 && (
              <CSVLink
                data={rows.map((row) => {
                  const obj = {};
                  selectedFields.forEach((f) => {
                    // Format date fields for CSV export
                    const isDateField = f === "bagging_date" ||
                                      f === "delivery_date" ||
                                      f === "pickup_date" ||
                                      f === "application_date" ||
                                      f === "storage_pickup_date" ||
                                      f === "storage_delivery_date";
                    
                    if (isDateField) {
                      // Extract date part and format it
                      const rawDate = row[f]?.split?.("T")[0] || "";
                      obj[f] = formatDate(rawDate);
                    } else {
                      obj[f] = row[f];
                    }
                  });
                  return obj;
                })}
                headers={selectedFields.map((f) => ({ label: labelize(f), key: f }))}
                filename={`${selectedIndex}-inventory-export.csv`}
                className={styles.csvExportTopRight}
              >
                <img src={iconCSV} className={styles.iconCSV} />
              </CSVLink>
            )}
            {/* First row: Index, Search, Date Range, Fetch Data */}
            <div className={styles.topBar}>
              {/* Index dropdown */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Index</label>
                <div className={styles.customSelect} ref={dropdownRef}>
                  <div
                    className={helpers.clx(
                      styles.selectedOption,
                      !selectedOption && styles.selectedOptionPlaceholder,
                      isDropdownOpen && styles.selectedOptionOpen 
                    )}
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                  >
                    <img
                      src={arrowGrey}
                      className={helpers.clx(styles.arrow, isDropdownOpen && styles.arrowReversed)}
                      alt=""
                    />
                    {selectedOption ? selectedOption.label : 'Select Index'}
                  </div>
                  {isDropdownOpen && (
                    <div className={styles.dropdownMenu}>
                      {options.map(opt => (
                        <div
                          key={`${opt.value}__${opt.__i}`}
                          className={styles.dropdownItem}
                          onClick={() => {
                            setSelectedIndex(opt.value);
                            setIsDropdownOpen(false);
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Search input */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Search</label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={styles.searchInput}
                />
              </div>

              {/* Date range */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Date Range</label>
                <div className={styles.toggleDateContainer}>
                  <ToggleSwitch toggled={isRange} onPress={handleToggleRange} />
                  {isRange ? (
                    <div className={styles.dateRange}>
                      <input
                        type="date"
                        className={styles.dateInput}
                        value={fromDate}
                        onChange={e => handleDateChange('from', e.target.value)}
                      />
                      <input
                        type="date"
                        value={toDate}
                        className={styles.dateInput}
                        onChange={e => handleDateChange('to', e.target.value)}
                      />
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={singleDate}
                      className={styles.dateInput}
                      onChange={e => handleDateChange('single', e.target.value)}
                    />
                  )}
                </div>
              </div>

              {/* Fetch Data button */}
              <div className={styles.fetchButtonWrapper}>
                <Button 
                  name="Fetch Data →"
                  onPress={handleSearch}
                  customStyle={{ height: '2.6rem', fontSize: '1.5rem' }}
                />
              </div>
            </div>

            {/* Second row: Status, EBC Status, Site */}
            <div className={styles.secondRow}>
              <div className={styles.multiSelectorWrapper}>
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
                  onChange={(v) => {
                    setStatusFilters(v);
                  }}
                />
              </div>

              <div className={styles.multiSelectorWrapper}>
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
                  onChange={(v) => {
                    setEbcStatusFilters(v);
                  }}
                />
              </div>

              <div className={styles.multiSelectorWrapper}>
                <MultiSelector
                  name="Site"
                  placeholder="All"
                  labelStyle="top"
                  data={[
                    { name: "Ahlstrom", value: "ARA" },
                    { name: "Jenkinson", value: "JNR" },
                  ]}
                  values={siteFilters}
                  onChange={(v) => {
                    setSiteFilters(v);
                  }}
                />
              </div>
            </div>

            {/* Field selector */}
            <div className={styles.fieldSelectorContainer}>
              <label className={styles.fieldSelectorLabel}>Display Fields</label>
              <div className={styles.contentGrid}>
                {fields.map((field) => {
                  return (
                    <button
                      key={field}
                      type="button"
                      className={`${styles.fieldTag} ${selectedFields.includes(field) ? styles.fieldTagSelected : ""}`}
                      onClick={() => handleFieldToggle(field)}
                      title={field}
                    >
                      {labelize(field)}
                    </button>
                  );
                })}
                
                <button
                  className={styles.resetButton}
                  onClick={handleReset}
                >
                  Reset Filters ↺
                </button>
              </div>
            </div>

            {/* Results table */}
            <div className={styles.tableContainer}>
              <ModuleMain marginBottom="0rem">
                <table className={styles.orderTable}>
                  <thead>
                    <tr className={styles.orderHeaderRow}>
                      {selectedFields.map((field) => renderHeaderCell(field))}
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
                    {!loading &&
                      !error &&
                      rows.map((item, idx) => {
                        const clickable = Boolean(item?.charcode);
                        return (
                          <tr
                            key={idx}
                            className={`${styles.tableRow} ${clickable ? styles.clickableRow : ""}`}
                            onClick={(e) => {
                              if (clickable && !isInteractive(e.target, e.currentTarget)) openOverlay(item);
                            }}
                            onKeyDown={(e) => {
                              if (!clickable) return;
                              if (!isInteractive(e.target, e.currentTarget) && (e.key === "Enter" || e.key === " ")) {
                                e.preventDefault();
                                openOverlay(item);
                              }
                            }}
                            role={clickable ? "button" : undefined}
                          >
                            {selectedFields.map((field) => {
                              let raw;
                              try {
                                // Handle date fields
                                if (field === "bagging_date" ||
                                    field === "delivery_date" ||
                                    field === "pickup_date" ||
                                    field === "application_date" ||
                                    field === "storage_pickup_date" ||
                                    field === "storage_delivery_date") {
                                  raw = item[field]?.split?.("T")[0] || "";
                                }
                                // Handle storage fields - check direct field first, then locations object
                                else if (field === "storage_order_id") {
                                  raw = item[field] || item?.locations?.storage_pickup?._order_to_storage || "";
                                }
                                else if (field === "storage_pickup_date") {
                                  raw = item[field]?.split?.("T")[0] || item?.locations?.storage_pickup?.time?.split?.("T")[0] || "";
                                }
                                else if (field === "storage_delivery_date") {
                                  raw = item[field]?.split?.("T")[0] || item?.locations?.storage_delivery?.time?.split?.("T")[0] || "";
                                }
                                // Handle other fields
                                else {
                                  raw = typeof item[field] === "object"
                                    ? JSON.stringify(item[field])
                                    : item[field] ?? "";
                                }
                              } catch (e) {
                                err("Cell render error:", { field, item, e });
                                raw = "";
                              }

                              // Format date fields for display
                              const isDateField = field === "bagging_date" ||
                                                field === "delivery_date" ||
                                                field === "pickup_date" ||
                                                field === "application_date" ||
                                                field === "storage_pickup_date" ||
                                                field === "storage_delivery_date";
                              
                              if (isDateField) {
                                raw = formatDate(raw);
                              }

                              if (field === "status") {
                                const formattedStatus = formatBagStatus(raw);
                                const colorClass = getStatusColorClass(raw);

                                return (
                                  <td key={field} className={colorClass}>
                                    {formattedStatus}
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
                                field === "charcode" || field === "order_id" || field === "delivery_id";

                              return (
                                <td key={field}>
                                  {isBold ? <span className={styles.dataBold}>{raw}</span> : raw}
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

        {/* Row overlay */}
        {mounted && overlayOpen && selectedBag &&
          createPortal(<CharcodeOverlayCard parsed={selectedBag} onClose={closeOverlay} />, document.body)}

        {/* Header totals overlay */}
        <HeaderTotalsOverlay
          open={headerOverlayOpen}
          onClose={() => setHeaderOverlayOpen(false)}
          title={headerOverlayTitle}
          lines={headerOverlayLines}
        />
      </div>
    </FilterProvider>
  );
};

export default DbSearch;
