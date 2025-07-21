import React, { useState } from 'react';
import styles from './CharcodesAlertBoard.module.css';
import CharcodeOverlayCard from './CharcodeOverlayCard';
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

  // 1) Get expanded charcode and derive mode/date
  const expandedCharcode = expanded !== null ? charcodes[expanded] : null;
  const mode = expandedCharcode ? 'single' : null;
  const date = expandedCharcode
    ? String(expandedCharcode.bagging_date).split('T')[0]
    : null;

  // 2) Group by latest non-deleted EBC status
  const grouped = {
    approved: [],
    flagged: [],
    pending: [],
    postApproved: [],
    rejected: [],
  };

  charcodes.forEach((c, idx) => {
    // filter and sort statuses
    const active = (c.ebcStatuses || []).filter(s => !s.is_deleted);
    active.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const status = active.length ? active[0].status : 'Pending';
    const norm = status.toLowerCase();

    const item = { ...c, _index: idx, ebcCertStatus: status };
    switch (norm) {
      case 'approved':
        grouped.approved.push(item);
        break;
      case 'flagged':
        grouped.flagged.push(item);
        break;
      case 'post-approved':
        grouped.postApproved.push(item);
        break;
      case 'rejected':
        grouped.rejected.push(item);
        break;
      default:
        grouped.pending.push(item);
    }
  });

  // 3) Render a section if visible
  const renderSection = (key, label, cards) =>
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

      {/* Expanded overlay card */}
      {expandedCharcode && (() => {
        const siteCode = String(expandedCharcode._site);
          return (
            <CharcodeOverlayCard
              mode={mode}
              date={date}
              parsed={expandedCharcode}
              onClose={() => setExpanded(null)}
              site={siteCode}
            />
          );
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
          day: 'numeric', month: 'long', year: 'numeric'
        })
      ) : '—'}
    </div>
    <div>
      <strong>ID:</strong> {parsed.charcode || 'N/A'}
    </div>
  </div>
);

export default CharcodesAlertBoard;
