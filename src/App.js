// App.jsx

// TODO: 
/*
CHECK IF DATAANAYLSIS CONTEXT NEEDED ANYMORE
URI STRINGS LOWERCASE
MAKE SMALL ADJUSTMENTS TO LOGIN SCREEN
POTENTIALLY MERGE ARA AND JNR DASHBOARD COMPONENTS


*/
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import styles from './App.module.css';

import Sidebar from './components/Sidebar';
import UploadForm from './components/pages/UploadForm';
import UploadDataPage from './components/pages/UploadDataPage';
import DataAnalysisPage from './components/pages/DataAnalysisPage';
import DataAnalysisPageJNR from './components/pages/DataAnalysisPageJNR';
import AlertDashboard from './components/pages/AlertDashboard';
import LoginScreen from './components/pages/LoginScreen';
import SignUpPage from './components/pages/SignUpPage';
import BagInventory from './components/pages/BagInventory';
import CharcodeSummary from './components/pages/CharcodeSummary'
import PlantSummary from './components/pages/PlantSummary';
import { DataAnalysisProvider } from './components/DataAnalysisContext';
import { UserContext } from "./UserContext";
import { API } from './config/api';
import { FilterProvider } from './contexts/FilterContext';
import AhlstromForm from './components/pages/AhlstomForm';
import JenkinsonForm from './components/pages/JenkinsonForm';
import DBSearch from './components/pages/DbSearch'

const App = () => {
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const navigate = useNavigate();
  // Our “user” object in context. We’ll populate `API` + `token` here.
  const [user, setUser] = useState({
    token: null,
    authed: false,
  });
  
  const setUserDetails = (user, responseData, stayLoggedIn ) => {
      user.token = responseData.token;
      user.details = {};
      user.details.id = responseData.user._id;
      user.details.email = responseData.user.email;
      user.details.businessName = responseData.user.business_name;
      user.details.firstName = responseData.user.first_name;
      user.details.lastName = responseData.user.last_name;
      user.details.country = responseData.user.country;
      user.details.language = responseData.user.language;
      user.authed = true;
      if(stayLoggedIn){
        console.log("TOKEN SET")
        localStorage.setItem("token", user.token);
      }else{
        console.log("STAY LOGGED OUT")
        localStorage.removeItem("token");
      }
  }

  const setAdminDetails = (user, responseData, stayLoggedIn ) => {
    user.token = responseData.token;
    user.details = {};
    user.details.id = responseData.user._id;
    user.details.email = responseData.user.email;
    user.details.firstName = responseData.user.first_name;
    user.details.lastName = responseData.user.last_name;
    user.details.privileges = responseData.user.privileges;
    user.details.language = responseData.user.language;
    user.authed = true;
    if(stayLoggedIn){
      console.log("TOKEN SET")
      localStorage.setItem("token", user.token);
    }else{
      console.log("STAY LOGGED OUT")
      localStorage.removeItem("token");
    }
}

  // On page‐load, try to refresh the stored JWT
  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (!stored) {
      return; // no token → remain unauthenticated
    }

    fetch(`${API}/refresh-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(resJson => {
        // grab the new JWT from resJson.data.token
        const newToken = resJson.data.token;
        localStorage.setItem('token', newToken);

        // update our user context
        setUser(prev => ({
          ...prev,
          token: newToken,
          authed: true,
        }));
        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      });
      return navigate();
  }, []);

  const handleLogin = (returnedToken) => {
    localStorage.setItem('token', returnedToken);
    setUser(prev => ({
      ...prev,
      token: returnedToken,
      authed: true,
    }));
    setIsAuthenticated(true);
    return;
  };


  //SCRAP
  const handleSignUp = (returnedToken) => {
    localStorage.setItem('token', returnedToken);
    setUser(prev => ({
      ...prev,
      token: returnedToken,
      authed: true,
    }));
    setIsAuthenticated(true);
  };

 return (
  <UserContext.Provider value={{ user, setUser }}>
    <FilterProvider>
      <DataAnalysisProvider>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              user.authed ? (
                <Navigate to="/upload" replace />
              ) : (
                <LoginScreen
                  onLogin={handleLogin}
                  setUserDetails={setUserDetails}
                  setAdminDetails={setAdminDetails}
                />
              )
            }
          />
          <Route path="/ahlstrom-form" element={<AhlstromForm />} />
          <Route path="/jenkinson-form" element={<JenkinsonForm />} />

          {/* Protected app layout */}
          <Route
            element={
              user.authed ? (
                <div className={styles.appContainer}>
                  <Sidebar />
                  <div className={styles.mainWhiteContainer}>
                    <Outlet />
                  </div>
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            }
          >
            <Route path="/upload" element={<UploadForm />} />
            <Route path="/view-uploads" element={<UploadDataPage />} />
            <Route path="/data-analysis" element={<DataAnalysisPage />} />
            <Route path="/data-analysis-jnr" element={<DataAnalysisPageJNR />} />
            <Route path="/alert-dashboard" element={<AlertDashboard />} />
            <Route path="/bag-inventory" element={<BagInventory />} />
            <Route path="/charcode-summary" element={<CharcodeSummary />} />
            <Route path="/plant-summary" element={<PlantSummary />} />
            <Route path="/database" element={<DBSearch />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to={user.authed ? '/upload' : '/'} replace />} />
        </Routes>
      </DataAnalysisProvider>
    </FilterProvider>
  </UserContext.Provider>
);
};
//lolololololol
export default App;
