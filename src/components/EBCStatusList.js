import React, { useContext } from 'react';
import styles from './EBCStatusList.module.css';
import { UserContext } from '../UserContext.js';
import Button from './Button.js';
import { API } from '../config/api';
import ebcBatchMappings from '../config/ebcBatchMappings.json';

/**
 * Gets the EBC batch URL for a given batch_id based on the mapping configuration.
 * @param {string} batchId - The batch ID (e.g., "BA-GB-CA11-01", "BA-GB-455-1-1")
 * @returns {string} The EBC URL for the batch
 */
const getEbcBatchUrl = (batchId) => {
  if (!batchId || batchId === "" || batchId.toLowerCase() === "batchless" || batchId.toLowerCase() === "n/a") {
    return ebcBatchMappings.fallbackUrl;
  }

  const batchIdLower = batchId.toLowerCase();
  
  // Check for specific mappings first (case-insensitive lookup)
  // Try lowercase first, then check all keys case-insensitively
  let mapping = ebcBatchMappings.batchMappings[batchIdLower];
  
  if (!mapping) {
    // Case-insensitive fallback: find matching key regardless of case
    const matchingKey = Object.keys(ebcBatchMappings.batchMappings).find(
      key => key.toLowerCase() === batchIdLower
    );
    if (matchingKey) {
      mapping = ebcBatchMappings.batchMappings[matchingKey];
    }
  }
  
  if (mapping) {
    // If the mapping is a full URL (starts with http), return it as-is
    // Otherwise, it's a path that should be appended to baseUrl
    if (mapping.startsWith("http")) {
      return mapping;
    }
    return ebcBatchMappings.baseUrl + mapping;
  }

  // If no mapping found, return fallback URL
  return ebcBatchMappings.fallbackUrl;
};

const EbcStatusList = ({ charcodeId, ebcEntries = [], onDeleted, batchId }) => {
  const { user } = useContext(UserContext);

  // Check if there's an approved or post-approved status
  const hasApprovedStatus = ebcEntries.some(entry => {
    const statusLower = (entry.status || "").toLowerCase();
    return statusLower === "approved" || statusLower === "post-approved";
  });

  const ebcUrl = batchId ? getEbcBatchUrl(batchId) : null;
  const shouldShowLink = hasApprovedStatus && ebcUrl && ebcUrl !== "";

  if (!Array.isArray(ebcEntries) || ebcEntries.length === 0) {
    return <div className={styles.empty}>No EBC Data</div>;
  }

  return (
    <div>
      {shouldShowLink && (
        <div className={styles.ebcLinkContainer}>
          <a 
            href={ebcUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.ebcLink}
          >
            View EBC Certificate →
          </a>
        </div>
      )}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '50%' }} />
            <col style={{ width: '35%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Status</th>
              <th>Reason</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {ebcEntries.slice().map((entry) => (
              <tr key={`${entry.date}-${entry.time}-${entry.status}`}> 
                <td>{entry.status}</td>
                <td>{entry.reason}</td>
                <td>{entry.created_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EbcStatusList;
