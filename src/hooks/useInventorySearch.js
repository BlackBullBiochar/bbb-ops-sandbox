// hooks/useInventorySearch.js
import { useState, useCallback, useContext, useRef } from "react";
import { API } from "../config/api";
import { UserContext } from "../UserContext";

const SOURCE_MAP = {
  bags: "bags",
  orders: "orders",
  deliveries: "deliveries",
  batches: "batches",
  users: "users",
};

// Toggle logging here or from DevTools: window.__INV_DEBUG = true
const DEBUG_DEFAULT = true;
const debugOn = () =>
  typeof window !== "undefined" && typeof window.__INV_DEBUG !== "undefined"
    ? !!window.__INV_DEBUG
    : DEBUG_DEFAULT;

// normalise UI state -> service params for GET
const buildQueryParams = ({
  selectedIndex,
  queryText,
  selectedFields,
  isRange,
  singleDate,
  fromDate,
  toDate,
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
  batchLike = true,
  userLike = true,
}) => {
  const params = new URLSearchParams();
  const source = SOURCE_MAP[selectedIndex] || "bags";
  params.set("source", source);

  const trimmed = (queryText || "").trim();

  if (debugOn()) {
    console.groupCollapsed(
      "%c[inv] buildQueryParams",
      "color:#666",
      { selectedIndex, source, queryText, trimmed }
    );
  }

  // Map query by source
  if (source === "orders" && trimmed) {
    params.set("order_id", trimmed);
    if (orderLike) params.set("like", "true");
  } else if (source === "deliveries" && trimmed) {
    params.set("delivery_id", trimmed);
    if (deliveryLike) params.set("like", "true");
  } else if (source === "bags" && trimmed) {
    params.set("charcode", trimmed);
    if (charcodeLike) params.set("like", "true");
  } else if (source === "batches" && trimmed) {
    params.set("batch_id", trimmed);
    if (batchLike) params.set("like", "true");
  } else if (source === "users" && trimmed) {
    // Support fielded prefix (optional): "email: foo", "first: ali", "last: smith"
    const m = trimmed.match(/^(email|first|last)\s*:\s*(.+)$/i);
    if (m) {
      const [, key, val] = m;
      if (/^email$/i.test(key)) params.set("email", val);
      if (/^first$/i.test(key)) params.set("first_name", val);
      if (/^last$/i.test(key)) params.set("last_name", val);
    } else {
      params.set("q", trimmed);
    }
    if (userLike) params.set("like", "true");
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

  // Date filters
  if (isRange) {
    if (fromDate) params.set("filters.from", fromDate);
    if (toDate) params.set("filters.to", toDate);
  } else if (singleDate) {
    params.set("filters.from", singleDate);
    params.set("filters.to", singleDate);
  }

  // Multi-selects
  if (Array.isArray(statusFilters) && statusFilters.length) {
    params.set("filters.status", statusFilters.join(","));
  }
  if (Array.isArray(ebcStatusFilters) && ebcStatusFilters.length) {
    params.set("filters.ebc_status", ebcStatusFilters.join(","));
  }
  if (Array.isArray(siteFilters) && siteFilters.length) {
    params.set("filters.site", siteFilters.join(","));
  }

  if (debugOn()) {
    const entries = Array.from(params.entries());
    try {
      console.table(
        entries.reduce((acc, [k, v]) => ((acc[k] = v), acc), {})
      );
    } catch {
      console.log("params:", entries);
    }
    console.groupEnd();
  }

  return params.toString();
};

export const useInventorySearch = () => {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  // Optional: cancel stale requests when typing fast
  const abortRef = useRef(null);

  const fetchInventory = useCallback(
    async (args) => {
      const started = performance.now?.() || Date.now();
      setLoading(true);
      setErr(null);

      // Abort any previous in-flight request
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const qs = buildQueryParams(args || {});
        const url = `${API}/bag/database?${qs}`;

        if (debugOn()) {
          console.groupCollapsed("%c[inv] fetchInventory → GET", "color:#2f6fdd", url);
          console.log("headers:", { Authorization: !!user?.token ? "(bearer set)" : "(none)" });
        }

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${user?.token || ""}` },
          signal: controller.signal,
        });

        if (debugOn()) {
          console.log("HTTP status:", res.status, res.statusText);
        }

        // Clone & read raw text for debugging regardless of JSON success
        const raw = await res.clone().text().catch(() => "");
        if (debugOn()) {
          console.log("Raw response text:", raw?.slice?.(0, 2000)); // cap in console
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${raw || res.statusText}`);
        }

        // Parse JSON (with guard)
        let json;
        try {
          json = await res.json();
        } catch (e) {
          throw new Error(`JSON parse error: ${e?.message || e}`);
        }

        if (debugOn()) {
          console.log("Parsed JSON:", json);
        }

        if (!json?.success) {
          throw new Error(json?.message || "Request failed");
        }

        const data = json.data || {};
        const nextRows = data.rows || [];
        const nextTotal = data.total || 0;

        setRows(nextRows);
        setTotal(nextTotal);

        if (debugOn()) {
          const elapsed = Math.round((performance.now?.() || Date.now()) - started);
          console.log("Rows:", nextRows.length, "Total:", nextTotal, `(${elapsed}ms)`);
          console.groupEnd();
        }

        return data;
      } catch (e) {
        if (e?.name === "AbortError") {
          if (debugOn()) {
            console.warn("[inv] fetch aborted");
          }
          // do not set error on abort
          return { rows: [], total: 0 };
        }
        if (debugOn()) {
          console.error("[inv] fetch error:", e);
        }
        setErr(e);
        setRows([]);
        setTotal(0);
        return { rows: [], total: 0 };
      } finally {
        setLoading(false);
      }
    },
    [user?.token]
  );

  return { fetchInventory, loading, error, rows, total };
};
