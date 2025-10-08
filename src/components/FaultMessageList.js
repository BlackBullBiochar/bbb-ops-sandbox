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
          const date = i.date ? new Date(i.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "";
          const site = showSite && i.site ? ` · ${i.site}` : "";
          return `${date}${site} ${i.message}`;
        })
        .filter(Boolean)
        .join("\n"),
    [items, showSite]
  );

  const [joined, setJoined] = useState(initialJoined);

  useEffect(() => setJoined(initialJoined), [initialJoined]);

  if (!items.length) {
    return (    
    <div className={styles.emptyMessage}>
      <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: '#666' }}></i>
      No Fault Messages
    </div>
  );
};

  return (
    <div className={styles.entriesList}>
      {items.map((item, index) => {
        const date = item.date ? new Date(item.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        }) : "";
        const site = showSite && item.site ? ` · ${item.site}` : "";
        
        return (
          <div key={index} className={styles.entry}>
            <div className={styles.dateSection}>
              <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: '#666' }}></i>
              <span className={styles.date}>{date}</span>
              {site && <span className={styles.site}>{site}</span>}
            </div>
            <div className={styles.message}>
              {variant === "editable" ? (
                <EditableParagraph
                  initialText={item.message}
                  onSave={(next) => {
                    // Update the specific item in the joined text
                    const updatedItems = [...items];
                    updatedItems[index] = { ...item, message: next };
                    const newJoined = updatedItems
                      .map((i) => {
                        const d = i.date ? new Date(i.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        }) : "";
                        const s = showSite && i.site ? ` · ${i.site}` : "";
                        return `${d}${s} ${i.message}`;
                      })
                      .filter(Boolean)
                      .join("\n");
                    setJoined(newJoined);
                  }}
                />
              ) : (
                <span>{item.message}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FaultMessageList;
