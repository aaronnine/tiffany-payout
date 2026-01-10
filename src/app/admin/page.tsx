'use client';

import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/utils/admin';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, CheckCircle, XCircle, Clock, Building, Mail, Phone, Calendar, ArrowLeft } from 'lucide-react';

interface MerchantProfile {
  id: string;
  email: string;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  status: 'pending' | 'active' | 'suspended' | 'banned';
  role: 'admin' | 'merchant';
  created_at: string;
  wallet?: {
    balance: number;
    total_deposit: number;
    total_payout: number;
  };
}

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [merchants, setMerchants] = useState<MerchantProfile[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [updatingMerchant, setUpdatingMerchant] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || !profile || !isAdmin(user, profile)) {
        router.push('/');
        return;
      }
      fetchMerchants();
    }
  }, [user, profile, loading, router]);

  const fetchMerchants = async () => {
    try {
      setLoadingMerchants(true);
      
      // 获取所有商户资料
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          company_name,
          contact_person,
          phone,
          status,
          role,
          created_at
        `)
        .eq('role', 'merchant')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching merchants:', profilesError);
        return;
      }

      // 获取钱包信息
      const merchantIds = profilesData?.map(p => p.id) || [];
      const { data: walletsData } = await supabase
        .from('wallets')
        .select('merchant_id, balance, total_deposit, total_payout')
        .in('merchant_id', merchantIds);

      // 合并数据
      const merchantsWithWallets = profilesData?.map(merchant => ({
        ...merchant,
        wallet: walletsData?.find(w => w.merchant_id === merchant.id)
      })) || [];

      setMerchants(merchantsWithWallets);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingMerchants(false);
    }
  };

  const updateMerchantStatus = async (merchantId: string, newStatus: 'active' | 'suspended' | 'banned') => {
    try {
      setUpdatingMerchant(merchantId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: newStatus,
          approved_at: newStatus === 'active' ? new Date().toISOString() : null,
          approved_by: newStatus === 'active' ? user?.id : null
        })
        .eq('id', merchantId);

      if (error) {
        console.error('Error updating merchant status:', error);
        alert('更新失败，请稍后再试');
        return;
      }

      // 刷新列表
      await fetchMerchants();
      
      // 显示成功消息
      const merchant = merchants.find(m => m.id === merchantId);
      const statusText = {
        active: '激活',
        suspended: '暂停',
        banned: '禁用'
      }[newStatus];
      
      alert(`商户 ${merchant?.company_name || merchant?.email} 已${statusText}成功！`);
      
    } catch (error) {
      console.error('Error:', error);
      alert('操作失败，请稍后再试');
    } finally {
      setUpdatingMerchant(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'banned':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待审核',
      active: '正常',
      suspended: '已暂停',
      banned: '已禁用',
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBalance = (balance?: number) => {
    if (balance === undefined) return '0.00';
    return balance.toLocaleString('zh-CN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 8 
    });
  };

  if (loading || loadingMerchants) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0ABAB5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">载入管理面板...</p>
        </div>
      </div>
    );
  }

  const pendingMerchants = merchants.filter(m => m.status === 'pending');
  const activeMerchants = merchants.filter(m => m.status === 'active');
  const inactiveMerchants = merchants.filter(m => ['suspended', 'banned'].includes(m.status));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">管理员控制台</h1>
            <p className="text-gray-600">商户管理和系统监控</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
            返回商户面板
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">待审核商户</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingMerchants.length}</p>
              </div>
              <Clock className="text-yellow-500" size={32} />
            </div>
            <p className="text-sm text-gray-500">需要您的审核</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">活跃商户</p>
                <p className="text-2xl font-bold text-green-600">{activeMerchants.length}</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
            <p className="text-sm text-gray-500">正常运营中</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">暂停/禁用</p>
                <p className="text-2xl font-bold text-red-600">{inactiveMerchants.length}</p>
              </div>
              <XCircle className="text-red-500" size={32} />
            </div>
            <p className="text-sm text-gray-500">需要关注</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">总商户数</p>
                <p className="text-2xl font-bold text-[#0ABAB5]">{merchants.length}</p>
              </div>
              <Users className="text-[#0ABAB5]" size={32} />
            </div>
            <p className="text-sm text-gray-500">平台总计</p>
          </div>
        </div>

        {/* 待审核商户列表 */}
        {pendingMerchants.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="text-yellow-500" size={24} />
              待审核商户 ({pendingMerchants.length})
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {pendingMerchants.map((merchant) => (
                  <div key={merchant.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Building className="text-gray-400" size={20} />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {merchant.company_name || '未填写公司名称'}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(merchant.status)}`}>
                            {getStatusText(merchant.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail size={16} />
                            <span>{merchant.email}</span>
                          </div>
                          {merchant.contact_person && (
                            <div className="flex items-center gap-2">
                              <Users size={16} />
                              <span>{merchant.contact_person}</span>
                            </div>
                          )}
                          {merchant.phone && (
                            <div className="flex items-center gap-2">
                              <Phone size={16} />
                              <span>{merchant.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>注册时间: {formatDate(merchant.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => updateMerchantStatus(merchant.id, 'active')}
                          disabled={updatingMerchant === merchant.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle size={16} />
                          {updatingMerchant === merchant.id ? '处理中...' : '批准激活'}
                        </button>
                        <button
                          onClick={() => updateMerchantStatus(merchant.id, 'banned')}
                          disabled={updatingMerchant === merchant.id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle size={16} />
                          拒绝
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 所有商户列表 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">所有商户</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">商户信息</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">钱包余额</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">状态</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">注册时间</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {merchants.map((merchant) => (
                    <tr key={merchant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {merchant.company_name || '未填写公司名称'}
                          </p>
                          <p className="text-sm text-gray-500">{merchant.email}</p>
                          {merchant.contact_person && (
                            <p className="text-sm text-gray-500">{merchant.contact_person}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-[#0ABAB5]">
                            {formatBalance(merchant.wallet?.balance)} USDT
                          </p>
                          <p className="text-gray-500">
                            入金: {formatBalance(merchant.wallet?.total_deposit)}
                          </p>
                          <p className="text-gray-500">
                            出金: {formatBalance(merchant.wallet?.total_payout)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(merchant.status)}`}>
                          {getStatusText(merchant.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(merchant.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {merchant.status === 'pending' && (
                            <button
                              onClick={() => updateMerchantStatus(merchant.id, 'active')}
                              disabled={updatingMerchant === merchant.id}
                              className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                            >
                              激活
                            </button>
                          )}
                          {merchant.status === 'active' && (
                            <button
                              onClick={() => updateMerchantStatus(merchant.id, 'suspended')}
                              disabled={updatingMerchant === merchant.id}
                              className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 disabled:opacity-50"
                            >
                              暂停
                            </button>
                          )}
                          {merchant.status === 'suspended' && (
                            <button
                              onClick={() => updateMerchantStatus(merchant.id, 'active')}
                              disabled={updatingMerchant === merchant.id}
                              className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                            >
                              恢复
                            </button>
                          )}
                          {merchant.status !== 'banned' && (
                            <button
                              onClick={() => updateMerchantStatus(merchant.id, 'banned')}
                              disabled={updatingMerchant === merchant.id}
                              className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50"
                            >
                              禁用
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}