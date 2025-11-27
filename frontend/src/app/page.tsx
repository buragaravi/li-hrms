'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = auth.getToken();
    const user = auth.getUser();

    if (token && user) {
      // User is authenticated, redirect to their dashboard
      const dashboardPath = auth.getRoleBasedPath(user.role);
      router.replace(dashboardPath);
    } else {
      // No token, show welcome page
      setChecking(false);
    }
  }, [router]);

  // Show loading while checking authentication
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
          <p className="text-gray-600 font-light">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <main className="flex min-h-screen w-full flex-col items-center justify-center px-6 py-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-4xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-wide text-gray-900">
            Welcome to the{' '}
            <span className="font-normal text-green-600">HRMS</span> Application
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-light mt-4">
            Streamline your human resource management with elegance and efficiency
          </p>

          {/* Navigation to Login */}
          <div className="mt-12">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Navigate to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
