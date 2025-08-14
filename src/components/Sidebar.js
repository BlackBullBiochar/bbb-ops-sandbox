import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import logo from '../assets/images/bbbLogoWhite.png';

const Sidebar = () => {
  return (
    <div style={{
      width: '200px',
      height: '100vh',
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      <img src={logo} className={styles.bbbLogo}/>
      <h3 style = {{color: 'white', paddingLeft: '1rem'}}>Menu</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>
        <NavLink
          to="/upload"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
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
          Upload History
        </NavLink>
        </li>
        <li>
        <NavLink
          to="/Database"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
          Database
        </NavLink>
        </li>
        <li>
        <NavLink
          to="/data-analysis"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
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
          JNR Dashboard
        </NavLink>
        </li>
        <li>
          <NavLink
            to="/AlertDashboard"
            className={({ isActive }) =>
              isActive ? styles.menuItemSelected : styles.menuItem
            }
          >
            EBC Dashboard
          </NavLink>
        </li>
        <li>
        <NavLink
          to="/Bag-Inventory"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
          Bag Inventory  
        </NavLink>
        </li>
        <li>
        <NavLink
          to="/Charcode-Summary"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
          Charcode Summary  
        </NavLink>
        </li>
        <li>
        <NavLink
          to="/Plant-Summary"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
          Plant Summary
        </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;