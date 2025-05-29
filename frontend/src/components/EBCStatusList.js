import React from 'react';
import styles from './EBCStatusList.module.css';

const EbcStatusList = ({ ebcEntries = [] }) => {
  console.log('EBC Entries:', ebcEntries);
  if (!Array.isArray(ebcEntries) || ebcEntries.length === 0) {
    return <div className={styles.empty}>No EBC Data</div>;
  }

  return (
    <table className={styles.table}>
      <colgroup>
        <col style={{ width: '15%' }} />
        <col style={{ width: '65%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
      </colgroup>
      <thead>
        <tr>
          <th>Status</th>
          <th>Reason</th>
          <th>Date</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {ebcEntries.map((entry, i) => (
          <tr key={i}>
            <td>{entry['status']}</td>
            <td>{entry['reason']}</td>
            <td>{entry['date']}</td>
            <td>{entry['time']}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default EbcStatusList;
