import React, { useState, useRef, useEffect } from 'react';
import ToggleSwitch from './ToggleSwitch';
import styles from './IndexSearchbar.module.css';
import helpers from '../helpers'; // adjust path if needed
import arrowGrey from "../assets/images/selectArrowGrey.png";
import arrowWhite from "../assets/images/selectArrowWhite.png";
import Button from './Button.js';

const normalizeOptions = (options = []) =>
  options.map((opt, i) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt, __i: i };
    }
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
  color = "white",
}) => {
  const options = normalizeOptions(indexOptions);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === selectedIndex);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onFetch?.();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.dateBar}>
      {/* Custom dropdown */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Index</label>
        <div className={styles.customSelect} ref={dropdownRef}>
          <div
            className={helpers.clx(
              styles.selectedOption,
              !selectedOption && styles.selectedOptionPlaceholder,
              isOpen && styles.selectedOptionOpen 
            )}
            onClick={() => setIsOpen(prev => !prev)}
          >
            <img
              src={color === "white" ? arrowGrey : arrowWhite}
              className={helpers.clx(styles.arrow, isOpen && styles.arrowReversed)}
              alt=""
            />
            {selectedOption ? selectedOption.label : 'Select Index'}
          </div>
          {isOpen && (
            <div className={styles.dropdownMenu}>
              {options.map(opt => (
                <div
                  key={`${opt.value}__${opt.__i}`}
                  className={styles.dropdownItem}
                  onClick={() => {
                    onIndexChange?.(opt.value);
                    setIsOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Search</label>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={e => onSearchChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.searchInput}
        />
      </div>

      {/* Toggle + Dates */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Date Range</label>
        <div className={styles.toggleDateContainer}>
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
        </div>
      </div>

      <Button 
        name="Fetch Data →"
        onPress={onFetch}
        customStyle={{ height: '2.6rem', fontSize: '1.5rem' }}
      />
    </div>
  );
};

export default IndexSearch;
