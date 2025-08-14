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
const buildQueryParams = ({
  selectedIndex,            // 'bags' | 'orders' | 'deliveries'
  queryText,                // e.g. 'ORD-00102' | 'DEL-00037' | 'ARA-2024-000123'
  selectedFields,           // ['charcode','status',...]
  isRange,                  // boolean
  singleDate, fromDate, toDate,
  activeFilterType,         // 'date' | 'status' | ''
  statusFilter,             // only for bags
  page = 1,
  limit = 500,
  sortKey = "bagging_date",
  sortDir = "desc",
  charcodeLike = true,       // prefix/ci search for bags by default
  orderLike = true,       // prefix/ci search for bags by default
  deliveryLike = true       // prefix/ci search for bags by default
}) => {
  const params = new URLSearchParams();
  const source = SOURCE_MAP[selectedIndex] || "bags";
  params.set("source", source);

  // Map query by source
  const trimmed = (queryText || "").trim();
  if (source === "orders" && trimmed) {
    params.set("order_id", trimmed);          // controller normaliser supports top-level
    if (orderLike) params.set("like", "true"); // optional prefix/CI match on server
  } else if (source === "deliveries" && trimmed) {
    params.set("delivery_id", trimmed);       // top-level
    if (deliveryLike) params.set("like", "true"); // optional prefix/CI match on server
  } else if (source === "bags" && trimmed) {
    params.set("charcode", trimmed);          // top-level
    if (charcodeLike) params.set("like", "true"); // optional prefix/CI match on server
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

  // Filters: date/status routed as generic filters.*
  if (activeFilterType === "date") {
    if (isRange) {
      if (fromDate) params.set("filters.from", fromDate);
      if (toDate)   params.set("filters.to", toDate);
    } else if (singleDate) {
      params.set("filters.from", singleDate);
      params.set("filters.to", singleDate);
    }
    // server interprets date field based on source
  }

  if (activeFilterType === "status" && source === "bags" && statusFilter) {
    params.set("filters.status", statusFilter);
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
