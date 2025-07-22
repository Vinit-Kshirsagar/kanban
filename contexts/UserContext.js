'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// Create context
const UserContext = createContext();

// Create provider
export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  // Restore user from localStorage on page reload
  useEffect(() => {
    const stored = localStorage.getItem('kanban_logged_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setCurrentUser(user);
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('kanban_logged_user');
      }
    }
  }, []);

  // Login handler
  const login = (user) => {
    setCurrentUser(user);
    localStorage.setItem('kanban_logged_user', JSON.stringify(user));
  };

  // Logout handler
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('kanban_logged_user');
  };

  return (
    <UserContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook
export const useUser = () => useContext(UserContext);
