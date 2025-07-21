// pages/CharcodeSummary.jsx
import React, { useContext, useState } from "react";
import styles from "./DataAnalysisPage.module.css";
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from "../ModuleMain.js";
import Module from "../Module.js";
import DateSelector2 from "../DateSelector2.js";
import SiteSelector from "../SiteSelector";
import Figure2 from "../Figure2.js"
import PieChart from '../PieChart';  

import { BagProvider, BagContext } from "../CharcodeSummaryContext.js";
import { UserContext } from "../../UserContext.js";

const CharcodeSummaryView = () => {
  const {
  isWeek, week, fromDate, toDate,
  araBagging, jnrBagging,
  araApplication, jnrApplication,
  araFlaggedBags, jnrFlaggedBags,
  loading, error,
  handleToggle, handleChange, handleFetch,
  upcoming, delivered, pickedUp,
  FlaggedDeliveryBags, Pickup, Delivery,
  } = useContext(BagContext);

  const appBags = araApplication + jnrApplication;

const totalAraBags = araBagging;
const totalJnrBags = jnrBagging;
const totalDeliveries = upcoming + delivered + pickedUp;

const flaggedDelPercent = ((FlaggedDeliveryBags/(Delivery + Pickup))*100).toFixed(0);

const sucDelPercent = totalDeliveries > 0
  ?(((pickedUp + delivered)/totalDeliveries)*100).toFixed(0)
  :0;
// data arrays for pie chart: [ flagged, non-flagged ]
  const araData = [
    araFlaggedBags,
    totalAraBags - araFlaggedBags
  ];

  const jnrData = [
    jnrFlaggedBags,
    totalJnrBags - jnrFlaggedBags
  ];

  // percentages of flagged
  const araFlaggedPercent = totalAraBags > 0
    ? ((araFlaggedBags/totalAraBags) * 100).toFixed(0)
    : 0;

  const jnrFlaggedPercent = totalJnrBags > 0
    ? ((jnrFlaggedBags/totalJnrBags) * 100).toFixed(0)
    : 0;

  const [selectedSites, setSelectedSites] = useState(["bP", "sP", "aP"]);
  const labels = ['Good Bags', 'Flagged Bags'];

  const handleToggleSite = (site) => {
    setSelectedSites((prev) =>
      prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site]
    );
  };

  return (
    <div>
      {/* Top row: DateSelector2 + SiteSelector */}
      <div className={styles.topRow}>
        <DateSelector2
          isWeek={isWeek}
          week={week}
          fromDate={fromDate}
          toDate={toDate}
          onToggle={handleToggle}
          onChange={handleChange}
          onFetch={handleFetch}
        />

        <SiteSelector
          selected={selectedSites}
          onToggle={handleToggleSite}
          options={[
            { key: "bP", label: "Bagging Performance" },
            { key: "sP", label: "Shipping Performance" },
            { key: "aP", label: "Application Performance"},
          ]}
        />
      </div>

      {error && <div className={styles.errorText}>{error}</div>}
      {loading && <div className={styles.loadingText}>Loading…</div>}

      {!loading && !error && (
        <div className={styles.contentGrid}>
          <>
            {selectedSites.includes("bP") && (
              <>
                <Module name="Ahlstrom Bagging Performance" spanColumn={12} spanRow={1}>
                  <Figure2 title="ARA" value={araFlaggedBags} unit="" variant = '2' blurb="Bags logged more than 3 days after production"/>
                </Module>
                <Module name="Ahlstrom Bags" spanColumn={6} spanRow={2}>
                  <PieChart data={araData} labels={labels}/>
                  <Figure2 title="ARA" value={araFlaggedPercent} unit="%" blurb="of bags were on time"/>
                </Module>
                <Module name="Jenkinson Bags" spanColumn={6} spanRow={2}>
                  <PieChart data={jnrData} labels={labels}/>
                  <Figure2 title="ARA" value={jnrFlaggedPercent} unit="%" blurb="of bags were on time"/>
                </Module>
                <Module name="Jenkinson Bagging Performance" spanColumn={12} spanRow={1}>
                  <Figure2 title="ARA" value={jnrFlaggedBags} unit="" variant = '2' blurb="Bags logged more than 3 days after production"/>
                </Module>
              </>
            )}
            {selectedSites.includes("sP") && (
              <>
                <Module name="Scheduled Delivery Performance" spanColumn={12}>
                  <Figure2 title="ARA" value={sucDelPercent} unit="%" blurb="Bags scheduled for shipping were picked up"/>
                </Module>
                <Module name="Shipping Performance" spanColumn={12}>
                  <Figure2 title="ARA" value={flaggedDelPercent} unit="%" blurb="Picked-up bags were delivered on the same day"/>
                </Module>
              </>
            )}
            {selectedSites.includes("aP") && (
              <>
                <Module name="Applied Bags" spanColumn={12}>
                  <Figure2 title="ARA" value={appBags} unit="" blurb="Bags applied"/>
                </Module>
                <Module name="Form Users" spanColumn={12}>
                  <Figure2 title="ARA" value={araApplication} unit="" blurb="Farmers submitted an 'applied' form"/>
                </Module>
              </>
            )}
            </>
        </div>
      )}
    </div>
  );
};

const CharcodeSummary = () => {
  const { user } = useContext(UserContext);

  return (
    <div className={styles.mainWhiteContainer}>
      <ScreenHeader name="Charcode Summary" />
      <ModuleMain>
        <BagProvider user={user}>
          <CharcodeSummaryView />
        </BagProvider>
      </ModuleMain>
    </div>
  );
};

export default CharcodeSummary;
