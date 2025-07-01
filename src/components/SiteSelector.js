import styles from './SiteRadioSelector.module.css';

const SiteSelector = ({ options = [], selected = [], onToggle }) => {
  return (
    <div className={styles.selector}>
      {options.map(({ key, label }) => (
        <label key={key}>
          <div className={styles.option}>
            <input
              type="checkbox"
              checked={selected.includes(key)}
              onChange={() => onToggle(key)}
            />
            <span className={styles.radio}></span>
            <div className={styles.label}>{label}</div>
          </div>
        </label>
      ))}
    </div>
  );
};

export default SiteSelector;
