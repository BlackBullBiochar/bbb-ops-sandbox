import React from 'react';
import ToggleSwitch from './ToggleSwitch';
import styles from './DateSelector.module.css';

const normalizeOptions = (options = []) =>
  options.map((opt, i) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt, __i: i };
    }
    // Coerce to strings in case value/label are numbers or objects
    const value = String(opt?.value ?? '');
    const label = String(opt?.label ?? value);
    return { value, label, __i: i };
  });

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
  onSearchChange,
}) => {
  const options = normalizeOptions(indexOptions);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // prevents form submission if inside a form
      onFetch?.();
    }
  };

  return (
    <div className={styles.dateBar}>
      {/* Index dropdown */}
      <select
        value={String(selectedIndex ?? '')}
        onChange={e => onIndexChange?.(e.target.value)}
        className={styles.dropdown}
      >
        <option value="">Select Index</option>
        {options.map(opt => (
          <option key={`${opt.value}__${opt.__i}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={e => onSearchChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
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
            onChange={e => onChange?.('from', e.target.value)}
          />
          <input
            type="date"
            value={toDate}
            className={styles.dateInput}
            onChange={e => onChange?.('to', e.target.value)}
          />
        </div>
      ) : (
        <input
          type="date"
          value={singleDate}
          className={styles.dateInput}
          onChange={e => onChange?.('single', e.target.value)}
        />
      )}

      <button onClick={onFetch}>Fetch Data</button>
    </div>
  );
};

export default IndexSearch;
