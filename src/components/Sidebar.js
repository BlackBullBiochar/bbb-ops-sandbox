import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import logo from '../assets/images/bbbLogoWhite.png';
import { useCallback, useContext } from 'react';
import { UserContext } from '../UserContext';


const Sidebar = () => {
    const navigate = useNavigate(); //use callback
    const { setUser } = useContext(UserContext);




  const goToScreen = useCallback((screenName, params) => {
    const freshParams = { ...params };
    navigate(screenName, { state: freshParams, replace: true });
  }, [navigate]);

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
          <i className={`fas fa-database ${styles.navIcon}`}></i>
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
          <i className={`fas fa-upload ${styles.navIcon}`}></i>
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
          <i className={`fas fa-history ${styles.navIcon}`}></i>
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
          <i className={`fas fa-chart-line ${styles.navIcon}`}></i>
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
          <i className={`fas fa-chart-line ${styles.navIcon}`}></i>
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
            <i className={`fas fa-exclamation-triangle ${styles.navIcon}`}></i>
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
          <i className={`fas fa-barcode ${styles.navIcon}`}></i>
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
          <i className={`fas fa-industry ${styles.navIcon}`}></i>
          Plant Summary
        </NavLink>
        </li>
        
      </ul>
      <div onClick={() => logout()} className={styles.logoutContainer}>
                Logout <span className={styles.logoutIcon}>&#xf2f5;</span>
            </div>
            <div className={styles.bbbNavFooter}>
                BLACK BULL BIOCHAR
            </div>
    </div>
  );
};

export default Sidebar;