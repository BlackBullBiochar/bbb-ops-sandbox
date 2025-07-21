import React from 'react';
import styles from './Figure.module.css';

const Figure = ({ value, unit = '°C', variant = '1', decimals = 2 }) => {
  // normalize variant to a string
  const v = String(variant);

  // pick the right class
  let className;
  if (v === '2') {
    className = styles.Figure2;
  } else if (v === '3') {
    className = styles.Figure3;
  } else {
    className = styles.Figure;  // default / variant "1"
  }

  return (
    <div className={className}>
      {typeof value === 'number'
        ? `${value.toFixed(decimals)}${unit}`
        : 'No Data'}
    </div>
  );
};

export default Figure;
