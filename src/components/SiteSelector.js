import styles from './SiteRadioSelector.module.css';
import Checkbox from './Checkbox.js';

const SiteSelector = ({ options = [], selected = [], onToggle }) => {
  return (
    <div className={styles.selector}>
      {options.map(({ key, label }) => (
        <div key={key} className={styles.option}>
          <Checkbox
            checked={selected.includes(key)}
            onPress={() => onToggle(key)}
            text={label}
            customStyle={{ margin: 0 }}
          />
        </div>
      ))}
    </div>
  );
};

export default SiteSelector;
