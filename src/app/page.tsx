'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import AuthPage from '@/components/auth/AuthPage';
import Sidebar from '@/components/Sidebar';
import HomePage from '@/components/pages/HomePage';
import OrdersPage from '@/components/pages/OrdersPage';
import WithdrawalsPage from '@/components/pages/WithdrawalsPage';
import ReportsPage from '@/components/pages/ReportsPage';
import LogsPage from '@/components/pages/LogsPage';
import ApiPage from '@/components/pages/ApiPage';

export default function Page() {
  const { user, profile, loading } = useAuth();
  const [activePage, setActivePage] = useState('home');

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

  // 如果没有用户或用户状态不是 active，显示认证页面
  if (!user || !profile || profile.status !== 'active') {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'orders':
        return <OrdersPage />;
      case 'withdrawals':
        return <WithdrawalsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'logs':
        return <LogsPage />;
      case 'api':
        return <ApiPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <div className="flex-1 overflow-auto">
        {renderPage()}
      </div>
    </div>
  );
}
