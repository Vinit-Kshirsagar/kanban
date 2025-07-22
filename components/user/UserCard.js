'use client';

import { Button } from '@/components/ui/button';

export default function UserCard({ user, onLogin, onDelete }) {
  return (
    <div className="p-4 border rounded-xl bg-white shadow-md w-64 flex flex-col items-center space-y-2">
      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold">
        {user.name.charAt(0)}
      </div>
      <h3 className="text-lg font-semibold">{user.name}</h3>
      <div className="flex gap-2 mt-2">
        <Button onClick={onLogin}>Login</Button>
        <Button variant="destructive" onClick={onDelete}>Delete</Button>
      </div>
    </div>
  );
}
