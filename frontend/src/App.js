// App.js
import React, { useState, useEffect } from 'react';
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

// ← Add API URL here
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔄 On mount, attempt to refresh session
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => {
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      });
  }, []);

  const handleLogin = () => {
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
                <Route path="*" element={<Navigate to="/upload" replace />} />
              </Routes>
            </div>
          </div>
        )}
    </DataAnalysisProvider>
  );
};

export default App;
