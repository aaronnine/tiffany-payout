'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isAdmin } from '@/utils/admin';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        router.push('/');
        return;
      }
      if (!isAdmin(user, profile)) {
        router.push('/');
        return;
      }
    }
  }, [user, profile, loading, router]);

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

  if (!user || !profile || !isAdmin(user, profile)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

