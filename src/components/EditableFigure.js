import React, { useState, useEffect, useRef } from 'react';
import styles from './Figure.module.css';

const EditableFigure = (props) => {
  const { initialValue = 0, unit = '', variant = '1', decimals = 0, onChange = () => {}, color = 'inherit', placeholder = 'Enter Value' } = props;

  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [hasUserInput, setHasUserInput] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    setIsFocused(false);
    const num = parseFloat(value);
    if (!Number.isNaN(num)) {
      setValue(num);
      onChange(num);
    } else {
      setValue(initialValue);
      setHasUserInput(false);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    setHasUserInput(true);
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
        value={hasUserInput ? value : ''}
        placeholder={!hasUserInput ? placeholder : ''}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          textAlign: 'left',
          width: '100%',
          minWidth: '6ch',
          fontFamily: 'inherit',
          fontSize: '2.8rem',
          fontWeight: 'normal',
          color: color,
          padding: '0',
          margin: 0,
          boxSizing: 'border-box',
          lineHeight: '1.2',
          height: 'auto',
        }}
      />
      <span className={styles.FigureInputUnit}>{unit}</span>
    </div>
  );
};

export default EditableFigure;