import React, { useState, useEffect, useRef, useContext} from 'react';
import styles from './AlertDashboard.module.css';
import Module from '../Module.js';
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from '../ModuleMain.js'
import DateSelector from '../DateSelector.js'
import CharcodesAlertBoard from '../CharcodesAlertBoard';
import SiteSelector from '../SiteSelector';
import { useFilterDispatch, ACTIONS } from '../../contexts/FilterContext';
import { useSiteNames } from '../../hooks/useSiteNames';
import { useBagDataRows } from '../../hooks/useBagDataRows';

const AlertDashboard = () => {
  const dispatch = useFilterDispatch();
  const siteNames = useSiteNames();

  const [expanded, setExpanded] = useState(false);
  const [isRange, setIsRange] = useState(false);
  const [singleDate, setSingleDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fetchToggle, setFetchToggle] = useState(false)

  
  const [selectedSites, setSelectedSites] = useState(['ARA', 'JNR']);

  const handleToggleSite = (site) => {
    setSelectedSites((prev) =>
      prev.includes(site) ? prev.filter(s => s !== site) : [...prev, site]
    );
  };
  
  const ARAbagRows = useBagDataRows(
    'ARA',
    fetchToggle && selectedSites.includes('ARA')
  );
  const JNRbagRows = useBagDataRows(
    'JNR',
    fetchToggle && selectedSites.includes('JNR')
  );

  const mode = isRange ? 'range' : 'single';
  
  const handleFetch = () => {
    if (mode === 'single' && !singleDate) return alert('Pick a date');
    if (mode === 'range' && (!fromDate || !toDate)) return alert('Pick both start and end dates');

    dispatch({ type: ACTIONS.SET_MODE, payload: mode });
    dispatch({ type: ACTIONS.SET_SINGLE_DATE, payload: singleDate });
    dispatch({ type: ACTIONS.SET_FROM_DATE, payload: fromDate });
    dispatch({ type: ACTIONS.SET_TO_DATE, payload: toDate });
    setTimeout(() => { dispatch({ type: ACTIONS.RESET_FILTERS }); }, 10);

    // toggle to re-trigger data hooks
    setFetchToggle(true);
    setTimeout(() => setFetchToggle(false), 10); 
  };

  return (
    <div className={styles.mainWhiteContainer}>
      <ScreenHeader name={"EBC Alert Dashboard"} />
        <ModuleMain>
          <div>
          <div className={styles.topRow}>
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
            <SiteSelector
              selected={selectedSites}
              onToggle={handleToggleSite}
              options={[
                { key: 'ARA', label: 'ARA' },
                { key: 'JNR', label: 'JNR' }
              ]}
            />
          </div>
          <div className={styles.contentGrid}>
            {selectedSites.includes('ARA') && (
              <Module name="Charcodes ARA" spanColumn={24}>
                <CharcodesAlertBoard charcodes={ARAbagRows} />
              </Module>
            )}

            {selectedSites.includes('JNR') && (
              <Module name="Charcodes JNR" spanColumn={24}>
                <CharcodesAlertBoard charcodes={JNRbagRows} />
              </Module>
            )}
          </div>
          </div>
        </ModuleMain>
    </div>
  );  
};

export default AlertDashboard;