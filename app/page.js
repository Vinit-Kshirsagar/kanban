import Column from "./components/Column.js";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Column
          title="To-Do"
          color="bg-red-200"
          buttonColor="bg-red-200"
        />

        <Column
          title="In-Progress"
          color="bg-yellow-100"
          buttonColor="bg-yellow-100"
        />

        <Column
          title="Done"
          color="bg-green-100"
          buttonColor="bg-green-100"
        />
      </div>
    </main>
  );
}

