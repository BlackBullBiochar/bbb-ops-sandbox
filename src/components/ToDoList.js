import React from 'react';
import Button from './Button.js';

const ToDoList = ({ tasks, newTask, setNewTask, addTask, removeTask }) => {
  return (
    <div className="todo-list" style={{ maxWidth: '500px' }}>
    
      {/* Task Input Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          placeholder="Task name"
          value={newTask.name}
          onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
        />

        <select
          value={newTask.type}
          onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
        >
          <option value="Order">Order</option>
          <option value="Replace">Replace</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Check">Check</option>
        </select>

        <input
          type="date"
          value={newTask.dueDate}
          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
        />

        <select
          value={newTask.priority}
          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
        >
          <option value="low">Low (Green)</option>
          <option value="medium">Medium (Orange)</option>
          <option value="high">High (Red)</option>
        </select>

        <Button name="Add Task" onPress={addTask} />
      </div>

      {/* Task Display Section */}
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
        {tasks.map((task, i) => (
          <li key={i} className="todo-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid #ccc',
            padding: '10px 0'
          }}>
            {/* Priority Color Indicator */}
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor:
                  task.priority === 'high' ? 'red' :
                  task.priority === 'medium' ? 'orange' :
                  'green'
              }}
            ></span>

            {/* Task Details */}
            <div>
              <strong>{task.name}</strong> — {task.type} <br />
              <small>Due: {task.dueDate || 'No date set'}</small>
            </div>

            {/* Done Button */}
            <Button
              name="Done"
              onPress={() => removeTask(i)}
              color="Coal"
              customStyle={{ marginLeft: 'auto' }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ToDoList;
