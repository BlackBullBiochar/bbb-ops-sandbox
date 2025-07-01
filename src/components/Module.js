import styles from './Module.module.css'; //styles
import helpers from '../helpers.js';
import { useCallback } from 'react';


const Module = ({
    height = "100%",
    background = "",
    icon = "",
    name = "",
    spanRow,
    spanColumn,
    children
  }) => {
    const renderIcon = useCallback(() => {
      if (!icon) {
        return null;
      } else if (icon.length > 20) {
        return <img className={styles.headerIcon} src={icon} />;
      } else {
        return <span className={styles.headerIcon}>{icon}</span>;
      }
    }, [icon]);
  
    return (
      <div
        className={styles.moduleContainer}
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
        {name !== "" ? <div className={styles.line} /> : null}
        {children}
      </div>
    );
  };
  
  export default Module;
  