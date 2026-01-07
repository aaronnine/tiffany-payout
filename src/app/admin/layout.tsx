'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isAdmin } from '@/utils/admin';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activePage, setActivePage] = useState('home');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
        return;
      }
      if (!isAdmin(user)) {
        router.push('/');
        return;
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0ABAB5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin(user)) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

