import styles from './Module.module.css'; //styles
import helpers from '../helpers.js';
import { useCallback } from 'react';


const Module = ({
    height = "100%",
    background = "",
    icon = "",
    name = "",
    marginBottom = "",
    spanRow,
    spanColumn,
    children,
    bannerHeader = false,
    bannerType = "primary" // "primary" or "secondary"
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
          background,
          marginBottom: marginBottom || "",
        }}
      >
        <h3 className={
          bannerHeader 
            ? (bannerType === "secondary" ? styles.bannerHeaderSecondary : styles.bannerHeader)
            : styles.header
        }>
          {renderIcon()}
          {name}
        </h3>
        {name !== "" && !bannerHeader ? <div className={styles.line} /> : null}
        {children}
      </div>
    );
  };
  
  export default Module;
  