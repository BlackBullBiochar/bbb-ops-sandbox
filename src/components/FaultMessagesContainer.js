// components/FaultMessagesContainer.jsx
import React, { useContext, useState } from "react";
import FaultMessages from "./FaultMessages";
import { useFormFaults } from "../hooks/useFormFaults";
import { API } from "../config/api";
import { UserContext } from "../UserContext";

const FaultMessagesContainer = ({
  wrapperSize = "Small",
  siteCode,
  variant = "readOnly", // "readOnly" | "editable"
  showSite = true,
}) => {
  const { data, loading, error } = useFormFaults({ siteCode });
  const { user } = useContext(UserContext);
  const [local, setLocal] = useState({}); // optimistic edits

  const rows = (data || []).map((r) => ({
    _id: r._id,
    site: r.site,
    date: r.submitted_at,
    message: local[r._id] ?? r.fault_other,
  }));

  const onSaveMessage = async (id, site, faultText) => {
    // only used when variant === "editable"
    setLocal((s) => ({ ...s, [id]: faultText }));
    try {
      const res = await fetch(`${API.base}/api/forms/faults/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ site, fault_other: faultText }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || `Save failed (${res.status})`);
      // success: keep optimistic value
    } catch (e) {
      // revert on failure
      setLocal((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
      alert(e.message || "Failed to save");
    }
  };

  if (loading) return <div>Loading fault messages…</div>;
  if (error) return <div style={{ color: "crimson" }}>Error: {error}</div>;

  return (
    <FaultMessages
      messages={rows}
      wrapperSize={wrapperSize}
      showSite={showSite}
      variant={variant}
      onSaveMessage={variant === "editable" ? onSaveMessage : undefined}
    />
  );
};

export default FaultMessagesContainer;
