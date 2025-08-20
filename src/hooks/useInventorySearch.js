// hooks/useInventorySearch.js
import { useState, useCallback, useContext } from "react";
import { API } from "../config/api";
import { UserContext } from "../UserContext";

const SOURCE_MAP = {
  bags: "bags",
  orders: "orders",
  deliveries: "deliveries",
  // batches: "batches" // later
};

// normalise UI state -> service params for GET
// hooks/useInventorySearch.js
const buildQueryParams = ({
  selectedIndex,           
  queryText,                
  selectedFields,    
  isRange,           
  singleDate, fromDate, toDate,
  statusFilters, 
  siteFilters,           
  ebcStatusFilters,       
  page = 1,
  limit = 500,
  sortKey = "bagging_date",
  sortDir = "desc",
  charcodeLike = true,
  orderLike = true,
  deliveryLike = true,
}) => {
  const params = new URLSearchParams();
  const source = SOURCE_MAP[selectedIndex] || "bags";
  params.set("source", source);

  // Map query by source
  const trimmed = (queryText || "").trim();
  if (source === "orders" && trimmed) {
    params.set("order_id", trimmed);
    if (orderLike) params.set("like", "true");
  } else if (source === "deliveries" && trimmed) {
    params.set("delivery_id", trimmed);
    if (deliveryLike) params.set("like", "true");
  } else if (source === "bags" && trimmed) {
    params.set("charcode", trimmed);
    if (charcodeLike) params.set("like", "true");
  }

  // Fields
  if (Array.isArray(selectedFields) && selectedFields.length) {
    params.set("fields", selectedFields.join(","));
  }

  // Sort / paging
  params.set("sort.key", sortKey);
  params.set("sort.dir", sortDir);
  params.set("page", String(page));
  params.set("limit", String(limit));

  // ✅ Auto-apply date filters when provided (no dropdown needed)
  if (isRange) {
    if (fromDate) params.set("filters.from", fromDate); // expect 'YYYY-MM-DD'
    if (toDate)   params.set("filters.to", toDate);
  } else if (singleDate) {
    // single day => from = to = that date
    params.set("filters.from", singleDate);
    params.set("filters.to", singleDate);
  }

  // ✅ Multi-select status (bags)
  if (Array.isArray(statusFilters) && statusFilters.length) {
    params.set("filters.status", statusFilters.join(","));
  }

  // ✅ Multi-select EBC status
  if (Array.isArray(ebcStatusFilters) && ebcStatusFilters.length) {
    params.set("filters.ebc_status", ebcStatusFilters.join(","));
  }

  if (Array.isArray(siteFilters) && siteFilters.length) {
    params.set("filters.site", siteFilters.join(","));
  }

  return params.toString();
};


export const useInventorySearch = () => {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const fetchInventory = useCallback(async (args) => {
    setLoading(true);
    setErr(null);
    try {
      const qs = buildQueryParams(args || {});
      const res = await fetch(`${API}/bag/database?${qs}`, {
        headers: {
          Authorization: `Bearer ${user?.token || ""}`,
        },
      });
      // Handle non-2xx cleanly
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "Request failed");
      const data = json.data || {};
      setRows(data.rows || []);
      setTotal(data.total || 0);
      return data;
    } catch (e) {
      setErr(e);
      setRows([]);
      setTotal(0);
      return { rows: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  return { fetchInventory, loading, error, rows, total };
};
