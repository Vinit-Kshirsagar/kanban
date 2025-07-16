import TaskCard from "./TaskCard";

export default function Column({ title, color, tasks = [], buttonColor }) {
  return (
    <div className="bg-white border rounded-xl shadow p-4">
      <h2
    className={`text-md font-semibold text-purple-900 mb-4 rounded-md py-2 px-4 flex items-center gap-2 w-fit ${color}`}
    >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h3.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 5H17a2 2 0 012 2v12a2 2 0 01-2 2z" />
    </svg>
    {title}
    </h2>

      <div className="space-y-4">
        {tasks.map((task, index) => (
          <TaskCard key={index} title={task.title} date={task.date} color={color} />
        ))}
      </div>

     
      <button
        className={`mt-6 w-full rounded-lg text-purple-700 py-2 font-semibold hover:opacity-90 ${buttonColor}`}
      >
        ➕ Add New Task
      </button>
    </div>
  );
}
