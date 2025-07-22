// app/components/TaskCard.jsx
export default function TaskCard({ task }) {
  return (
    <div className="bg-white p-2 mb-2 shadow-sm border rounded text-sm">
      {task.title}
    </div>
  );
}
