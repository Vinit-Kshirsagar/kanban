// app/page.js
'use client';
import { useRouter } from 'next/navigation';

const users = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
  { id: 'u3', name: 'Charlie' },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Select a User</h1>
      <ul className="space-y-2">
        {users.map(user => (
          <li key={user.id}>
            <button
              onClick={() => router.push(`/users/${user.id}`)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {user.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
