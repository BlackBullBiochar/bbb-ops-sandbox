import React, { useState, useEffect, useMemo } from "react";
import { CSVLink } from "react-csv";
import IndexSearch from "../IndexSearchbar";
import { useInventorySearch } from "../../hooks/useInventorySearch";
import styles from "./DbSearch.module.css";
import ScreenHeader from "../ScreenHeader";
import ModuleMain from "../ModuleMain";
import MultiSelector from "../MultiSelect";
import iconCSV from "../../assets/images/iconCSV.png"

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
  application_date: "Application Date"
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
  "application_date"
];

const labelize = (key) =>
  FIELD_LABELS[key] ??
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const DbSearch = () => {
  const [selectedIndex, setSelectedIndex] = useState("bags");
  const [fields, setFields] = useState(ALL_FIELDS);
  const [selectedFields, setSelectedFields] = useState(DEFAULT_FIELDS_BY_INDEX["bags"]);
  const [query, setQuery] = useState("");

  // date state (auto-applied if set)
  const [isRange, setIsRange] = useState(false);
  const [singleDate, setSingleDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // NEW: independent multi-select filters
  const [statusFilters, setStatusFilters] = useState([]); // [] means “All”
  const [ebcStatusFilters, setEbcStatusFilters] = useState([]); 
  const [siteFilters, setSiteFilters] = useState([]); 

  const { fetchInventory, loading, error, rows } = useInventorySearch();

  // Adjust defaults when index changes
  useEffect(() => {
    setSelectedFields(DEFAULT_FIELDS_BY_INDEX[selectedIndex] || ALL_FIELDS.slice(0, 5));
  }, [selectedIndex]);

  // Helper: whether date filtering is “active”
  const isDateActive = useMemo(() => {
    if (isRange) {
      return Boolean(fromDate && toDate);
    }
    return Boolean(singleDate);
  }, [isRange, singleDate, fromDate, toDate]);

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
      singleDate: isDateActive && !isRange ? singleDate : "",
      fromDate: isDateActive && isRange ? fromDate : "",
      toDate: isDateActive && isRange ? toDate : "",
      statusFilters, 
      ebcStatusFilters, 
      siteFilters,
    });
  };

  // Trigger fetch when key inputs change (date, filters, index, selected fields)
  useEffect(() => {
    if (selectedFields.length) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedIndex,
    selectedFields,
    // date
    isRange,
    singleDate,
    fromDate,
    toDate,
    // filters
    statusFilters,
    ebcStatusFilters,
    siteFilters,
  ]);

  return (
    <div className={styles.mainWhiteContainer}>
      <ScreenHeader name={"Inventory"} />
      <ModuleMain>
        <div className={styles.container}>
          {/* Top search + date (your existing component) */}
          <div className={styles.topBar}>
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
              <img src={iconCSV} className={styles.iconCSV}/>
            </CSVLink>
          )}
          </div>

          {/* NEW: independent multi-select filters */}
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
            values={statusFilters}             // array state
            onChange={setStatusFilters}
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
            values={ebcStatusFilters}          // array state
            onChange={setEbcStatusFilters}
          />

          <MultiSelector
            name="Site"
            placeholder="All"
            labelStyle="top"
            data={[
              { name: "Ahlstrom", value: "ARA" },
              { name: "Jenkinson", value: "JNR" },
            ]}
            values={siteFilters}          // array state
            onChange={setSiteFilters}
          />
          </div>

          {/* Field selector */}
          <div className={styles.fieldSelector}>
            {fields.map((field) => {
              const id = `field-${field}`;
              return (
                <label style={{ alignItems: "center" }} key={field} htmlFor={id} title={field}>
                  <input
                    id={id}
                    type="checkbox"
                    checked={selectedFields.includes(field)}
                    onChange={() => handleFieldToggle(field)}
                    className={styles.cb}
                  />
                  {labelize(field)}
                </label>
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
                  {!loading &&
                    !error &&
                    rows.map((item, idx) => (
                      <tr key={idx} className={styles.tableRow}>
                        {selectedFields.map((field) => {
                          const raw =
                            field === "bagging_date" ||
                            field === "delivery_date" ||
                            field === "pickup_date"  ||
                            field === "application_date"
                              ? item[field]?.split("T")[0] || ""
                              : typeof item[field] === "object"
                              ? JSON.stringify(item[field])
                              : item[field] ?? "";

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

                          const isBold =
                            field === "charcode" ||
                            field === "order_id" ||
                            field === "delivery_id";

                          if (field === "ebc_status") {
                            const cls =
                              raw === "Approved"      ? styles.ebcApproved :
                              raw === "Flagged"       ? styles.ebcFlagged :
                              raw === "Rejected"      ? styles.ebcRejected :
                              raw === "Post-Approved" ? styles.ebcPostApproved :
                              raw === "Pending"       ? styles.ebcPending : undefined;
                            return <td key={field} className={cls}>{raw || "N/A"}</td>;
                          }

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
                    ))}
                </tbody>
              </table>
            </ModuleMain>
          </div>
        </div>
      </ModuleMain>
    </div>
  );
};

export default DbSearch;
