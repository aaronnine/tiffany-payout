'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LogIn, UserPlus, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isLogin) {
        // 登录逻辑
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message || '登錄失敗，請檢查您的憑證');
          return;
        }

        if (data.user) {
          setSuccess('登錄成功！正在跳轉...');
        }
      } else {
        // 注册逻辑
        if (password !== confirmPassword) {
          setError('密碼與確認密碼不一致');
          return;
        }

        if (password.length < 6) {
          setError('密碼長度至少需要 6 個字符');
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message || '註冊失敗，請稍後再試');
          return;
        }

        if (data.user) {
          // 尝试创建用户 profile 记录（如果数据库触发器未设置，则手动创建）
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                created_at: new Date().toISOString(),
              },
            ])
            .select();

          // 如果 profile 已存在（可能是触发器创建的），忽略错误
          if (profileError) {
            // 检查是否是重复键错误（profile 已存在）
            if (profileError.code === '23505' || profileError.message.includes('duplicate')) {
              // Profile 已存在，这是正常的（可能是触发器创建的）
              console.log('Profile already exists (likely created by trigger)');
            } else {
              console.error('Profile creation error:', profileError);
              // 其他错误仍然记录，但不阻止用户继续
            }
          }

          setSuccess('註冊成功！請檢查您的電子郵件以驗證帳號。');
          // 清空表单
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          // 3秒后切换到登录页面
          setTimeout(() => {
            setIsLogin(true);
            setSuccess(null);
          }, 3000);
        }
      }
    } catch (err) {
      setError('發生錯誤，請稍後再試');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0ABAB5] via-[#0ABAB5]/90 to-[#0ABAB5]/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">USDT Pay</h1>
          <p className="text-gray-600">支付管理系統</p>
        </div>

        {/* 切换标签 */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              isLogin
                ? 'bg-[#0ABAB5] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <LogIn size={18} />
              <span>登錄</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              !isLogin
                ? 'bg-[#0ABAB5] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserPlus size={18} />
              <span>註冊</span>
            </div>
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={20} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              電子郵件
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent transition-all"
                placeholder="請輸入您的電子郵件"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密碼
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent transition-all"
                placeholder={isLogin ? '請輸入您的密碼' : '請輸入密碼（至少 6 個字符）'}
                minLength={isLogin ? undefined : 6}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                確認密碼
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent transition-all"
                  placeholder="請再次輸入密碼"
                  minLength={6}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0ABAB5] text-white py-3 rounded-lg font-semibold hover:bg-[#0ABAB5]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isLogin ? '登錄中...' : '註冊中...'}</span>
              </>
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                <span>{isLogin ? '登錄' : '註冊'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>© 2024 USDT Payment System</p>
        </div>
      </div>
    </div>
  );
}

