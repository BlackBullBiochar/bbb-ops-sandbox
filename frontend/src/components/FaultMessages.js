import React from 'react';
import styles from './FaultMessages.module.css';

const FaultMessages = ({ messages = [] }) => {
  return (
    <div>
      {messages.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((entry, i) => (
              <tr key={i}>
                <td>{entry.date}</td>
                <td>{entry.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.empty}>No Fault Messages</div>
      )}
    </div>
  );
};

export default FaultMessages;
