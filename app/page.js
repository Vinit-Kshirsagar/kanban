'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './components/TaskCard';

const columns = [
  { id: 'todo', title: 'To-Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

const initialTasks = [
  { id: '1', title: 'Design login UI', columnId: 'todo' },
  { id: '2', title: 'Connect API', columnId: 'inprogress' },
  { id: '3', title: 'Deploy', columnId: 'done' },
];


export default function KanbanBoard() {
  const [tasks, setTasks] = useState(initialTasks);

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

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6 p-6 bg-gray-100 min-h-screen">
        {columns.map((col) => (
          <div key={col.id} className="w-80 p-4 bg-white border rounded shadow">
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
            <button
  onClick={() => handleAddTask(status)}
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
