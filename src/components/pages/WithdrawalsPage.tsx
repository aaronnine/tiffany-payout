'use client';

import { Search, Download } from 'lucide-react';

const withdrawals = [
  { id: 'WD-2024-001', amount: '5,000 USDT', address: '0x742d...c4f8', fee: '5 USDT', time: '2024-03-15 12:30', status: '已完成' },
  { id: 'WD-2024-002', amount: '2,500 USDT', address: '0x8a3c...d9e2', fee: '5 USDT', time: '2024-03-15 11:45', status: '處理中' },
  { id: 'WD-2024-003', amount: '10,000 USDT', address: '0x5f2e...b7a1', fee: '5 USDT', time: '2024-03-15 10:20', status: '已完成' },
  { id: 'WD-2024-004', amount: '3,750 USDT', address: '0x9d4b...e3c6', fee: '5 USDT', time: '2024-03-15 09:15', status: '已完成' },
  { id: 'WD-2024-005', amount: '1,500 USDT', address: '0x6c8a...f2d4', fee: '5 USDT', time: '2024-03-15 08:50', status: '待審核' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case '已完成':
      return 'bg-[#0ABAB5]/10 text-[#0ABAB5]';
    case '處理中':
      return 'bg-[#FACC15]/10 text-[#FACC15]';
    case '待審核':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export default function WithdrawalsPage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">提領記錄</h1>
          <p className="text-gray-600">管理所有 USDT 提領申請</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜尋提領記錄..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#FACC15] text-gray-900 rounded-lg font-medium hover:bg-[#FACC15]/90 transition-colors">
            <Download size={20} />
            匯出報表
          </button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">今日提領總額</p>
          <p className="text-2xl font-bold text-gray-900">22,750 USDT</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">待處理提領</p>
          <p className="text-2xl font-bold text-[#FACC15]">1</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">總手續費</p>
          <p className="text-2xl font-bold text-[#0ABAB5]">25 USDT</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">提領編號</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">金額</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">地址</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">手續費</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">時間</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {withdrawals.map((withdrawal) => (
              <tr key={withdrawal.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{withdrawal.id}</td>
                <td className="px-6 py-4 text-sm text-[#0ABAB5] font-semibold">{withdrawal.amount}</td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">{withdrawal.address}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{withdrawal.fee}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{withdrawal.time}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                    {withdrawal.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

