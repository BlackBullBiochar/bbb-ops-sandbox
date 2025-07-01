// CharcodesAlertBoard.jsx
import React, { useState } from 'react';
import styles from './CharcodesAlertBoard.module.css';
import CharcodeOverlayCard from './CharcodeOverlayCard';
import CharcodeOverlayCardJNR from './CharcodeOverlayCardJNR';
import SiteSelector from './SiteSelector';

const CharcodesAlertBoard = ({ charcodes = [] }) => {
  const [expanded, setExpanded] = useState(null);
  const [visibleGroups, setVisibleGroups] = useState([
    'approved',
    'flagged',
    'pending',
    'postApproved',
    'rejected',
  ]);

  const handleToggleGroup = (group) => {
    setVisibleGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  // 1) Pick out the currently expanded charcode object:
  const expandedCharcode = expanded !== null ? charcodes[expanded] : null;

  // 2) Derive “mode” and “date” from expandedCharcode:
  const mode = expandedCharcode ? 'single' : null;
  const date = expandedCharcode 
    ? String(expandedCharcode.bagging_date).split('T')[0]
    : null;

  // 3) Group all charcodes by their EBC status (lowercased), and tag each with its array index:
  const grouped = {
    approved: [],
    flagged: [],
    pending: [],
    postApproved: [],
    rejected: [],
  };

  charcodes.forEach((c, idx) => {
    const status = (c.ebcCertStatus || '').toLowerCase();
    if (status === 'approved') grouped.approved.push({ ...c, _index: idx });
    else if (status === 'flagged') grouped.flagged.push({ ...c, _index: idx });
    else if (status === 'post-approved') grouped.postApproved.push({ ...c, _index: idx });
    else if (status === 'rejected') grouped.rejected.push({ ...c, _index: idx });
    else grouped.pending.push({ ...c, _index: idx });
  });

  // 4) Render one section of preview‐cards:
  const renderSection = (key, label, cards) =>
    visibleGroups.includes(key) && (
      <div className={styles.section} key={key}>
        <h3>{label}</h3>
        <div className={styles.grid}>
          {cards.map((parsed) => (
            <CharcodePreviewCard
              key={parsed._index}
              parsed={parsed}
              onClick={() => {
                setExpanded(parsed._index);
              }}
            />
          ))}
        </div>
      </div>
    );

  return (
    <div className={styles.alertBoard}>
      <SiteSelector
        selected={visibleGroups}
        onToggle={handleToggleGroup}
        options={[
          { key: 'flagged', label: 'Flagged' },
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'postApproved', label: 'Post-Approved' },
          { key: 'rejected', label: 'Rejected' },
        ]}
      />

      {renderSection('flagged', 'Flagged', grouped.flagged)}
      {renderSection('pending', 'Pending', grouped.pending)}
      {renderSection('approved', 'Approved', grouped.approved)}
      {renderSection('postApproved', 'Post-Approved', grouped.postApproved)}
      {renderSection('rejected', 'Rejected', grouped.rejected)}

      {/* If we have an expandedCharcode, render the correct overlay: */}
      {expandedCharcode && (() => {
        const siteCode = (expandedCharcode._site || '')
        if (siteCode === '6661c6cc2e943e2babeca581') {
          return (
            <CharcodeOverlayCard
              mode={mode}
              date={date}
              parsed={expandedCharcode}
              onClose={() => setExpanded(null)}
              site={siteCode}
            />
          );
        } else if (siteCode === '6661c6bd2e943e2babec9b4d') {
          return (
            <CharcodeOverlayCardJNR
              mode={mode}
              date={date}
              parsed={expandedCharcode}
              onClose={() => setExpanded(null)}
              site={siteCode}
            />
          );
        } else {
          // Fallback if site is missing or unrecognized:
          return (
            <div className={styles.overlayFallback}>
              <button onClick={() => setExpanded(null)}>Close</button>
              <p>No overlay available for site “{expandedCharcode.site}”.</p>
            </div>
          );
        }
      })()}
    </div>
  );
};


const CharcodePreviewCard = ({ parsed, onClick }) => (
  <div
    className={`${styles.card} ${
      parsed.ebcCertStatus === 'Approved'
        ? styles.approved
        : parsed.ebcCertStatus === 'Flagged'
        ? styles.flagged
        : parsed.ebcCertStatus === 'Pending'
        ? styles.pending
        : parsed.ebcCertStatus === 'Post-Approved'
        ? styles.postApproved
        : parsed.ebcCertStatus === 'Rejected'
        ? styles.rejected
        : ''
    }`}
    onClick={onClick}
  >
    <div>
      <strong>Produced: </strong>
      {parsed.bagging_date ? (
        new Date(parsed.bagging_date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      ) : (
        '—'
      )}
    </div>
    <div>
      <strong>ID:</strong> {parsed.ID || parsed['Charcode ID'] || parsed.charcode || 'N/A'}
    </div>
  </div>
);

export default CharcodesAlertBoard;
