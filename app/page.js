'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('kanban_logged_in_user'));
    router.push(user ? '/dashboard' : '/login');
  }, []);

  return null; // or a spinner
}
