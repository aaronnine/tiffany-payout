'use client';

import { Calendar, Download, TrendingUp } from 'lucide-react';

const monthlyData = [
  { month: '1月', income: '$125,000', expenditure: '$45,000', profit: '$80,000', rate: '64.0%' },
  { month: '2月', income: '$145,000', expenditure: '$52,000', profit: '$93,000', rate: '64.1%' },
  { month: '3月', income: '$165,000', expenditure: '$58,000', profit: '$107,000', rate: '64.8%' },
];

export default function ReportsPage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">交易報表</h1>
          <p className="text-gray-600">財務數據分析與統計</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            <Calendar size={20} />
            選擇日期範圍
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#FACC15] text-gray-900 rounded-lg font-medium hover:bg-[#FACC15]/90 transition-colors">
            <Download size={20} />
            匯出報表
          </button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">總收入</p>
              <p className="text-2xl font-bold text-gray-900">$435,000</p>
            </div>
            <TrendingUp className="text-[#0ABAB5]" size={32} />
          </div>
          <p className="text-sm text-[#0ABAB5]">+15.3% 較上月</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">總支出</p>
              <p className="text-2xl font-bold text-gray-900">$155,000</p>
            </div>
            <TrendingUp className="text-[#0ABAB5]" size={32} />
          </div>
          <p className="text-sm text-[#0ABAB5]">+8.2% 較上月</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">淨利潤</p>
              <p className="text-2xl font-bold text-gray-900">$280,000</p>
            </div>
            <TrendingUp className="text-[#0ABAB5]" size={32} />
          </div>
          <p className="text-sm text-[#0ABAB5]">+22.1% 較上月</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">利潤率</p>
              <p className="text-2xl font-bold text-gray-900">64.4%</p>
            </div>
            <TrendingUp className="text-[#0ABAB5]" size={32} />
          </div>
          <p className="text-sm text-[#0ABAB5]">+5.8% 較上月</p>
        </div>
      </div>

      {/* 月度財務分析 */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">月度財務分析</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">月份</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">總收入</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">總支出</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">淨利潤</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">利潤率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthlyData.map((data) => (
                <tr key={data.month} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{data.month}</td>
                  <td className="px-6 py-4 text-sm text-blue-600 font-semibold">{data.income}</td>
                  <td className="px-6 py-4 text-sm text-red-600 font-semibold">{data.expenditure}</td>
                  <td className="px-6 py-4 text-sm text-orange-600 font-semibold">{data.profit}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{data.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 收入趨勢圖 */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">收入趨勢圖</h2>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-400">圖表區域 - 可整合 Chart.js 或 Recharts</p>
        </div>
      </div>
    </div>
  );
}

