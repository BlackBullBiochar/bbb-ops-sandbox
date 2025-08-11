// DbSearch.js
import React, { useState, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import IndexSearch from '../IndexSearchbar';
import styles from './DbSearch.module.css';

const DBSearch = () => {
  const [indexes, setIndexes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState('');
  const [fields, setFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const [isRange, setIsRange] = useState(false);
  const [singleDate, setSingleDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const fetchIndexes = async () => {
      const res = await fetch('/api/search/indexes');
      const data = await res.json();
      setIndexes(data);
    };
    fetchIndexes();
  }, []);

  useEffect(() => {
    const fetchFields = async () => {
      if (selectedIndex) {
        const res = await fetch(`/api/search/fields?index=${selectedIndex}`);
        const data = await res.json();
        setFields(data);
        setSelectedFields(data.slice(0, 3));
      }
    };
    fetchFields();
  }, [selectedIndex]);

  const handleSearch = async () => {
    const res = await fetch('/api/search/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        index: selectedIndex,
        query,
        fields: selectedFields
      })
    });
    const data = await res.json();
    setResults(data);
  };

  const handleFieldToggle = (field) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleToggle = () => setIsRange(!isRange);
  const handleDateChange = (type, value) => {
    if (type === 'single') setSingleDate(value);
    if (type === 'from') setFromDate(value);
    if (type === 'to') setToDate(value);
  };

  return (
    <div className={styles.container}>
      <IndexSearch
        isRange={isRange}
        singleDate={singleDate}
        fromDate={fromDate}
        toDate={toDate}
        onToggle={handleToggle}
        onChange={handleDateChange}
        onFetch={handleSearch}
        selectedIndex={selectedIndex}
        indexOptions={indexes}
        onIndexChange={setSelectedIndex}
        searchQuery={query}
        onSearchChange={setQuery}
      />

      <div className={styles.fieldSelector}>
        {fields.map(field => (
          <label key={field}>
            <input
              type="checkbox"
              checked={selectedFields.includes(field)}
              onChange={() => handleFieldToggle(field)}
            />
            {field}
          </label>
        ))}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {selectedFields.map(field => (
                <th key={field} className={styles.th}>{field}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((item, idx) => (
              <tr key={idx}>
                {selectedFields.map(field => (
                  <td key={field} className={styles.td}>
                    {JSON.stringify(item[field]) || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {results.length > 0 && (
        <CSVLink
          data={results.map(row => {
            const obj = {};
            selectedFields.forEach(f => (obj[f] = row[f]));
            return obj;
          })}
          filename={`${selectedIndex}-export.csv`}
          className={styles.downloadButton}
        >
          Download CSV
        </CSVLink>
      )}
    </div>
  );
};

export default DBSearch;
