'use client';

import React, { useState } from 'react';
import { useUser } from '@contexts/UserContext';
import { useRouter } from 'next/navigation';
import StyledWrapper from '../../components/ui/StyledWrapper';



export default function LoginPage() {
  const { loginUser } = useUser();
  const router = useRouter();
  const [username, setUsername] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem('kanban_users')) || [];
    const found = users.find(u => u.name === username);

    if (found) {
      loginUser(found);
      router.push('/');
    } else {
      alert('User not found. Please add a user first.');
    }
  };

  return (
    <StyledWrapper>
      <div className="form-container">
        <p className="title">Login</p>
        <form className="form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <button className="sign" type="submit">Sign in</button>
        </form>
      </div>
    </StyledWrapper>
  );
}