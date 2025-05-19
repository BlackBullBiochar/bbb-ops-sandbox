import React from 'react';
import styles from './Figure.module.css';

const Figure = ({ value, unit = '°C', variant = '1' }) => {
  const className = variant === '2' ? styles.Figure2 : styles.Figure;

  return (
    <div className={className}>
      {typeof value === 'number' ? `${value.toFixed(2)}${unit}` : 'No Data'}
    </div>
  );
};


export default Figure;
