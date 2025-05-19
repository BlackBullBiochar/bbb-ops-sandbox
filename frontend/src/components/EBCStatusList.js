import React from 'react';
import styles from './EBCStatusList.module.css';

const EbcStatusList = ({ entry1 = [], entry2 = [] }) => {
  const maxLength = Math.max(entry1.length, entry2.length);

  return (
    <div>
      {maxLength > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ARA Reasons</th>
              <th>JNR Reasons</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxLength }).map((_, i) => (
              <tr key={i}>
                <td>{entry1[i] || ''}</td>
                <td>{entry2[i] || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.empty}>No EBC Reasons</div>
      )}
    </div>
  );
};

export default EbcStatusList;
