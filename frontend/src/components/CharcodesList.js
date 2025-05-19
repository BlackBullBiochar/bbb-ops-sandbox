import React from 'react';
import ModuleClickable from './ModuleClickable';
import styles from './CharcodesList.module.css';

const CharcodesList = ({ charcodes = [], expanded, onToggle, spanColumn }) => {
  return (
    <ModuleClickable
      name="Charcodes"
      spanColumn={spanColumn || 21}
      spanRow={expanded ? 6 : 2}
      onClick={onToggle}
    >
      <div className={styles.grid}>
        {charcodes.slice(0, 8).map((row, i) => {
          const parsed = JSON.parse(row);
          return (
            <CharcodeCard key={`always-${i}`} parsed={parsed} />
          );
        })}

        {expanded && charcodes.slice(8).map((row, i) => {
          const parsed = JSON.parse(row);
          return (
            <CharcodeCard key={`expanded-${i}`} parsed={parsed} />
          );
        })}
      </div>

      {!expanded && (
        <div className={styles.hint}>
          Click to view all charcodes
        </div>
      )}
    </ModuleClickable>
  );
};

const CharcodeCard = ({ parsed }) => (
  <div
    className={`${styles.card} ${
      parsed['EBC Cert Status'] === 'Approved' ? styles.approved :
      parsed['EBC Cert Status'] === 'Flagged' ? styles.flagged :
      parsed['EBC Cert Status'] === 'Pending' ? styles.pending :
      ''
    }`}
  >
    {Object.entries(parsed).map(([key, val], j) => (
      <div key={j} className={styles.row}>
        <strong>{key}:</strong> {val}
      </div>
    ))}
  </div>
);

export default CharcodesList;
