// components/FaultMessageListContainer.jsx
import React from "react";
import { useFormFaults } from "../hooks/useFormFaults";
import FaultMessageList from "./FaultMessageList";

const FaultMessageListContainer = ({
  siteCode,                 // "ARA" | "JNR"
  variant = "readOnly",     // "readOnly" | "editable"
  showDate = true,
  showSite = false,
}) => {
  const { data, loading, error } = useFormFaults({ siteCode });

  if (loading) return <div>Loading fault messages…</div>;
  if (error)   return <div style={{ color: "crimson" }}>Error: {error}</div>;

  const items = (data || []).map((r) => ({
    _id: r._id,
    site: r.site,
    date: r.submitted_at,
    message: r.fault_other,
  }));

  return (
    <FaultMessageList
      items={items}
      variant={variant}
      showDate={showDate}
      showSite={showSite}
    />
  );
};

export default FaultMessageListContainer;
