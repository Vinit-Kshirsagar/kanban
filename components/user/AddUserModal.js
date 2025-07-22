'use client';
import { useState } from 'react';

export default function AddUserModal({ onAdd }) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    const newUser = { id: Date.now(), name: name.trim() };
    onAdd(newUser);
    setName('');
  };

  return (
    <div className="mb-4">
      <input
        className="border p-2 rounded mr-2"
        placeholder="Enter user name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleSubmit}>
        Add User
      </button>
    </div>
  );
}
