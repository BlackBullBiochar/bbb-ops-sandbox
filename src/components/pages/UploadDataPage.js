import React, { useState } from 'react';
import styles from './UploadDataPage.module.css';
import ScreenHeader from '../ScreenHeader';
import ModuleMain from '../ModuleMain';
import DateSelector from '../DateSelector';
import Button from '../Button.js';
import { useUploadedFiles } from '../../hooks/useUploadedFiles';
import { useSiteNames } from '../../hooks/useSiteNames';
import { useFilterDispatch, ACTIONS } from '../../contexts/FilterContext';
import SiteSelector from '../SiteSelector';

const META_KEYS = new Set([
  '_id', '__v', '_site', 'site_code', 'form_type',
  'submitted_at', 'createdAt', 'updatedAt', 'date', 'year', 'month'
]);

/*

Maybe shift to 2 column view? Pgination?
*/

const labelise = (key) =>
  key
    .replace(/_/g, ' ')
    .replace(/\b([a-z])/g, (m, c) => c.toUpperCase())
    .replace(/\b(P|C)\s?(\d+)/gi, (m, a, b) => `${a.toUpperCase()}${b}`)
    .replace(/\s{2,}/g, ' ')
    .trim();

const UploadDataPage = () => {
  // ✅ Use the actual keys used below; both selected by default
  const [selectedSites, setSelectedSites] = useState(['Temp', 'Form']);

  const dispatch = useFilterDispatch();
  const siteNames = useSiteNames();

  const [isRange, setIsRange] = useState(false);
  const [singleDate, setSingleDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fetchTriggered, setFetchTriggered] = useState(false);

  const mode = isRange ? 'range' : 'single';

  const dataHook  = useUploadedFiles('data',  fetchTriggered);
  const formsHook = useUploadedFiles('forms', fetchTriggered);

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

  // ✅ Toggle handler for SiteSelector
  const handleToggleSection = (key) => {
    setSelectedSites(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const makeTitle = (summary) => {
    const siteName = siteNames[summary._site] || summary.site_code || summary._site || 'Unknown site';
    const dateObj  = summary.submitted_at || summary.date;
    const dateStr  = dateObj ? new Date(dateObj).toLocaleDateString() :
      `${summary.year}-${String(summary.month).padStart(2, '0')}`;
    return `${siteName} — ${dateStr}`;
  };

  const renderTable = (bucketId, summary, hook, variant = 'temp') => {
    const isOpen = hook.expanded.includes(bucketId);
    const rows   = hook.rowsCache[bucketId] || [];

    const tempHeaders = rows.length > 0
      ? Object.keys(rows[0]).filter(h => h !== '_id')
      : [];

    const formObj = variant === 'form' && rows.length > 0 && rows[0] && typeof rows[0] === 'object'
      ? rows[0]
      : null;

    const formPairs = formObj
      ? Object.keys(formObj)
          .filter(k => !META_KEYS.has(k))
          .map(k => [labelise(k), formObj[k]])
          .sort((a, b) => a[0].localeCompare(b[0]))
      : [];

    return (
      <div key={bucketId} className={styles.bucketContainer}>
        <div
          className={styles.bucketHeader}
          onClick={() => hook.toggleBucket(bucketId)}
        >
          <div className={styles.titleBig}>{makeTitle(summary)}</div>

          {variant === 'temp' && (
            <Button
              name="Delete"
              onPress={e => { e.stopPropagation(); hook.deleteBucket(bucketId); }}
              color="Coal"
              customStyle={{ marginLeft: '1rem' }}
            />
          )}
        </div>
        {isOpen && (
          variant === 'temp' ? (
            <table className={styles.table}>
              <thead>
                <tr>{tempHeaders.map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    {tempHeaders.map(h => <td key={h}>{row[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {formPairs.length > 0 ? (
                  formPairs.map(([label, value]) => (
                    <tr key={label}>
                      <td><strong>{label}</strong></td>
                      <td>{String(value ?? '')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2}>No fields found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )
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

        {/* ✅ This now toggles visibility without re-fetching */}
        <SiteSelector
          selected={selectedSites}
          onToggle={handleToggleSection}
          options={[
            { key: 'Temp', label: 'Temperature Data' },
            { key: 'Form', label: 'Forms Data' }
          ]}
        />

        {selectedSites.includes('Temp') && (
          <>
            <div className={styles.titleBigger}>Temp Data Uploads</div>
            {fetchTriggered ? (
              Object.entries(dataHook.buckets).length > 0
                ? Object.entries(dataHook.buckets).map(([id, doc]) =>
                    renderTable(id, doc, dataHook, 'temp'))
                : <p>No data uploads found.</p>
            ) : (
              <p>Select a date and fetch to view uploads.</p>
            )}
          </>
        )}

        {selectedSites.includes('Form') && (
          <>
            <div className={styles.titleBigger}>Daily Forms</div>
            {fetchTriggered ? (
              Object.entries(formsHook.buckets).length > 0
                ? Object.entries(formsHook.buckets).map(([id, doc]) =>
                    renderTable(id, doc, formsHook, 'form'))
                : <p>No form uploads found.</p>
            ) : (
              <p>Select a date and fetch to view forms.</p>
            )}
          </>
        )}
      </ModuleMain>
    </div>
  );
};

export default UploadDataPage;
