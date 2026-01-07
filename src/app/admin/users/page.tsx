'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/utils/admin';
import { DollarSign, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  balance?: number;
}

interface Order {
  id: string;
  amount: number;
  address: string;
  status: string;
  created_at: string;
  user_id: string;
  user_email?: string;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [rechargeModal, setRechargeModal] = useState<{ open: boolean; userId: string; userEmail: string }>({
    open: false,
    userId: '',
    userEmail: '',
  });
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // 检查管理员权限
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
        return;
      }
      if (!isAdmin(user)) {
        router.push('/');
        return;
      }
      fetchData();
    }
  }, [user, authLoading, router]);

  // 获取所有用户和待处理订单
  const fetchData = async () => {
    try {
      setLoading(true);

      // 获取所有用户
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, balance')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching users:', profilesError);
      } else {
        setUsers((profilesData || []).map((p) => ({
          id: p.id,
          email: p.email || '未知用戶',
          balance: p.balance || 0,
        })));
      }

      // 获取待处理订单
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else {
        // 获取订单对应的用户邮箱
        if (ordersData && ordersData.length > 0) {
          const userIds = [...new Set(ordersData.map((o) => o.user_id))];
          const { data: userProfiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', userIds);

          const userEmailMap = new Map(
            (userProfiles || []).map((p) => [p.id, p.email])
          );

          setPendingOrders(
            ordersData.map((order) => ({
              ...order,
              user_email: userEmailMap.get(order.user_id) || '未知用戶',
            }))
          );
        } else {
          setPendingOrders([]);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 充值功能
  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      alert('請輸入有效的金額');
      return;
    }

    setRecharging(true);
    try {
      // 获取当前余额
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', rechargeModal.userId)
        .single();

      const currentBalance = currentProfile?.balance || 0;
      const newBalance = currentBalance + parseFloat(rechargeAmount);

      // 更新余额
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', rechargeModal.userId);

      if (error) {
        console.error('Error updating balance:', error);
        alert(`充值失敗: ${error.message || '未知錯誤'}`);
        return;
      }

      // 刷新数据
      await fetchData();
      setRechargeModal({ open: false, userId: '', userEmail: '' });
      setRechargeAmount('');
      alert('充值成功！');
    } catch (err) {
      console.error('Error:', err);
      alert('充值失敗，請稍後再試');
    } finally {
      setRecharging(false);
    }
  };

  // 标记订单为已完成
  const handleCompleteOrder = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order:', error);
        alert(`更新失敗: ${error.message || '未知錯誤'}`);
        return;
      }

      // 发送 Telegram 通知
      try {
        const order = pendingOrders.find((o) => o.id === orderId);
        const message = `✅ 订单已标记为已完成\n\n订单ID：${orderId.substring(0, 8)}...\n金额：${order?.amount || 'N/A'} USDT\n地址：${order?.address ? `${order.address.slice(0, 10)}...${order.address.slice(-8)}` : 'N/A'}`;
        
        await fetch('/api/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });
      } catch (telegramError) {
        console.error('Failed to send Telegram notification:', telegramError);
      }

      // 刷新数据
      await fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert('更新失敗，請稍後再試');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (authLoading || loading) {
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
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">管理员后台</h1>
        <p className="text-gray-600">用户管理和订单审核</p>
      </div>

      {/* 用户管理 */}
      <div className="bg-white rounded-lg shadow-sm mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">用户管理</h2>
          <p className="text-sm text-gray-600 mt-1">查看所有注册用户并进行充值操作</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">邮箱</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">当前余额</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    暫無用戶
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-[#0ABAB5] font-semibold">
                      {user.balance?.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} USDT
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setRechargeModal({ open: true, userId: user.id, userEmail: user.email })}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0ABAB5] text-white rounded-lg text-sm font-medium hover:bg-[#0ABAB5]/90 transition-colors"
                      >
                        <DollarSign size={16} />
                        充值
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 待处理订单 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">待处理订单</h2>
          <p className="text-sm text-gray-600 mt-1">审核并标记代付订单为已完成</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">订单ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">金额</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">收款地址</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">用户</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">时间</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    暫無待處理訂單
                  </td>
                </tr>
              ) : (
                pendingOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 font-mono">
                      {order.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-[#0ABAB5] font-semibold">
                      {order.amount.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {order.address.slice(0, 10)}...{order.address.slice(-8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.user_email || '未知用戶'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleString('zh-TW')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleCompleteOrder(order.id)}
                        disabled={updatingOrderId === order.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 size={16} />
                        {updatingOrderId === order.id ? '處理中...' : '標記為已完成'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 充值模态框 */}
      {rechargeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
            <button
              onClick={() => {
                setRechargeModal({ open: false, userId: '', userEmail: '' });
                setRechargeAmount('');
              }}
              disabled={recharging}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle size={20} className="text-gray-500" />
            </button>

            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">用户充值</h2>
              <p className="text-sm text-gray-600 mt-1">为用户账户充值 USDT</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">用户邮箱</label>
                <input
                  type="text"
                  value={rechargeModal.userEmail}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">充值金额 (USDT)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    disabled={recharging}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="請輸入充值金額"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setRechargeModal({ open: false, userId: '', userEmail: '' });
                    setRechargeAmount('');
                  }}
                  disabled={recharging}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
                <button
                  onClick={handleRecharge}
                  disabled={recharging || !rechargeAmount || parseFloat(rechargeAmount) <= 0}
                  className="flex-1 px-4 py-3 bg-[#0ABAB5] text-white rounded-lg font-semibold hover:bg-[#0ABAB5]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {recharging ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>充值中...</span>
                    </>
                  ) : (
                    <>
                      <DollarSign size={20} />
                      <span>確認充值</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

