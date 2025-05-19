const detectTimestampColumn = (headers, rows) => {
    for (const header of headers) {
      const values = rows.map((r) => r[header]);
      const allValid = values.every((val) => !isNaN(Date.parse(val)));
      if (allValid) return header;
    }
    return null;
  };
  
  module.exports = detectTimestampColumn;
  