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
    'rejected'
  ]);

  const handleToggleGroup = (group) => {
    setVisibleGroups((prev) =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const parsedCharcodes = charcodes.map((row) => {
    const parsed = JSON.parse(row);
    return parsed;
  });

  const grouped = {
    approved: [],
    flagged: [],
    pending: [],
    postApproved: [],
    rejected: [],
  };

  parsedCharcodes.forEach((c, idx) => {
    const status = c['EBC Cert Status']?.toLowerCase();
    if (status === 'approved') grouped.approved.push({ ...c, _index: idx });
    else if (status === 'flagged') grouped.flagged.push({ ...c, _index: idx });
    else if (status === 'post-approved') grouped.postApproved.push({ ...c, _index: idx });
    else if (status === 'rejected') grouped.rejected.push({ ...c, _index: idx });
    else grouped.pending.push({ ...c, _index: idx });
  });

  const renderSection = (key, label, cards) => (
    visibleGroups.includes(key) && (
      <div className={styles.section} key={key}>
        <h3>{label}</h3>
        <div className={styles.grid}>
          {cards.map((parsed) => (
            <CharcodePreviewCard
              key={parsed._index}
              parsed={parsed}
              onClick={() => setExpanded(parsed._index)}
            />
          ))}
        </div>
      </div>
    )
  );

  const expandedCharcode = parsedCharcodes[expanded];
  const site = expandedCharcode?.site?.toLowerCase();

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

      {expanded !== null && site === 'ara' && (
        <CharcodeOverlayCard
          parsed={expandedCharcode}
          onClose={() => setExpanded(null)}
        />
      )}
      {expanded !== null && site === 'jnr' && (
        <CharcodeOverlayCardJNR
          parsed={expandedCharcode}
          onClose={() => setExpanded(null)}
        />
      )}
    </div>
  );
};

const CharcodePreviewCard = ({ parsed, onClick }) => (
  <div
    className={`${styles.card} ${
      parsed['EBC Cert Status'] === 'Approved' ? styles.approved :
      parsed['EBC Cert Status'] === 'Flagged' ? styles.flagged :
      parsed['EBC Cert Status'] === 'Pending' ? styles.pending :
      parsed['EBC Cert Status'] === 'Post-Approved' ? styles.postApproved :
      parsed['EBC Cert Status'] === 'Rejected' ? styles.rejected : ''
    }`}
    onClick={onClick}
  >
    <div><strong>Produced:</strong> {parsed.Produced}</div>
    <div><strong>ID:</strong> {parsed.ID || parsed['Charcode ID'] || 'N/A'}</div>
  </div>
);

export default CharcodesAlertBoard;