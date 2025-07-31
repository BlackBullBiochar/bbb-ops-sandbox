import React, { useState} from 'react';
import styles from './UploadDataPage.module.css';
import ScreenHeader from '../ScreenHeader';
import ModuleMain from '../ModuleMain';
import DateSelector from '../DateSelector';
import { useUploadedFiles } from '../../hooks/useUploadedFiles';
import { useSiteNames } from '../../hooks/useSiteNames';
import { useFilterDispatch, ACTIONS } from '../../contexts/FilterContext';

const UploadDataPage = () => {
  const dispatch = useFilterDispatch();
  const siteNames = useSiteNames();
  const [isRange, setIsRange] = useState(false);
  const [singleDate, setSingleDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fetchTriggered, setFetchTriggered] = useState(false);
  const mode = isRange ? 'range' : 'single';

  const dataHook = useUploadedFiles('data', fetchTriggered);

  const handleFetch = () => {
    if (mode === 'single' && !singleDate) return alert('Pick a date');
    if (mode === 'range' && (!fromDate || !toDate)) return alert('Pick both start and end dates');
    dispatch({ type: ACTIONS.SET_MODE, payload: mode });
    if (mode === 'single') {
      dispatch({ type: ACTIONS.SET_SINGLE_DATE, payload: singleDate });
    } else {
      dispatch({ type: ACTIONS.SET_FROM_DATE, payload: fromDate });
      dispatch({ type: ACTIONS.SET_TO_DATE, payload: toDate });
    }
    setFetchTriggered(true);
  };

  const renderTable = (bucketId, summary, hook) => {
    const isOpen = hook.expanded.includes(bucketId);
    const rows = hook.rowsCache[bucketId] || [];
    const headers = rows.length > 0
      ? Object.keys(rows[0]).filter(h => h !== '_id')
      : [];

    const siteName = siteNames[summary._site] || summary._site;
    const dateTitle = summary.date
      ? new Date(summary.date).toLocaleDateString()
      : `${summary.year}-${String(summary.month).padStart(2, '0')}`;
    const title = `${siteName} — ${dateTitle}`;

    return (
      <div key={bucketId} className={styles.bucketContainer}>
        <div
          className={styles.bucketHeader}
          onClick={() => hook.toggleBucket(bucketId)}
        >
          <div className = {styles.titleBig}>{title}</div>
          <button
            className={styles.deleteButton}
            onClick={e => { e.stopPropagation(); hook.deleteBucket(bucketId); }}
          >
            Delete
          </button>
        </div>
        {isOpen && (
          <table className={styles.table}>
            <thead>
              <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {headers.map(h => <td key={h}>{row[h]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <ScreenHeader name="Uploaded Data" />
      <ModuleMain>
        <DateSelector
          isRange={isRange}
          singleDate={singleDate}
          fromDate={fromDate}
          toDate={toDate}
          onToggle={() => setIsRange(prev => !prev)}
          onChange={(type, value) => {
            if (type === 'single') setSingleDate(value);
            if (type === 'from') setFromDate(value);
            if (type === 'to') setToDate(value);
          }}
          onFetch={handleFetch}
        />

        <div className = {styles.titleBigger}>Temp Data Uploads</div>
        {fetchTriggered && (
          Object.entries(dataHook.buckets).length > 0
            ? Object.entries(dataHook.buckets).map(([id, doc]) => renderTable(id, doc, dataHook))
            : <p>No data uploads found.</p>
        )}
      </ModuleMain>
    </div>
  );
};

export default UploadDataPage;
