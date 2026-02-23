import React, { useState, useContext, useMemo, useEffect } from "react";
import styles from "./EbcStatusEditor.module.css";
import { UserContext } from "../UserContext.js";
import { API } from "../config/api";
import Button from "./Button.js";

const statusOptions = ["Flagged", "Rejected", "Post-Approved"];

const REASONS_BY_STATUS = {
  "Post-Approved": [
    "Bag only produced in the correct operating band. Temperature fall and time indicate machine in fault.",
    "Bag only produced in the correct operating band. Temperature fall and time indicate machine in start up.",
    "Pyrolysis temperature average correct for approval.",
    "Bag only produced in the correct operating band. Temperature fall and time indicate machine in restart.",
    "Other:",
  ],
  Rejected: [
    "Bag produced out of approved temperature band",
    "Bag produced from out-of-batch feedstock",
    "Bag produced outside of live EBC batch dates",
    "Other:",
  ],
  Flagged: [
    "One or more temperatures out of spec (520–780°C)",
    "Other:",
  ],
};

const EbcStatusEditor = ({
  charcodeId,
  bagId,
  siteId,
  baggingDate,
  currentStatus,
  currentReason,
  onSaved,
}) => {
  const { user } = useContext(UserContext);

  const [status, setStatus] = useState(currentStatus || statusOptions[0]);
  const [reasonMode, setReasonMode] = useState("Other:");
  const [customReason, setCustomReason] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const reasonOptions = useMemo(() => {
    return REASONS_BY_STATUS[status] || ["Other:"];
  }, [status]);

  useEffect(() => {
    const opts = REASONS_BY_STATUS[status] || ["Other:"];
    const first = opts[0] || "Other:";
    setReasonMode(first);
    setCustomReason("");
  }, [status]);

  const finalReason =
    reasonMode === "Other:" ? customReason.trim() : reasonMode;

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      if (!finalReason) {
        throw new Error("Please select or enter a reason.");
      }

      const res = await fetch(`${API}/ebc/ebcstatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          bagId,
          siteId,
          charcode: charcodeId,
          baggingDate,
          status,
          reason: finalReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save EBC status");

      if (onSaved) onSaved(data);
    } catch (err) {
      console.error("❌ Save error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.editor}>
      <label>
        Status:
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      <label>
        Reason:
        <select
          value={reasonMode}
          onChange={(e) => {
            setReasonMode(e.target.value);
            setCustomReason("");
          }}
        >
          {reasonOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      {reasonMode === "Other:" && (
        <label>
          Details:
          <textarea
            placeholder="Enter reason..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className={styles.singleLineTextarea}
            rows={1}
          />
        </label>
      )}

      <div className={styles.buttonRow}>
        <Button
          name={saving ? "Saving..." : "Save Status"}
          onPress={handleSave}
          disabled={saving}
        />
        {error && <div className={styles.error}>❌ {error}</div>}
      </div>
    </div>
  );
};

export default EbcStatusEditor;