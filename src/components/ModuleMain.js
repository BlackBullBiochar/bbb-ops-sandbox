import styles from './Module.module.css'; //styles
import helpers from '../helpers.js';
import { useCallback } from 'react';


const ModuleMain = ({
    height = "",
    marginBottom = "3rem",
    background = "",
    icon = "",
    name = "",
    spanRow,
    width = "",
    padding = "",
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
          width,
          padding,
          marginBottom,
          background
        }}
      >
        {name !== "" ? <div className={styles.line} /> : null}
        {children}
      </div>
    );
  };
  
  export default ModuleMain;
  