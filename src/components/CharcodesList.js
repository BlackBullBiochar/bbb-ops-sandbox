import React from 'react';
import ModuleClickable from './ModuleClickable';
import styles from './CharcodesList.module.css';

const CharcodesList = ({ charcodes = [], expanded, onToggle, spanColumn }) => {
  return (
    <ModuleClickable
      name="Charcodes"
      spanColumn={spanColumn || 21}
      spanRow={expanded ? 6 : 2}
      onClick={onToggle}
    >
      <div className={styles.grid}>
        {charcodes.slice(0, 8).map((row, i) => (
          <CharcodeCard key={`always-${i}`} parsed={row} />
        ))}

        {expanded && charcodes.slice(8).map((row, i) => (
          <CharcodeCard key={`expanded-${i}`} parsed={row} />
        ))}
      </div>

      {!expanded && (
        <div className={styles.hint}>
          Click to view all charcodes
        </div>
      )}
    </ModuleClickable>
  );
};

const CharcodeCard = ({ parsed }) => {
  // 1) pull out and filter your statuses
  const activeStatuses = (parsed.ebcStatuses || [])
    .filter(s => !s.is_deleted);

  // 2) sort descending by created_date so the first is the latest
  activeStatuses.sort(
    (a,b) => new Date(b.created_date) - new Date(a.created_date)
  );

  // 3) pick the status string (or fallback)
  const ebcCertStatus = activeStatuses.length > 0
    ? activeStatuses[0].status
    : '—';

  return (
    <div
      className={`${styles.card} ${
        ebcCertStatus === 'Approved'      ? styles.approved :
        ebcCertStatus === 'Flagged'       ? styles.flagged  :
        ebcCertStatus === 'Pending'       ? styles.pending  :
        ebcCertStatus === 'Post-Approved' ? styles.postApproved :
        ebcCertStatus === 'Rejected'      ? styles.rejected : ''
      }`}
    >
      {[
        { label: 'Charcode',            value: parsed.charcode },
        { label: 'EBC Cert Status',     value: ebcCertStatus  },
        { label: 'status',              value: parsed.status  },
        { label: 'MC',                  value: parsed.moisture_content },
        {
          label: 'Bagging Date',
          value: parsed.bagging_date
            ? new Date(parsed.bagging_date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : '—',
        },
        { label: 'Biochar Weight (kg)', value: parsed.weight },
        { label: 'EBC Batch ID',            value: parsed.batch_id },
      ].map(({ label, value }, i) => (
        <div key={i} className={styles.row}>
          <strong>{label}:</strong>{' '}
          {typeof value === 'object' && value !== null
            ? JSON.stringify(value)
            : String(value || '—')}
        </div>
      ))}
    </div>
  );
};

export default CharcodesList;
