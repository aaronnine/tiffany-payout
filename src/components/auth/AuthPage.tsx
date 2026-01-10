'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LogIn, UserPlus, Mail, Lock, AlertCircle, CheckCircle2, Building, User, Phone } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
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
          // 检查用户状态
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('status, role, company_name')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            setError('無法獲取用戶資料，請稍後再試');
            await supabase.auth.signOut();
            return;
          }

          // 根据状态处理登录结果
          switch (profile.status) {
            case 'pending':
              setError('您的帳號正在等待管理員審核，請耐心等待審核完成後再登錄');
              await supabase.auth.signOut();
              break;
            case 'suspended':
              setError('您的帳號已被暫停，請聯繫管理員');
              await supabase.auth.signOut();
              break;
            case 'banned':
              setError('您的帳號已被禁用，請聯繫管理員');
              await supabase.auth.signOut();
              break;
            case 'active':
              setSuccess(`歡迎回來，${profile.company_name || profile.role === 'admin' ? '管理員' : '商戶'}！`);
              // 登录成功，AuthContext 会处理后续逻辑
              break;
            default:
              setError('帳號狀態異常，請聯繫管理員');
              await supabase.auth.signOut();
          }
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

        if (!companyName.trim()) {
          setError('請填寫公司名稱');
          return;
        }

        if (!contactPerson.trim()) {
          setError('請填寫聯繫人姓名');
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
          // 更新用户资料
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              company_name: companyName.trim(),
              contact_person: contactPerson.trim(),
              phone: phone.trim() || null,
            })
            .eq('id', data.user.id);

          if (profileError) {
            console.error('Profile update error:', profileError);
            // 不阻止注册流程，只记录错误
          }

          setSuccess('註冊成功！您的帳號正在等待管理員審核，審核通過後您將收到郵件通知。');
          
          // 清空表单
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setCompanyName('');
          setContactPerson('');
          setPhone('');
          
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">USDT Gateway</h1>
          <p className="text-gray-600">B2B 支付网关系统</p>
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

          {!isLogin && (
            <>
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  公司名稱 *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent transition-all"
                    placeholder="請輸入公司名稱"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">
                  聯繫人姓名 *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="contactPerson"
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent transition-all"
                    placeholder="請輸入聯繫人姓名"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  聯繫電話
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent transition-all"
                    placeholder="請輸入聯繫電話（可選）"
                  />
                </div>
              </div>
            </>
          )}

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
          <p>© 2024 USDT Gateway System</p>
        </div>
      </div>
    </div>
  );
}

