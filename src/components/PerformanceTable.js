// components/PerformanceTable.jsx
import React from "react";
import styles from "./PerformanceTable.module.css";

/**
 * props:
 *   - columns: Array of { header: string, accessor: row => cellValueOrJSX }
 *   - data: Array of row objects (must have unique `_id`)
 */
const PerformanceTable = ({ columns = [], data = [] }) => {
  return (
    <table className={styles.table} border="1" cellPadding="6">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.header}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row._id}>
            {columns.map((col) => (
              <td key={col.header}>{col.accessor(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PerformanceTable;
