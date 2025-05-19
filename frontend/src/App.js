// App.js
import { add } from 'date-fns';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styles from './App.module.css';
import helpers from './helpers.js';

import Sidebar from './components/Sidebar';
import StockPage from './components/pages/StockPage';
import TasksPage from './components/pages/TasksPage';
import CharCodesPage from './components/pages/CharCodesPage';
import UploadForm from './components/pages/UploadForm';
import UploadDataPage from './components/pages/UploadDataPage';
import DataAnalysisPage from './components/pages/DataAnalysisPage';
import DataAnalysisPageJNR from './components/pages/DataAnalysisPageJNR.js';
import { DataAnalysisProvider } from './components/DataAnalysisContext';
import AlertDashboard from './components/pages/AlertDashboard';

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    name: '',
    type: 'Check',
    dueDate: '',
    priority: 'medium'
  });

  const [stocks, setStocks] = useState([]);
  const [newStock, setNewStock] = useState({
    shorthand: '',
    name: '',
    price: '',
    quantity: ''
  });

  const [activities, setActivities] = useState([]);
  const [repeatAmount, setRepeatAmount] = useState('');
  const [repeatUnit, setRepeatUnit] = useState('days');
  const [selectedStock, setSelectedStock] = useState('');
  const [checkStartDate, setCheckStartDate] = useState('');

  useEffect(() => {
    console.log('Calendar events updated:', activities);
  }, [activities]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStock((prev) => ({ ...prev, [name]: value }));
  };

  const addStock = () => {
    if (!newStock.shorthand || !newStock.name) return;
    setStocks((prev) => [
      ...prev,
      {
        ...newStock,
        price: parseFloat(newStock.price),
        quantity: parseInt(newStock.quantity, 10)
      }
    ]);
    setNewStock({ shorthand: '', name: '', price: '', quantity: '' });
  };

  const removeStock = (shorthand) => {
    setStocks((prev) => prev.filter((s) => s.shorthand !== shorthand));
  };

  const handleAddActivity = (newEvent) => {
    setActivities((prev) => [...prev, newEvent]);
  };

  const handleRemoveActivity = (eventToRemove) => {
    setActivities((prev) =>
      prev.filter(
        (ev) =>
          !(
            ev.title === eventToRemove.title &&
            ev.start === eventToRemove.startStr
          )
      )
    );
  };

  const addTask = () => {
    if (!newTask.name.trim()) return;
    setTasks((t) => [...t, newTask]);
    if (newTask.dueDate) {
      setActivities((a) => [
        ...a,
        { title: newTask.name, start: newTask.dueDate, allDay: true }
      ]);
    }
    setNewTask({ name: '', type: 'Check', dueDate: '', priority: 'medium' });
  };

  const removeTask = (index) => {
    const task = tasks[index];
    setTasks((t) => t.filter((_, i) => i !== index));
    if (task?.dueDate) {
      setActivities((a) =>
        a.filter(
          (ev) => !(ev.title === task.name && ev.start === task.dueDate)
        )
      );
    }
  };

  const charCodes = [
    { code: 'A123', description: 'Alpha Code' },
    { code: 'B456', description: 'Beta Code' }
  ];

  const createStockCheck = () => {
    if (!selectedStock.trim()) return;
    const match = stocks.find(
      (s) =>
        s.shorthand.toLowerCase() === selectedStock.toLowerCase() ||
        s.name.toLowerCase() === selectedStock.toLowerCase()
    );
    if (!match) return alert('Stock not found');

    const start = checkStartDate ? new Date(checkStartDate) : new Date();
    const next = add(start, { [repeatUnit]: parseInt(repeatAmount, 10) });
    const fmt = (d) => d.toISOString().split('T')[0];

    setActivities((a) => [
      ...a,
      { title: `Check ${match.shorthand}`, start: fmt(start), allDay: true },
      { title: `Next check ${match.shorthand}`, start: fmt(next), allDay: true }
    ]);

    setSelectedStock('');
    setRepeatAmount('');
    setRepeatUnit('days');
    setCheckStartDate('');
  };

  return (
    <DataAnalysisProvider>
    <>
      <div className={styles.appContainer}>
        <Sidebar />
        <div className={styles.mainWhiteContainer}>
          <Routes>
            <Route
              path="/"
              element={
                <StockPage
                  stocks={stocks}
                  newStock={newStock}
                  addStock={addStock}
                  removeStock={removeStock}
                  handleInputChange={handleInputChange}
                />
              }
            />
            <Route path="/charcodes" element={<CharCodesPage charCodes={charCodes} />} />
            <Route path="/upload" element={<UploadForm />} />
            <Route path="/view-uploads" element={<UploadDataPage />} />
            <Route path="/data-analysis" element={<DataAnalysisPage />} />
            <Route path="/data-analysis-jnr" element={<DataAnalysisPageJNR />} />
            <Route path="/AlertDashboard" element={<AlertDashboard />} />
            <Route
              path="/tasks"
              element={
                <TasksPage
                  tasks={tasks}
                  setTasks={setTasks}
                  newTask={newTask}
                  setNewTask={setNewTask}
                  addTask={addTask}
                  removeTask={removeTask}
                  activities={activities}
                  handleAddActivity={handleAddActivity}
                  handleRemoveActivity={handleRemoveActivity}
                  stocks={stocks}
                  selectedStock={selectedStock}
                  setSelectedStock={setSelectedStock}
                  repeatAmount={repeatAmount}
                  setRepeatAmount={setRepeatAmount}
                  repeatUnit={repeatUnit}
                  setRepeatUnit={setRepeatUnit}
                  checkStartDate={checkStartDate}
                  setCheckStartDate={setCheckStartDate}
                  createStockCheck={createStockCheck}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </>
    </DataAnalysisProvider>
  );
};

export default App;
