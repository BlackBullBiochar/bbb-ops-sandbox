import { useLocation } from "react-router-dom";
import styles from "./SessionDone.module.css";
import bbbLogo from "../../assets/images/bbbLogo.png";

const SessionDone = () => {
  const { state } = useLocation();
  const ended = state?.ended ?? true;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img src={bbbLogo} alt="BBB" className={styles.logo} />
        <div className={styles.icon}>{ended ? "✓" : "←"}</div>
        <h1 className={styles.title}>
          {ended ? "Stocktake Session Ended" : "Stocktake Session Left"}
        </h1>
        <p className={styles.msg}>You may now close this tab.</p>
      </div>
    </div>
  );
};

export default SessionDone;
