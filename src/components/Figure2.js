import React from 'react';
import styles from './Figure2.module.css';

const Figure2 = ({ value, blurb = '', unit = '°C', variant = '1'}) => {
  const className = variant === '2' ? styles.Figure2 : styles.Figure;

  return (
    <div className={className}>
        <span className={styles.value}>{value}</span>
        <span className={styles.value}>{unit}</span>
        <span className={styles.unit}>{blurb}</span>
    </div>
  );
};

export default Figure2;
