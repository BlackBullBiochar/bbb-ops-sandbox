import React, { useMemo, useState, useEffect } from "react";
import EditableParagraph from "./EditableParagraph";
import styles from "./FaultMessageList.module.css";

const FaultMessageList = ({
  items = [],
  variant = "readOnly",   // "readOnly" | "editable"
  showSite = false,       // optional
}) => {
  // Build newline-separated string with date prefix
  const initialJoined = useMemo(
    () =>
      items
        .map((i) => {
          const date = i.date ? new Date(i.date).toLocaleDateString() : "";
          const site = showSite ? ` · ${i.site}` : "";
          return `[${date}] ${i.message}`;
        })
        .filter(Boolean)
        .join("\n"),
    [items, showSite]
  );

  const [joined, setJoined] = useState(initialJoined);

  useEffect(() => setJoined(initialJoined), [initialJoined]);

  if (!items.length) {
    return <div className={styles.empty}>No Fault Messages</div>;
  }

  return (
    <div className={styles.box}>
      {variant === "editable" ? (
        <EditableParagraph
          initialText={joined}
          onSave={(next) => setJoined(next)} // local only
        />
      ) : (
        <pre className={styles.readOnlyText}>{initialJoined}</pre>
      )}
    </div>
  );
};

export default FaultMessageList;
