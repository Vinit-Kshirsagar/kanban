'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './components/TaskCard';

const columns = [
  { id: 'todo', title: 'To-Do', color: 'bg-red-100' },
  { id: 'inprogress', title: 'In Progress', color: 'bg-orange-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' },
];

const initialTasks = [
  { id: '1', title: 'Design login UI', columnId: 'todo' },
  { id: '2', title: 'Connect API', columnId: 'inprogress' },
  { id: '3', title: 'Deploy', columnId: 'done' },
];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTaskInputs, setNewTaskInputs] = useState({});
  const [showInputs, setShowInputs] = useState({});

  // Drag and Drop Logic
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === draggableId
          ? { ...task, columnId: destination.droppableId }
          : task
      )
    );
  };

  // Add Task Button Click
  const toggleInput = (columnId) => {
    setShowInputs((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  // Add Task Submit
  const handleAddTask = (columnId) => {
    const inputText = newTaskInputs[columnId]?.trim();
    if (!inputText) return;

    const newTask = {
      id: Date.now().toString(),
      title: inputText,
      columnId,
    };

    setTasks((prev) => [...prev, newTask]);

    setNewTaskInputs((prev) => ({ ...prev, [columnId]: '' }));
    setShowInputs((prev) => ({ ...prev, [columnId]: false }));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 p-6 bg-gray-100 min-h-screen">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`w-80 p-4 border rounded shadow ${col.color}`}
          >
            <h2 className="text-lg font-bold mb-4">{col.title}</h2>

            <Droppable droppableId={col.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-h-[100px] flex flex-col gap-2"
                >
                  {tasks
                    .filter((task) => task.columnId === col.id)
                    .map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Input Field for Adding Tasks */}
            {showInputs[col.id] && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Enter task..."
                  value={newTaskInputs[col.id] || ''}
                  onChange={(e) =>
                    setNewTaskInputs((prev) => ({
                      ...prev,
                      [col.id]: e.target.value,
                    }))
                  }
                  className="w-full p-1 border rounded text-sm mb-1"
                />
                <button
                  onClick={() => handleAddTask(col.id)}
                  className="w-full bg-blue-500 text-white text-sm py-1 rounded hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
            )}

            <button
              onClick={() => toggleInput(col.id)}
              className="mt-2 w-full bg-white border border-gray-400 rounded p-1 text-sm hover:bg-gray-100"
            >
              + Add Task
            </button>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
