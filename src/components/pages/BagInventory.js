// pages/CharcodeSummary.jsx
import React, { useState, useEffect } from "react";
import styles from "./DataAnalysisPage.module.css";
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from "../ModuleMain.js";
import Table from "../Table.js";
import { ACTIONS, useFilterDispatch } from "../../contexts/FilterContext.js";
import { useBagInventory } from "../../hooks/useBagInventory.js"

const BagInventory = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState('2020-01-01');
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fetchToggle, setFetchToggle] = useState(false);

  const { stats = {}, loading, error } = useBagInventory(fetchToggle);
  console.log(stats);
  const ARATBags = stats?.baggedARA?.total ?? 0;
  const JNRTBags = stats?.baggedJNR?.total ?? 0;
  const BOWTBags = stats?.deliveredToStorage?.total ?? 0;
  const ARAEBC = stats?.baggedARA?.ebcApproved ?? 0;
  const JNREBC = stats?.baggedJNR?.ebcApproved ?? 0;
  const BOWEBC = stats?.deliveredToStorage?.ebcApproved ?? 0;
  const ARANONEBC = ARATBags - ARAEBC ?? 0;
  const JNRNONEBC = JNRTBags - JNREBC ?? 0;
  const BOWNONEBC = BOWTBags - BOWEBC ?? 0;
  const AssARAEBC = stats?.baggedARA?.assBags ?? 0;
  const AssJNREBC = stats?.baggedJNR?.assBags ?? 0;
  const AssBOWEBC = stats?.deliveredToStorage?.assBags ?? 0;
  const ARAFree = ARATBags - AssARAEBC ?? 0;
  const JNRFree = JNRTBags - AssJNREBC ?? 0;
  const BOWFree = BOWTBags - AssBOWEBC ?? 0;




  const dispatch = useFilterDispatch();
  const columns = [
    { key: 'Site', label: 'Site' },
    { key: 'TBags', label: 'Total Bags' },
    { key: 'EBCBags', label: 'EBC Bags' },
    { key: 'NONEBC', label: 'NON-EBC Bags' },
    { key: 'AssBags', label: 'Assigned Bags' },
    { key: 'FBags', label: 'Free Bags' }
  ];

  const data = [
    { Site: 'Ahlstrom', TBags: ARATBags, EBCBags: ARAEBC, NONEBC: ARANONEBC, AssBags: AssARAEBC, FBags: ARAFree },
    { Site: 'Jenkinson', TBags: JNRTBags, EBCBags: JNREBC, NONEBC: JNRNONEBC, AssBags: AssJNREBC, FBags: JNRFree },
    { Site: 'Warehouse', TBags: BOWTBags, EBCBags: BOWEBC, NONEBC: BOWNONEBC, AssBags: AssBOWEBC, FBags: BOWFree },
  ];

  
  useEffect(() => {
    handleFetch();
  }, []);

  const handleFetch = () => {
    dispatch({ type: ACTIONS.SET_MODE, payload: 'range' });
    dispatch({ type: ACTIONS.SET_FROM_DATE, payload: fromDate });
    dispatch({ type: ACTIONS.SET_TO_DATE, payload: toDate });

    setTimeout(() => { dispatch({ type: ACTIONS.RESET_FILTERS }); }, 10);
    setFetchToggle(true);
    setTimeout(() => setFetchToggle(false), 10);
  };

  return (
    <div className={styles.mainWhiteContainer}>
      <ScreenHeader name="Bag Inventory"/>
      <ModuleMain>
            <div className={styles.contentGrid}>
              <Table spanColumn = {24} columns={columns} data={data} />
            </div>
      </ModuleMain>
    </div>
  );
};

export default BagInventory;
