import React, { useMemo, useState, useEffect } from "react";
import EditableParagraph from "./EditableParagraph";
import styles from "./FaultMessageList.module.css";

const FaultMessageList = ({
  items = [],
  variant = "readOnly",   // "readOnly" | "editable"
  showSite = false,       // optional
  dateRange = {},         // date range information
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
  const [currentItems, setCurrentItems] = useState(items);

  useEffect(() => {
    setCurrentItems(items);
  }, [items]);

  useEffect(() => setJoined(initialJoined), [initialJoined]);

  if (!items.length) {
    return (    
    <div className={styles.emptyMessage}>
      <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: '#666' }}></i>
      No Fault Messages
    </div>
  );
};

  const handleRemove = (indexToRemove) => {
    const updatedItems = currentItems.filter((_, index) => index !== indexToRemove);
    setCurrentItems(updatedItems);
    const newJoined = updatedItems
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
      .join("\n");
    setJoined(newJoined);
  };

  const addEntry = () => {
    // Use the end date from the date range, or fallback to latest existing date, or today
    let newDate;
    
    if (dateRange.toDate && dateRange.toDate !== '') {
      newDate = new Date(dateRange.toDate);
    } else if (dateRange.fromDate && dateRange.fromDate !== '') {
      newDate = new Date(dateRange.fromDate);
    } else if (currentItems.length > 0) {
      // Fallback to the latest date from existing items
      const latestItem = currentItems.reduce((latest, item) => {
        if (item.date) {
          const itemDate = new Date(item.date);
          if (!isNaN(itemDate.getTime())) {
            return itemDate > latest ? itemDate : latest;
          }
        }
        return latest;
      }, new Date(0));
      newDate = latestItem;
    } else {
      newDate = new Date();
    }
    
    // Check if the date is valid
    if (isNaN(newDate.getTime())) {
      newDate = new Date();
    }
    
    const newEntry = { 
      date: newDate.toISOString().split('T')[0], // Store as YYYY-MM-DD format
      message: 'Edit Message' 
    };
    setCurrentItems([...currentItems, newEntry]);
  };

  return (
    <div className={styles.entriesList}>
      {currentItems.map((item, index) => {
        const date = item.date ? new Date(item.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        }) : "";
        const site = showSite && item.site ? ` · ${item.site}` : "";
        
        return (
          <div key={index} className={styles.entry}>
            <div className={styles.dateSection}>              <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: '#666' }}></i>

              {variant === "editable" ? (
                <EditableParagraph
                  initialText={date}
                  onSave={(nextDate) => {
                    const updatedItems = [...currentItems];
                    updatedItems[index] = { ...item, date: nextDate };
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
                <span className={styles.date}>{date}</span>
              )}
              {site && <span className={styles.site}>{site}</span>}
            </div>
            <div className={styles.message}>
              {variant === "editable" ? (
                <EditableParagraph
                  initialText={item.message || 'Edit Message'}
                  placeholder="Edit Message"
                  onSave={(next) => {
                    const updatedItems = [...currentItems];
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
                <span className={item.message ? '' : styles.placeholder}>{item.message || 'Edit Message'}</span>
              )}
            </div>
            <div className={styles.trashIcon}><i className="fas fa-trash" onClick={() => handleRemove(index)}></i></div>
          </div>
        );
      })}
      <div className={styles.addUpdate} style={{ position: "absolute", top: 0, right: 0, marginRight: "10px", fontWeight: "bold", textDecoration: "underline", display: "none" }}>Add Update</div>
      <div className={styles.addEntryButton} onClick={addEntry} >Add Entry</div>
    </div>
  );
};

export default FaultMessageList;
