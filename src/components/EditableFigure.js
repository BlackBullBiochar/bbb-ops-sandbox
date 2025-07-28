import React, { useState, useEffect, useRef } from 'react';
import styles from './Figure.module.css';

const EditableFigure = ({
  initialValue = 0,
  unit = '',
  variant = '1',
  decimals = 0,
  onChange = () => {}
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    const num = parseFloat(value);
    if (!Number.isNaN(num)) {
      setValue(num);
      onChange(num);
    } else {
      setValue(initialValue);
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  let className;
  if (variant === '2')       className = styles.Figure2;
  else if (variant === '3')  className = styles.Figure3;
  else                        className = styles.Figure;

  return (
    <div className={`${className} ${styles.FigureInput}`}>
      <input
        ref={inputRef}
        type="number"
        step={Math.pow(10, -decimals)}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          textAlign: 'center',
          width: `${String(value).length + 1}ch`,
          fontFamily: 'inherit',
          fontSize: 'inherit',
          color: 'inherit',
          padding: 0,
          margin: 0,
        }}
      />
      <span className={styles.FigureInputUnit}>{unit}</span>
    </div>
  );
};

export default EditableFigure;
