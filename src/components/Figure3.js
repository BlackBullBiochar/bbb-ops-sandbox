import styles from './Figure3.module.css';

const Figure2 = ({ value, blurb = '', unit = '', variant = '1' }) => {
  const className = variant === '2' ? styles.Figure2 : styles.Figure;

  return (
    <div className={className}>
      <span className={styles.blurb}>{blurb}</span>
      <div className={styles.numberGroup}>
        <span className={styles.value}>{value}</span>
        <span className={styles.unit}>{unit}</span>
      </div>
    </div>
  );
};

export default Figure2;
