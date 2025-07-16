export default function TaskCard({ title, date, color }) {
  return (
    <div className={`${color}`}>
      <p>{title}</p>
      <span>🕒{date}</span>
    </div>
  );
}
