'use client';

import { useUser } from '@contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { currentUser } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/login'); // Not logged in
    }
  }, [currentUser, router]);

  if (!currentUser) return null; // Avoid flashing before redirect

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded p-8">
        <h1 className="text-3xl font-bold mb-4">Welcome, {currentUser.name} 👋</h1>
        <p className="text-gray-700 text-lg">Here’s your dashboard. Let’s manage some boards.</p>

        {/* Later: Replace with Board List or Kanban board */}
        <div className="mt-6">
          <p className="italic text-gray-400">Boards coming soon...</p>
        </div>
      </div>
    </main>
  );
}
