import React from 'react';
import ToggleSwitch from './ToggleSwitch';
import styles from './DateSelector.module.css';

const IndexSearch = ({
  isRange,
  singleDate,
  fromDate,
  toDate,
  onToggle,
  onChange,
  onFetch,
  selectedIndex,
  indexOptions,
  onIndexChange,
  searchQuery,
  onSearchChange
}) => {
  return (
    <div className={styles.dateBar}>

      {/* Index dropdown */}
      <select value={selectedIndex} onChange={e => onIndexChange(e.target.value)} className={styles.dropdown}>
        <option value="">Select Index</option>
        {indexOptions.map((index) => (
          <option key={index} value={index}>{index}</option>
        ))}
      </select>

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        className={styles.searchInput}
      />

      {/* Toggle + Dates */}
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

      <button onClick={onFetch}>Fetch Data</button>
    </div>
  );
};

export default IndexSearch;
