'use client';

import { useState } from 'react';

export default function TaskInput({ onAdd, onCancel }) {
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (title.trim() === '') return;
    onAdd(title.trim());
    setTitle('');
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <input
        type="text"
        className="p-2 border rounded text-sm"
        placeholder="Task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex gap-2 justify-end">
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
          onClick={handleSubmit}
        >
          Add
        </button>
        <button
          className="bg-gray-300 text-black px-3 py-1 rounded text-sm"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
