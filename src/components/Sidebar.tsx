'use client';

import { Home, FileText, Download, BarChart3, Clock, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin, getUserDisplayName } from '@/utils/admin';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { id: 'home', label: '主頁', icon: Home },
  { id: 'orders', label: '訂單記錄', icon: FileText },
  { id: 'withdrawals', label: '提領記錄', icon: Download },
  { id: 'reports', label: '交易報表', icon: BarChart3 },
  { id: 'logs', label: '登錄日誌', icon: Clock },
  { id: 'api', label: 'API 管理', icon: Settings },
];

export default function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const { signOut, user, profile } = useAuth();
  const router = useRouter();
  const admin = isAdmin(user, profile);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleAdminClick = () => {
    router.push('/admin/users');
  };

  return (
    <div className="w-64 bg-[#0ABAB5] min-h-screen flex flex-col text-white">
      <div className="p-6 border-b border-[#0ABAB5]/20">
        <h1 className="text-2xl font-bold mb-1">USDT Gateway</h1>
        <p className="text-sm text-white/80">B2B 支付网关</p>
        {profile && (
          <div className="mt-3 p-2 bg-white/10 rounded-lg">
            <p className="text-xs text-white/60 mb-1">当前用户</p>
            <p className="text-sm font-medium truncate">{getUserDisplayName(profile)}</p>
            <p className="text-xs text-white/70 truncate">{profile.email}</p>
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-[#FACC15] text-gray-900'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-white/10">
        {admin && (
          <button
            onClick={handleAdminClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-colors mb-2"
          >
            <Shield size={20} />
            <span className="font-medium">⚙️ 管理员后台</span>
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">登出</span>
        </button>
        <div className="mt-4 text-xs text-white/60">
          <p>© 2024 USDT Gateway System</p>
        </div>
      </div>
    </div>
  );
}

