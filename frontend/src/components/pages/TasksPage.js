import React from 'react';
import ToDoList from '../ToDoList';
import CalendarView from '../CalendarView';

const TasksPage = ({
  tasks,
  newTask,
  setNewTask,
  addTask,
  removeTask,
  activities,
  handleAddActivity,
  handleRemoveActivity,
  stocks,
  selectedStock,
  setSelectedStock,
  repeatAmount,
  setRepeatAmount,
  repeatUnit,
  setRepeatUnit,
  checkStartDate,
  setCheckStartDate,
  createStockCheck
}) => {
  return (
    <div>
      <h1>Tasks & Stock Checks</h1>

      {/* ---------- TO-DO LIST ---------- */}
      <ToDoList
        tasks={tasks}
        newTask={newTask}
        setNewTask={setNewTask}
        addTask={addTask}
        removeTask={removeTask}
      />

      {/* ---------- STOCK CHECKS FORM ---------- */}
      <h2>Create Stock Check</h2>
      <div style={{ marginTop: '10px', maxWidth: '500px' }}>
        <input
          type="text"
          list="stock-options"
          placeholder="Search stock..."
          value={selectedStock}
          onChange={(e) => setSelectedStock(e.target.value)}
        />
        <datalist id="stock-options">
          {stocks.map((stock, i) => (
            <option key={i} value={stock.shorthand}>
              {stock.name}
            </option>
          ))}
        </datalist>

        <div style={{ marginTop: '10px' }}>
          <label>Start Date: </label>
          <input
            type="date"
            value={checkStartDate}
            onChange={(e) => setCheckStartDate(e.target.value)}
          />
        </div>

        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label>Repeat every</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 2"
            value={repeatAmount}
            onChange={(e) => setRepeatAmount(e.target.value)}
            style={{ width: '80px' }}
          />
          <select
            value={repeatUnit}
            onChange={(e) => setRepeatUnit(e.target.value)}
          >
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
            <option value="years">Years</option>
          </select>
        </div>

        <button onClick={createStockCheck} style={{ marginTop: '10px' }}>
          Add Stock Check
        </button>
      </div>

      {/* ---------- CALENDAR ---------- */}
      <h2 style={{ marginTop: '30px' }}>Calendar</h2>
      <CalendarView
        events={activities}
        onAddEvent={handleAddActivity}
        onRemoveEvent={handleRemoveActivity}
      />
    </div>
  );
};

export default TasksPage;
