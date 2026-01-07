'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/utils/admin';
import AddOrderModal from '@/components/orders/AddOrderModal';

interface Order {
  id: string;
  amount: number;
  address: string;
  network?: string;
  user_id: string;
  status: string;
  created_at: string;
  user_email?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case '完成':
    case 'completed':
      return 'bg-[#0ABAB5]/10 text-[#0ABAB5]';
    case '處理中':
    case 'processing':
      return 'bg-[#FACC15]/10 text-[#FACC15]';
    case '待確認':
    case 'pending':
      return 'bg-gray-100 text-gray-600';
    case '已拒絕':
    case 'rejected':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    completed: '完成',
    processing: '處理中',
    pending: '待確認',
    rejected: '已拒絕',
  };
  return statusMap[status] || status;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // 检查是否是管理员
  const admin = isAdmin(user);

  // 获取订单列表
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      // 获取所有用户ID并批量查询用户信息
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((order) => order.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        // 创建用户ID到邮箱的映射
        interface Profile {
          id: string;
          email: string;
        }
        const userEmailMap = new Map(
          (profilesData || []).map((profile: Profile) => [profile.id, profile.email])
        );

        // 处理数据，将 profiles 的 email 提取到订单对象中
        const processedOrders = data.map((order) => ({
          ...order,
          user_email: userEmailMap.get(order.user_id) || '未知用戶',
        })) as Order[];

        setOrders(processedOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // 添加订单
  const handleAddOrder = async (amount: number, recipientAddress: string) => {
    // 确保用户已登录，使用 supabase.auth.getUser() 获取最新用户信息
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !currentUser) {
      console.error('User error:', userError);
      throw new Error('用戶未登錄或會話已過期');
    }

    // 确保 amount 是数字类型
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('無效的金額');
    }

    // 根据地址格式判断网络类型
    const trimmedAddress = recipientAddress.trim();
    const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(trimmedAddress);
    const network = isEthereumAddress ? 'ERC20' : 'TRC20';

    // 准备插入的数据 - 只包含数据库存在的字段
    const orderData = {
      amount: numericAmount,
      address: trimmedAddress, // 使用 address 字段
      network: network,
      status: 'pending',
      user_id: currentUser.id, // 使用从 supabase.auth.getUser() 获取的 UUID
    };

    console.log('Inserting order data:', {
      ...orderData,
      user_id: `${orderData.user_id.substring(0, 8)}...`, // 只显示部分 UUID 用于调试
    });

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select();

    if (error) {
      console.error('Error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // 构建详细的错误信息
      let errorMessage = '提交失敗';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      } else if (error.hint) {
        errorMessage = error.hint;
      }
      
      // 如果有错误代码，添加到错误信息中
      if (error.code) {
        errorMessage = `${errorMessage} (錯誤代碼: ${error.code})`;
      }
      
      throw new Error(errorMessage);
    }

    console.log('Order created successfully:', data);

    // 发送 Telegram 通知
    try {
      const message = `🚀 发现新代付订单！\n\n金额：${numericAmount} USDT\n地址：${trimmedAddress}\n网络：${network}`;
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Telegram notification failed:', errorData);
      }
    } catch (telegramError) {
      // 通知失败不影响订单创建
      console.error('Failed to send Telegram notification:', telegramError);
    }

    // 刷新订单列表
    await fetchOrders();
  };

  // 更新订单状态
  const updateOrderStatus = async (orderId: string, newStatus: 'completed' | 'rejected') => {
    if (!admin) {
      console.error('非管理员无法操作');
      return;
    }

    setUpdatingOrderId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        alert(`更新失敗: ${error.message || '未知錯誤'}`);
        return;
      }

      // 发送 Telegram 通知
      try {
        const order = orders.find((o) => o.id === orderId);
        const statusText = newStatus === 'completed' ? '✅ 确认已付' : '❌ 拒绝订单';
        const message = `${statusText}\n\n订单ID：${orderId.substring(0, 8)}...\n金额：${order?.amount || 'N/A'} USDT\n地址：${order?.address ? `${order.address.slice(0, 10)}...${order.address.slice(-8)}` : 'N/A'}`;
        
        const response = await fetch('/api/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Telegram notification failed:', errorData);
        }
      } catch (telegramError) {
        // 通知失败不影响状态更新
        console.error('Failed to send Telegram notification:', telegramError);
      }

      // 刷新订单列表
      await fetchOrders();
    } catch (err) {
      console.error('Error:', err);
      alert('更新失敗，請稍後再試');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // 过滤订单
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.address.toLowerCase().includes(query) ||
      (order.user_email && order.user_email.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">訂單記錄</h1>
          <p className="text-gray-600">查看和管理所有交易訂單</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜尋訂單..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0ABAB5] text-white rounded-lg font-medium hover:bg-[#0ABAB5]/90 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            新增代付訂單
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="w-12 h-12 border-4 border-[#0ABAB5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">載入中...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600 mb-4">
            {searchQuery ? '沒有找到匹配的訂單' : '暫無訂單記錄'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0ABAB5] text-white rounded-lg font-medium hover:bg-[#0ABAB5]/90 transition-colors"
            >
              <Plus size={20} />
              創建第一個訂單
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">訂單ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">金額</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">收款地址</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">用戶</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">時間</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">狀態</th>
                  {admin && <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">操作</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
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
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    {admin && (
                      <td className="px-6 py-4">
                        {order.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              disabled={updatingOrderId === order.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle2 size={14} />
                              確認已付
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'rejected')}
                              disabled={updatingOrderId === order.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XCircle size={14} />
                              拒絕訂單
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddOrder}
      />
    </div>
  );
}
