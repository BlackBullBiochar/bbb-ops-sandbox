import { useStoredNames } from '../StoredNamesContext';
import styles from './DropdownSelector.module.css'

const DropdownSelector = () => {
  const { storedNames } = useStoredNames();

  return (
    <div className={styles.buttonRow}>
        <select className={styles.dropdown}>
        {storedNames.map((name, idex) => (
            <option className={styles.dropdownOption} value={name}>{name}</option>
        ))}
        </select>
    </div>
  );
};

export default DropdownSelector;
