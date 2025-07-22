'use client';

import { useEffect, useState } from 'react';
import AddUserModal from './AddUserModal';
import { useUser } from '@contexts/UserContext';
import { useRouter } from 'next/navigation';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const { login } = useUser();
  const router = useRouter();

  // Load users from localStorage on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('kanban_users')) || [];
    setUsers(stored);
  }, []);

  const saveUsers = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem('kanban_users', JSON.stringify(updatedUsers));
  };

  const handleAddUser = (newUser) => {
    const updated = [...users, newUser];
    saveUsers(updated);
  };

  const handleDeleteUser = (id) => {
    const updated = users.filter(user => user.id !== id);
    saveUsers(updated);
  };

  const handleLogin = (user) => {
    login(user);                // update context
    router.push('/dashboard');  // navigate to dashboard or boards
  };

  return (
    <div className="p-4 max-w-2xl mx-auto border rounded bg-white shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Select a User</h2>
      
      <AddUserModal onAdd={handleAddUser} />

      <ul className="space-y-2 mt-4">
        {users.length === 0 && (
          <li className="text-gray-500 text-center">No users available. Add one to begin.</li>
        )}

        {users.map(user => (
          <li key={user.id} className="flex justify-between items-center border p-3 rounded-md shadow-sm hover:bg-gray-50">
            <span className="font-medium text-lg">{user.name}</span>

            <div className="flex gap-2">
              <button
                onClick={() => handleLogin(user)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
              >
                Login
              </button>
              <button
                onClick={() => handleDeleteUser(user.id)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
