// contexts/UserContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user from localStorage on first load
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('kanban_logged_in_user'));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const login = (user) => {
    setUser(user);
    localStorage.setItem('kanban_logged_in_user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kanban_logged_in_user');
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Optional: Custom hook for convenience
export const useUser = () => useContext(UserContext);
