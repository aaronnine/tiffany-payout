'use client';

import { Search, Monitor, Smartphone, Tablet } from 'lucide-react';

const logs = [
  { user: 'admin@usdt.com', operation: '登入成功', ip: '192.168.1.100', device: 'Desktop', location: '台北,台灣', time: '2024-03-15 14:35:22', status: 'success' },
  { user: 'user@example.com', operation: '查看訂單', ip: '192.168.1.105', device: 'Mobile', location: '高雄,台灣', time: '2024-03-15 14:30:18', status: 'info' },
  { user: 'admin@usdt.com', operation: '更新API設定', ip: '192.168.1.100', device: 'Desktop', location: '台北,台灣', time: '2024-03-15 14:25:45', status: 'info' },
  { user: 'manager@usdt.com', operation: '匯出報表', ip: '192.168.1.102', device: 'Tablet', location: '台中,台灣', time: '2024-03-15 14:20:33', status: 'info' },
  { user: 'user@example.com', operation: '登入失敗', ip: '192.168.1.105', device: 'Mobile', location: '高雄,台灣', time: '2024-03-15 14:15:12', status: 'error' },
  { user: 'admin@usdt.com', operation: '審核提領申請', ip: '192.168.1.100', device: 'Desktop', location: '台北,台灣', time: '2024-03-15 14:10:55', status: 'info' },
];

const getDeviceIcon = (device: string) => {
  switch (device) {
    case 'Desktop':
      return <Monitor size={16} />;
    case 'Mobile':
      return <Smartphone size={16} />;
    case 'Tablet':
      return <Tablet size={16} />;
    default:
      return <Monitor size={16} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'bg-[#0ABAB5]/10 text-[#0ABAB5]';
    case 'error':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export default function LogsPage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">登錄日誌</h1>
          <p className="text-gray-600">系統活動與安全審計記錄</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="搜尋日誌..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]"
          />
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">今日登入次數</p>
          <p className="text-2xl font-bold text-gray-900">156</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">登入成功率</p>
          <p className="text-2xl font-bold text-[#0ABAB5]">98.7%</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">活躍設備</p>
          <p className="text-2xl font-bold text-orange-600">45</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">異常登入</p>
          <p className="text-2xl font-bold text-red-600">2</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">用戶</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">操作</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">IP地址</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">設備</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">位置</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">時間</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{log.user}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                    {log.operation}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">{log.ip}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {getDeviceIcon(log.device)}
                    <span>{log.device}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{log.location}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

