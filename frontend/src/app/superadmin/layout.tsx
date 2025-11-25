import Sidebar from '@/components/Sidebar';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 min-w-0 pl-20 lg:pl-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}

