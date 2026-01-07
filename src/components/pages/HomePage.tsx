'use client';

import { Wallet, TrendingUp, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">主頁</h1>
        <p className="text-gray-600">歡迎使用 USDT 支付管理系統</p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">今日交易額</p>
              <p className="text-2xl font-bold text-gray-900">$125,430</p>
            </div>
            <Wallet className="text-[#0ABAB5]" size={32} />
          </div>
          <p className="text-sm text-[#0ABAB5]">+12.5% 較昨日</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">待處理訂單</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
            <TrendingUp className="text-[#0ABAB5]" size={32} />
          </div>
          <p className="text-sm text-[#0ABAB5]">+3 新訂單</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">成功率</p>
              <p className="text-2xl font-bold text-gray-900">98.5%</p>
            </div>
            <TrendingUp className="text-[#0ABAB5]" size={32} />
          </div>
          <p className="text-sm text-[#0ABAB5]">+2.1% 本週</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">活躍用戶</p>
              <p className="text-2xl font-bold text-gray-900">1,284</p>
            </div>
            <Users className="text-[#0ABAB5]" size={32} />
          </div>
          <p className="text-sm text-[#0ABAB5]">+156 本月</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近交易 */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近交易</h2>
          <div className="space-y-4">
            {[
              { id: 'TX001', time: '2分鐘前', amount: '$1,250', status: '成功' },
              { id: 'TX002', time: '5分鐘前', amount: '$3,500', status: '處理中' },
              { id: 'TX003', time: '12分鐘前', amount: '$850', status: '成功' },
              { id: 'TX004', time: '18分鐘前', amount: '$2,100', status: '成功' },
            ].map((tx) => (
              <div key={tx.id} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-semibold text-gray-900">{tx.id}</p>
                  <p className="text-sm text-gray-500">{tx.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{tx.amount}</p>
                  <p className={`text-sm ${tx.status === '成功' ? 'text-[#0ABAB5]' : 'text-gray-500'}`}>
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 系統狀態 */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">系統狀態</h2>
          <div className="space-y-4">
            {[
              { name: 'API 服務', status: '正常', color: 'bg-[#0ABAB5]' },
              { name: '支付網關', status: '正常', color: 'bg-[#FACC15]' },
              { name: '數據同步', status: '正常', color: 'bg-[#0ABAB5]' },
            ].map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className={`text-xs px-3 py-1 rounded-full text-white ${item.color}`}>
                    {item.status}
                  </span>
                </div>
                <div className={`h-2 rounded-full ${item.color} w-full`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

