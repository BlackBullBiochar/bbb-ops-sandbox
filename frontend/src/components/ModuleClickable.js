import styles from './ModuleClickable.module.css';
import { useCallback } from 'react';

/*
  ModuleClickable
    Props:
      - spanRow: number of grid rows to span (1 = 100px)
      - spanColumn: number of grid columns to span (/25 e.g., 6 = 1/4 screen)
      - height: CSS height (default 100%)
      - background: background colour
      - icon: either a short string (FontAwesome) or image URL
      - name: section title
      - className: optional extra CSS class
      - onClick: handler for expand/click
*/
const ModuleClickable = ({
  spanRow,
  spanColumn,
  height = "100%",
  background = "",
  icon = "",
  name = "",
  onClick,
  className = "",
  children
}) => {
  const renderIcon = useCallback(() => {
    if (!icon) return null;
    if (icon.length > 20) {
      return <img className={styles.headerIcon} src={icon} alt="" />;
    }
    return <span className={styles.headerIcon}>{icon}</span>;
  }, [icon]);

  return (
    <div
      className={`${styles.moduleContainer} ${className}`}
      onClick={onClick}
      style={{
        gridRow: `span ${spanRow}`,
        gridColumn: `span ${spanColumn}`,
        height,
        background
      }}
    >
      <h3 className={styles.header}>
        {renderIcon()}
        {name}
      </h3>
      {name && <div className={styles.line} />}
      {children}
    </div>
  );
};

export default ModuleClickable;
