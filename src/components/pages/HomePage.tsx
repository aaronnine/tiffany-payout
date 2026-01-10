'use client';

import { Wallet, TrendingUp, Key, Eye, EyeOff, Copy, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface WalletData {
  id: string;
  balance: number;
  frozen_balance: number;
  total_deposit: number;
  total_payout: number;
}

interface ApiKey {
  id: string;
  api_key: string;
  name: string;
  is_active: boolean;
  permissions: string[];
  created_at: string;
  last_used_at?: string;
}

export default function HomePage() {
  const { user, profile } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');

  useEffect(() => {
    if (user && profile?.status === 'active') {
      fetchWalletData();
      fetchApiKeys();
    }
  }, [user, profile]);

  const fetchWalletData = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('merchant_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching wallet:', error);
        return;
      }

      setWallet(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('merchant_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API keys:', error);
        return;
      }

      setApiKeys(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    return 'ak_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const generateSecretKey = () => {
    return 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const createApiKey = async () => {
    if (!newApiKeyName.trim()) {
      alert('请输入 API 密钥名称');
      return;
    }

    try {
      setIsCreatingApiKey(true);
      
      const apiKey = generateApiKey();
      const secretKey = generateSecretKey();
      
      // 这里应该对 secret key 进行哈希处理，但为了演示简化处理
      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          merchant_id: user?.id,
          api_key: apiKey,
          secret_key_hash: secretKey, // 实际应用中应该存储哈希值
          name: newApiKeyName.trim(),
          permissions: ['payout', 'payin', 'balance']
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating API key:', error);
        alert('创建失败，请稍后再试');
        return;
      }

      // 显示完整的密钥信息（只显示一次）
      alert(`API 密钥创建成功！\n\nAPI Key: ${apiKey}\nSecret Key: ${secretKey}\n\n请妥善保存，Secret Key 只显示一次！`);
      
      setNewApiKeyName('');
      await fetchApiKeys();
    } catch (error) {
      console.error('Error:', error);
      alert('创建失败，请稍后再试');
    } finally {
      setIsCreatingApiKey(false);
    }
  };

  const toggleApiKeyStatus = async (keyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', keyId);

      if (error) {
        console.error('Error updating API key status:', error);
        alert('操作失败，请稍后再试');
        return;
      }

      await fetchApiKeys();
    } catch (error) {
      console.error('Error:', error);
      alert('操作失败，请稍后再试');
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('确定要删除这个 API 密钥吗？此操作不可撤销。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) {
        console.error('Error deleting API key:', error);
        alert('删除失败，请稍后再试');
        return;
      }

      await fetchApiKeys();
    } catch (error) {
      console.error('Error:', error);
      alert('删除失败，请稍后再试');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板');
    });
  };

  const formatBalance = (balance: number) => {
    return balance.toLocaleString('zh-CN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 8 
    });
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

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0ABAB5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">载入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">商户控制台</h1>
        <p className="text-gray-600">欢迎使用 USDT B2B 支付网关</p>
        {profile && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">当前商户</p>
            <p className="text-lg font-semibold text-gray-900">{profile.company_name || '未设置公司名称'}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        )}
      </div>

      {/* 钱包余额卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">可用余额</p>
              <p className="text-2xl font-bold text-[#0ABAB5]">
                {wallet ? formatBalance(wallet.balance) : '0.00'} USDT
              </p>
            </div>
            <Wallet className="text-[#0ABAB5]" size={32} />
          </div>
          <p className="text-sm text-gray-500">当前可用于交易的余额</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">冻结余额</p>
              <p className="text-2xl font-bold text-orange-600">
                {wallet ? formatBalance(wallet.frozen_balance) : '0.00'} USDT
              </p>
            </div>
            <TrendingUp className="text-orange-500" size={32} />
          </div>
          <p className="text-sm text-gray-500">处理中的交易金额</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">累计入金</p>
              <p className="text-2xl font-bold text-green-600">
                {wallet ? formatBalance(wallet.total_deposit) : '0.00'} USDT
              </p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
          <p className="text-sm text-gray-500">历史充值总额</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">累计出金</p>
              <p className="text-2xl font-bold text-red-600">
                {wallet ? formatBalance(wallet.total_payout) : '0.00'} USDT
              </p>
            </div>
            <TrendingUp className="text-red-500" size={32} />
          </div>
          <p className="text-sm text-gray-500">历史提现总额</p>
        </div>
      </div>

      {/* API 密钥管理 */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Key className="text-[#0ABAB5]" size={24} />
            <h2 className="text-xl font-bold text-gray-900">API 密钥管理</h2>
          </div>
          <button
            onClick={() => setIsCreatingApiKey(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0ABAB5] text-white rounded-lg font-medium hover:bg-[#0ABAB5]/90 transition-colors"
          >
            <Plus size={20} />
            创建新密钥
          </button>
        </div>

        {/* 创建 API 密钥表单 */}
        {isCreatingApiKey && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">创建新的 API 密钥</h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                placeholder="输入密钥名称（如：生产环境、测试环境）"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]"
              />
              <button
                onClick={createApiKey}
                disabled={!newApiKeyName.trim()}
                className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建
              </button>
              <button
                onClick={() => {
                  setIsCreatingApiKey(false);
                  setNewApiKeyName('');
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* API 密钥列表 */}
        {apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <Key className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 mb-4">您还没有创建任何 API 密钥</p>
            <button
              onClick={() => setIsCreatingApiKey(true)}
              className="px-6 py-2 bg-[#0ABAB5] text-white rounded-lg font-medium hover:bg-[#0ABAB5]/90 transition-colors"
            >
              创建第一个密钥
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{apiKey.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        apiKey.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {apiKey.is_active ? '启用' : '禁用'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">API Key:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                          {showApiKey === apiKey.id ? apiKey.api_key : '••••••••••••••••'}
                        </code>
                        <button
                          onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {showApiKey === apiKey.id ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(apiKey.api_key)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">权限:</span>
                        <div className="flex gap-1">
                          {apiKey.permissions.map((perm) => (
                            <span key={perm} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-gray-500">
                        <span>创建时间: {formatDate(apiKey.created_at)}</span>
                        {apiKey.last_used_at && (
                          <span>最后使用: {formatDate(apiKey.last_used_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleApiKeyStatus(apiKey.id, apiKey.is_active)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        apiKey.is_active
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {apiKey.is_active ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => deleteApiKey(apiKey.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

