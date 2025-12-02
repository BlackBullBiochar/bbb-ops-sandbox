import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import logo from '../assets/images/bbbLogoWhite.png';
import { useCallback, useContext } from 'react';
import { UserContext } from '../UserContext';
import Icon from './Icon.js';
import { API } from '../config/api';


const Sidebar = () => {
    const navigate = useNavigate(); //use callback
    const { setUser } = useContext(UserContext);

  const API_URL = API;

  const goToScreen = useCallback((screenName, params) => {
    const freshParams = { ...params };
    navigate(screenName, { state: freshParams, replace: true });
  }, [navigate]);

  const openDocs = async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      alert("Please log in to access documentation");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/docs/bootstrap`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403) {
          alert("Admin access required to view documentation");
        } else {
          alert("Failed to prepare documentation session. Please try again.");
        }
        return;
      }

      const docsUrl = `${API_URL.replace(/\/$/, "")}/docs/`;
      window.open(docsUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error loading documentation:", error);
      alert("Failed to load documentation. Please try again.");
    }
  };

  const logout = () => {
      localStorage.removeItem("token");
      setUser(prev => ({
        ...prev,
        authed: false,
        token: null,
      }));
      goToScreen("/");
  };

  return (
    <div style={{
      width: '250px',
      height: '100vh',
      boxSizing: 'border-box',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center'
    }}>
      <img src={logo} className={styles.bbbLogo}/>
      <ul style={{ listStyle: 'none', padding: 0 }}>
      <li>
        <NavLink
          to="/database"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
          <Icon name="FaDatabase" size={16} className={styles.navIcon} />
          Database
        </NavLink>
        </li>
        <li>
        <NavLink
          to="/upload"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
          <Icon name="FaUpload" size={16} className={styles.navIcon} />
          Upload
        </NavLink>
        </li>

        <li>
        <NavLink
          to="/view-uploads"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
          <Icon name="FaHistory" size={16} className={styles.navIcon} />
          Upload History
        </NavLink>
        </li>
        
        <li>
        <NavLink
          to="/data-analysis"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
          <Icon name="FaChartLine" size={16} className={styles.navIcon} />
          ARA Dashboard
        </NavLink>
        </li>
        <li>
        <NavLink
          to="/data-analysis-jnr"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
          <Icon name="FaChartBar" size={16} className={styles.navIcon} />
          JNR Dashboard
        </NavLink>
        </li>
        <li>
          <NavLink
            to="/alert-dashboard"
            className={({ isActive }) =>
              isActive ? styles.menuItemSelected : styles.menuItem
            }
          >
            <Icon name="FaExclamationTriangle" size={16} className={styles.navIcon} />
            EBC Dashboard
          </NavLink>
        </li>
        
        <li>
        <NavLink
          to="/charcode-summary"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
          <Icon name="FaBarcode" size={16} className={styles.navIcon} />
          Charcode Summary  
        </NavLink>
        </li>
        <li>
        <NavLink
          to="/plant-summary"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
          <Icon name="FaIndustry" size={16} className={styles.navIcon} />
          Plant Summary
        </NavLink>
        </li>

      </ul>
      <div className={styles.footerActions}>
        <div onClick={openDocs} className={styles.footerAction}>
          Doc <span className={styles.logoutIcon}><Icon name="FaBook" size={16} /></span>
        </div>
        <div onClick={logout} className={styles.footerAction}>
          Logout <span className={styles.logoutIcon}><Icon name="FaSignOutAlt" size={16} /></span>
        </div>
      </div>
            <div className={styles.bbbNavFooter}>
                BLACK BULL BIOCHAR
            </div>
    </div>
  );
};

export default Sidebar;