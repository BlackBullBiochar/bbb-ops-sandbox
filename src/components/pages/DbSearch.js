// pages/InventorySearch.js
import React, { useState, useEffect } from "react";
import { CSVLink } from "react-csv";
import IndexSearch from "../IndexSearchbar";
import { useInventorySearch } from "../../hooks/useInventorySearch";
import styles from "./DbSearch.module.css";
import ScreenHeader from "../ScreenHeader"
import ModuleMain from "../ModuleMain"

const INDEX_OPTIONS = [
  { value: "bags", label: "Bags" },
  { value: "orders", label: "Orders" },
  { value: "deliveries", label: "Deliveries" },
  // { value: "batches", label: "Batches" }, // later
];

const DEFAULT_FIELDS_BY_INDEX = {
  bags: ["charcode", "bagging_date", "status", "site", "order_id", "delivery_id"],
  orders: ["charcode", "bagging_date", "status", "order_id", "delivery_date"],
  deliveries: ["charcode", "bagging_date", "status", "delivery_id", "delivery_date"],
};

const FIELD_LABELS = {
  charcode: "Charcode",
  bagging_date: "Bagging date",
  weight: "Weight (kg)",
  moisture_content: "Moisture (%)",
  status: "Status",
  site: "Site",
  order_id: "Order ID",
  delivery_id: "Delivery ID",
  delivery_date: "Delivery date",
  pickup_date: "Pickup date",
};

const ALL_FIELDS = [
  "charcode",
  "bagging_date",
  "weight",
  "moisture_content",
  "status",
  "site",
  "order_id",
  "delivery_id",
  "delivery_date",
  "pickup_date"
];

const STATUS_OPTIONS = [
  { key: "delivered", label: "Delivered" },
  { key: "bagged", label: "Bagged" },
  { key: "pickedUp", label: "Picked Up" },
  { key: "delivered_to_storage", label: "Delivered to Storage" },
  { key: "applied", label: "Applied" },
];

const FILTER_TYPES = [
  { value: "", label: "No filter" },
  { value: "date", label: "Date" },
  { value: "status", label: "Status" }, // bags only
];

const labelize = (key) =>
  FIELD_LABELS[key] ??
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const DbSearch = () => {
  const [selectedIndex, setSelectedIndex] = useState("bags");
  const [fields, setFields] = useState(ALL_FIELDS);
  const [selectedFields, setSelectedFields] = useState(DEFAULT_FIELDS_BY_INDEX["bags"]);
  const [query, setQuery] = useState("");

  // date state
  const [isRange, setIsRange] = useState(false);
  const [singleDate, setSingleDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // filter mode
  const [activeFilterType, setActiveFilterType] = useState(""); // '', 'date', 'status'
  const [statusFilter, setStatusFilter] = useState("");

  const { fetchInventory, loading, error, rows } = useInventorySearch();

  // When index changes, adjust default fields and clear non-applicable filters
  useEffect(() => {
    setSelectedFields(DEFAULT_FIELDS_BY_INDEX[selectedIndex] || ALL_FIELDS.slice(0, 5));
    if (selectedIndex !== "bags" && activeFilterType === "status") {
      setActiveFilterType(""); // status filter only applies to bags
      setStatusFilter("");
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (selectedFields.length) {
        handleSearch();
    }
  }, [selectedFields]);

  

  const handleFieldToggle = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleToggleRange = () => setIsRange((v) => !v);
  const handleDateChange = (type, value) => {
    if (type === "single") setSingleDate(value);
    if (type === "from") setFromDate(value);
    if (type === "to") setToDate(value);
  };

  const handleSearch = async () => {
    await fetchInventory({
      selectedIndex,
      queryText: query,
      selectedFields,
      isRange,
      singleDate,
      fromDate,
      toDate,
      activeFilterType,
      statusFilter,
    });
  };

  return (
    <div className={styles.mainWhiteContainer}>
      <ScreenHeader name={"Inventory"} />
    <ModuleMain>
    <div className={styles.container}>
      {/* Top search bar (reuse your component) */}
      <IndexSearch
        isRange={isRange}
        singleDate={singleDate}
        fromDate={fromDate}
        toDate={toDate}
        onToggle={handleToggleRange}
        onChange={handleDateChange}
        onFetch={handleSearch}
        selectedIndex={selectedIndex}
        indexOptions={INDEX_OPTIONS}
        onIndexChange={setSelectedIndex}
        onKeyDown={handleSearch}
        searchQuery={query}
        onSearchChange={setQuery}
      />

      {/* Filter type selector */}
      <div className={styles.filtersRow}>
        <label className={styles.filterGroup}>
          <span>Filter type</span>
          <select
            value={activeFilterType}
            onChange={(e) => setActiveFilterType(e.target.value)}
            className={styles.select}
          >
            {FILTER_TYPES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </label>

        {/* Status filter only when bags + status */}
        {selectedIndex === "bags" && activeFilterType === "status" && (
          <label className={styles.filterGroup}>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.select}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Field selector */}
      <div className={styles.fieldSelector}>
        {fields.map((field) => {
          const id = `field-${field}`;
          return (
            <label key={field} htmlFor={id} title={field}>
              <input
                id={id}
                type="checkbox"
                checked={selectedFields.includes(field)}
                onChange={() => handleFieldToggle(field)}
              />
              {labelize(field)}
            </label>
          );
        })}
      </div>

      {/* Results table */}
      <div className={styles.tableContainer}>
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
            {!loading && !error && rows.map((item, idx) => (
              <tr key={idx} className={styles.tableRow}>
                {selectedFields.map((field) => {
                  const raw =
                    field === "bagging_date" || field === "delivery_date" || field === "pickup_date"
                      ? (item[field]?.split("T")[0] || "")
                      : (typeof item[field] === "object" ? JSON.stringify(item[field]) : (item[field] ?? ""));

                  // Status cell adopts Orders CSS (colour pill etc.)
                  if (field === "status") {
                    const cls =
                      raw === "delivered" ? styles.statusDelivered :
                      raw === "upcoming" ? styles.statusUpcoming :
                      raw === "cancelled" ? styles.statusCancelled : undefined;

                    return (
                      <td key={field} className={cls}>
                        {/* optional icon: <span className={styles.statusIcon}>check-circle</span> */}
                        {raw || "N/A"}
                      </td>
                    );
                  }

                  // Make obvious key fields bold like Orders table does for IDs/counts
                  const isBold = field === "charcode" || field === "order_id" || field === "delivery_id";
                  return (
                    <td key={field}>
                      {isBold ? <span className={styles.dataBold}>{raw}</span> : raw}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CSV download */}
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
        >
          Download CSV
        </CSVLink>
      )}
    </div>
    </ModuleMain>
    </div>
  );
};

export default DbSearch;
