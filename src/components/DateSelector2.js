import React from "react";
import ToggleSwitch from "./ToggleSwitch";
import styles from "./DateSelector2.module.css";
import Button from "./Button.js";

const DateSelector2 = ({
  isWeek,
  week,        // e.g. "2025-W23"
  fromDate,
  toDate,
  onToggle,    // toggles between week mode and range mode
  onChange,    // invoked as onChange('week', value) or onChange('from', value) / onChange('to', value)
  onFetch
}) => {
  return (
    <div className={styles.dateBar}>
      <ToggleSwitch toggled={!isWeek} onPress={onToggle} />

      {isWeek ? (
        <div className={styles.weekPicker}>
          <input
            type="week"
            className={styles.dateInput}
            value={week}
            onChange={(e) => onChange("week", e.target.value)}
          />
        </div>
      ) : (
        <div className={styles.dateRange}>
          <input
            type="date"
            className={styles.dateInput}
            value={fromDate}
            onChange={(e) => onChange("from", e.target.value)}
          />
          <input
            type="date"
            className={styles.dateInput}
            value={toDate}
            onChange={(e) => onChange("to", e.target.value)}
          />
        </div>
      )}

      {onFetch && <Button name="Fetch Data" onPress={onFetch} />}
    </div>
  );
};

export default DateSelector2;
