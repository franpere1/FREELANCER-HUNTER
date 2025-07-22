import Header from '@/components/Header';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>El contenido del dashboard se está reconstruyendo.</p>
        <p>Si puedes ver este mensaje, el error de compilación se ha resuelto.</p>
      </main>
    </div>
  );
};

export default Dashboard;