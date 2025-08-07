import React from 'react';
import styles from './Table.module.css';

const Table = ({ columns, data,

    height = "100%",
    background = "",
    icon = "",
    name = "",
    spanRow,
    spanColumn,
    children
  }) => {
  return (
    <div className={styles.tableContainer}        style={{
          gridRow: `span ${spanRow}`,
          gridColumn: `span ${spanColumn}`,
          height,
          background
        }}>
      <table className={styles.table}>
        <thead>
        <tr className={styles.headerRow}>
            {columns.map((col) => (
            <th key={col.key} className={styles.headerCell}>
                {col.label}
            </th>
            ))}
        </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyRow}>
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className={styles.row}>
                {columns.map((col) => (
                  <td key={col.key} className={styles.cell}>
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
