'use client';

import { useState } from 'react';
import TaskCard from './components/TaskCard';
import TaskInput from './components/TaskInput';

const columns = [
  { id: 'todo', title: 'To-Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

const initialTasks = [
  { id: '1', title: 'Design login UI', columnId: 'todo' },
  { id: '2', title: 'Connect backend API', columnId: 'inprogress' },
  { id: '3', title: 'Deploy to Vercel', columnId: 'done' },
];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeInputColumn, setActiveInputColumn] = useState(null); // controls input form visibility

  const handleAddTask = (columnId, title) => {
    const newTask = {
      id: Date.now().toString(),
      title,
      columnId,
    };
    setTasks(prev => [...prev, newTask]);
    setActiveInputColumn(null);
  };

  return (
    <div className="flex gap-6 p-6 bg-gray-100 min-h-screen">
      {columns.map(col => (
        <div key={col.id} className="w-80 p-4 border rounded bg-white shadow">
          <h2 className="text-lg font-bold mb-4">{col.title}</h2>

          {tasks
            .filter(task => task.columnId === col.id)
            .map(task => (
              <TaskCard key={task.id} task={task} />
            ))}

          {activeInputColumn === col.id ? (
            <TaskInput
              onAdd={(title) => handleAddTask(col.id, title)}
              onCancel={() => setActiveInputColumn(null)}
            />
          ) : (
            <button
              onClick={() => setActiveInputColumn(col.id)}
              className="mt-4 w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm rounded"
            >
              + Add Task
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
