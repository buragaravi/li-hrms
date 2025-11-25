'use client';

import { useEffect, useState } from 'react';

export default function SuperAdminDashboard() {
  const [greeting, setGreeting] = useState('Welcome to the HRMS');
  
  useEffect(() => {
    const greetings = [
      'Welcome to the HRMS',
      'Come on Captain',
    ];
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
          {greeting}
        </h1>
        <p className="text-xl text-gray-600 font-light">
          Manage your human resources with ease and efficiency
        </p>
      </div>
    </div>
  );
}

