// App.js
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styles from './App.module.css';

import Sidebar from './components/Sidebar';
import UploadForm from './components/pages/UploadForm';
import UploadDataPage from './components/pages/UploadDataPage';
import DataAnalysisPage from './components/pages/DataAnalysisPage';
import DataAnalysisPageJNR from './components/pages/DataAnalysisPageJNR';
import AlertDashboard from './components/pages/AlertDashboard';
import LoginScreen from './components/pages/LoginScreen';
import { DataAnalysisProvider } from './components/DataAnalysisContext';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    // later you can add real auth logic here
    setIsAuthenticated(true);
  };

  return (
      <DataAnalysisProvider>
        {!isAuthenticated ? (
          <Routes>
            <Route path="*" element={<LoginScreen onLogin={handleLogin} />} />
          </Routes>
        ) : (
          <div className={styles.appContainer}>
            <Sidebar />
            <div className={styles.mainWhiteContainer}>
              <Routes>
                <Route path="/upload" element={<UploadForm />} />
                <Route path="/view-uploads" element={<UploadDataPage />} />
                <Route path="/data-analysis" element={<DataAnalysisPage />} />
                <Route path="/data-analysis-jnr" element={<DataAnalysisPageJNR />} />
                <Route path="/AlertDashboard" element={<AlertDashboard />} />
                <Route path="*" element={<Navigate to="/upload" />} />
              </Routes>
            </div>
          </div>
        )}
      </DataAnalysisProvider>
  );
};

export default App;
