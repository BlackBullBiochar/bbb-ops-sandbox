// hooks/useFormFaults.js
import { useEffect, useState, useContext, useMemo, useRef } from "react";
import { API } from "../config/api";
import { UserContext } from "../UserContext";
import { useFilters } from "../contexts/FilterContext";

const buildQuery = ({ mode, singleDate, fromDate, toDate, siteCode, limit }) => {
  const p = new URLSearchParams();
  if (siteCode) p.set("site", siteCode);
  if (limit) p.set("limit", String(limit));
  if (mode === "single" && singleDate) p.set("date", singleDate);
  if (mode !== "single" && fromDate && toDate) { p.set("from", fromDate); p.set("to", toDate); }
  return p.toString();
};

export const useFormFaults = (opts = {}) => {
  const { user } = useContext(UserContext);
  const { mode, singleDate, fromDate, toDate, siteCode } = useFilters();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Build a stable query string from either overrides or context
  const q = useMemo(() => buildQuery({
    mode: opts.mode ?? mode,
    singleDate: opts.singleDate ?? singleDate,
    fromDate: opts.fromDate ?? fromDate,
    toDate: opts.toDate ?? toDate,
    siteCode: opts.siteCode ?? siteCode,
    limit: opts.limit ?? 300,
  }), [mode, singleDate, fromDate, toDate, siteCode, opts.mode, opts.singleDate, opts.fromDate, opts.toDate, opts.siteCode, opts.limit]);

  // Only fetch when there is actually a valid date filter
  const canFetch = useMemo(() => {
    const m = opts.mode ?? mode;
    const hasSingle = m === "single" && (opts.singleDate ?? singleDate);
    const hasRange  = m !== "single" && (opts.fromDate ?? fromDate) && (opts.toDate ?? toDate);
    return !!user?.token && (hasSingle || hasRange);
  }, [user?.token, mode, singleDate, fromDate, toDate, opts.mode, opts.singleDate, opts.fromDate, opts.toDate]);

  // Prevent stale responses & StrictMode double-run from wiping good data
  const reqIdRef = useRef(0);
  const lastQRef = useRef("");

  useEffect(() => {
    if (!canFetch) return; // IMPORTANT: do not clear data here

    const ctrl = new AbortController();
    const myId = ++reqIdRef.current;
    lastQRef.current = q;

    (async () => {
      setLoading(true); setError(null);
      try {
        const url = `${API}/forms/faults?${q}`;
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          signal: ctrl.signal,
        });

        const ct = res.headers.get("content-type") || "";
        const payload = ct.includes("application/json") ? await res.json() : { ok: false, error: await res.text() };
        if (!res.ok || !payload.ok) throw new Error(payload.error || `Failed: ${res.status}`);

        // Only apply if this response matches the latest request
        if (myId === reqIdRef.current && q === lastQRef.current) {
          setData(payload.results || []);
        }
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Error");
      } finally {
        if (!ctrl.signal.aborted && myId === reqIdRef.current) setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [q, canFetch, user?.token]);

  return { data, loading, error };
};
