import React from 'react';
import styles from './FaultMessages.module.css';

/**
 * FaultMessages2
 * Renders a simple table of fault messages (strings).
 * @param {Object} props
 * @param {string[]} props.messages    - array of fault message strings
 * @param {'Small'|'full'} props.wrapperSize - controls table wrapper styling
 */
const FaultMessages2 = ({ messages = [], wrapperSize = 'Small' }) => {
  const wrapperClass =
    wrapperSize === 'full'
      ? styles.tableWrapper2
      : styles.tableWrapper1;

  return (
    <div>
      {messages.length > 0 ? (
        <div className={wrapperClass}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg, i) => (
                <tr key={i}>
                  <td>{msg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>No Fault Messages</div>
      )}
    </div>
  );
};

export default FaultMessages2;
