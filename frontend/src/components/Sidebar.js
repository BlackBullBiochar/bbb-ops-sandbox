import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import logo from '../assets/images/bbbLogoWhiteTransparentNoText.png';

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
            to="/"
            className={({ isActive }) =>
              isActive ? styles.menuItemSelected : styles.menuItem
            }
          >
            Stock Database
          </NavLink>
        </li>
        
        <li>
          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              isActive ? styles.menuItemSelected : styles.menuItem
            }
          >
            Tasks & Checks
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/charcodes"
            className={({ isActive }) =>
              isActive ? styles.menuItemSelected : styles.menuItem
            }
          >
            Charcodes
          </NavLink>

        </li>
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
          View Uploads
        </NavLink>
        </li>
        <li>
        <NavLink
          to="/data-analysis"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
          Data Analysis ARA
        </NavLink>
        </li>
        <li>
        <NavLink
          to="/data-analysis-jnr"
          className={({ isActive }) =>
            isActive ? styles.menuItemSelected : styles.menuItem
          }
        >
          Data Analysis JNR
        </NavLink>
        </li>
        <li>
          <NavLink
            to="/AlertDashboard"
            className={({ isActive }) =>
              isActive ? styles.menuItemSelected : styles.menuItem
            }
          >
            Checks & Alerts
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
