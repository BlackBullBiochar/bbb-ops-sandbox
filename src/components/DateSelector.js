import React from 'react';
import ToggleSwitch from './ToggleSwitch';
import styles from './DateSelector.module.css';
import Button from './Button.js';

const DateSelector = ({
  isRange,
  singleDate,
  fromDate,
  toDate,
  onToggle,
  onChange,
  onFetch
}) => {
  return (
    <div className={styles.dateBar}>
      <ToggleSwitch toggled={isRange} onPress={onToggle} />

      {isRange ? (
        <div className={styles.dateRange}>
          <input
            type="date"
            className={styles.dateInput}
            value={fromDate}
            onChange={e => onChange('from', e.target.value)}
          />
          <input
            type="date"
            value={toDate}
            className={styles.dateInput}
            onChange={e => onChange('to', e.target.value)}
          />
        </div>
      ) : (
        <input
          type="date"
          value={singleDate}
          className={styles.dateInput}
          onChange={e => onChange('single', e.target.value)}
        />
      )}

      <Button name="Fetch Data" onPress={onFetch} />
    </div>
  );
};

export default DateSelector;
  