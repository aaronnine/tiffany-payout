'use client';

import { Plus, Eye, Copy, Trash2, Settings } from 'lucide-react';

const apiKeys = [
  {
    name: '生產環境 API',
    status: '啟用中',
    key: '••••••••••••',
    created: '2024-01-15',
    lastUsed: '2024-03-15 14:30',
    permissions: ['read', 'write'],
    enabled: true,
  },
  {
    name: '測試環境 API',
    status: '啟用中',
    key: '••••••••••••',
    created: '2024-02-10',
    lastUsed: '2024-03-14 16:45',
    permissions: ['read'],
    enabled: true,
  },
  {
    name: '開發環境 API',
    status: '未啟用',
    key: '••••••••••••',
    created: '2024-03-01',
    lastUsed: '從未使用',
    permissions: ['read', 'write'],
    enabled: false,
  },
];

export default function ApiPage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API管理</h1>
          <p className="text-gray-600">管理和監控API金鑰與權限</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#FACC15] text-gray-900 rounded-lg font-medium hover:bg-[#FACC15]/90 transition-colors">
          <Plus size={20} />
          建立新API金鑰
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">總API金鑰</p>
          <p className="text-2xl font-bold text-gray-900">3</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">活躍金鑰</p>
          <p className="text-2xl font-bold text-[#0ABAB5]">2</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">今日API調用</p>
          <p className="text-2xl font-bold text-orange-600">12,458</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">成功率</p>
          <p className="text-2xl font-bold text-[#0ABAB5]">99.2%</p>
        </div>
      </div>

      {/* API 金鑰列表 */}
      <div className="space-y-4">
        {apiKeys.map((api, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{api.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      api.enabled
                        ? 'bg-[#0ABAB5]/10 text-[#0ABAB5]'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {api.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <Settings size={20} className="text-gray-400" />
                  <span className="text-sm font-mono text-gray-900">{api.key}</span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Eye size={16} className="text-gray-400" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Copy size={16} className="text-gray-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">建立日期</p>
                    <p className="text-gray-900 font-medium">{api.created}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">最後使用</p>
                    <p className="text-gray-900 font-medium">{api.lastUsed}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">權限</p>
                    <div className="flex gap-2 flex-wrap">
                      {api.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <button className="p-2 hover:bg-red-50 rounded text-red-500">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* API 文件 */}
      <div className="mt-6 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API 文件</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-gray-600 mb-1">端點 URL</p>
            <p className="text-[#0ABAB5] font-mono">https://api.usdt-pay.com/v1</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">認證方式</p>
            <p className="text-gray-900 font-mono">Authorization: Bearer YOUR_API_KEY</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">速率限制</p>
            <p className="text-gray-900">每分鐘最多 1000 次請求</p>
          </div>
        </div>
      </div>
    </div>
  );
}

