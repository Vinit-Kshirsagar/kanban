'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@contexts/UserContext';
import UserList from '@user/UserList';

export default function LoginPage() {
  const { login } = useUser();
  const router = useRouter();

  const handleLogin = (user) => {
    login(user);
    router.push('/dashboard'); // or '/boards'
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-3xl font-bold text-center mb-10">Select a User to Login</h1>
      <UserList onLogin={handleLogin} />
    </main>
  );
}
