'use client';

import { useState } from 'react';
import { X, DollarSign, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, recipientAddress: string) => Promise<void>;
}

export default function AddOrderModal({ isOpen, onClose, onSubmit }: AddOrderModalProps) {
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证
    if (!amount || parseFloat(amount) <= 0) {
      setError('請輸入有效的金額');
      return;
    }

    if (!recipientAddress || recipientAddress.trim().length === 0) {
      setError('請輸入收款地址');
      return;
    }

    // 验证地址格式：支持以太坊地址（0x开头，42字符）或 TRC20 地址（T开头，34字符）
    const trimmedAddress = recipientAddress.trim();
    
    // 以太坊地址：0x 开头，后面 40 个十六进制字符，总共 42 个字符
    const isEthereumAddress = /^0x[a-fA-F0-9]{40}$/.test(trimmedAddress);
    
    // TRC20 地址：T 开头，后面 33 个 Base58 字符（包含大写字母、小写字母和数字1-9，但不包含0、O、I、l），总共 34 个字符
    // Base58 字符集：123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
    const isTRC20Address = /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmedAddress);
    
    if (!isEthereumAddress && !isTRC20Address) {
      setError('請輸入有效的地址格式（以太坊地址：0x開頭42個字符，或 TRC20 地址：T開頭34個字符）');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // 确保 amount 转换为数字
      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setError('請輸入有效的金額');
        setLoading(false);
        return;
      }

      await onSubmit(numericAmount, recipientAddress.trim());
      // 显示成功消息
      setSuccess(true);
      setAmount('');
      setRecipientAddress('');
      
      // 2秒后自动关闭弹窗
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      // 显示详细的错误信息
      let errorMessage = '提交失敗，請稍後再試';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        console.error('Submit error:', err);
        console.error('Error stack:', err.stack);
      } else if (typeof err === 'object' && err !== null) {
        const errorObj = err as { message?: string; details?: string; hint?: string; code?: string };
        // 优先显示详细的错误信息
        if (errorObj.message) {
          errorMessage = errorObj.message;
        } else if (errorObj.details) {
          errorMessage = errorObj.details;
        } else if (errorObj.hint) {
          errorMessage = errorObj.hint;
        } else if (errorObj.code) {
          errorMessage = `錯誤代碼: ${errorObj.code}`;
        }
        console.error('Error details:', err);
        console.error('Error object:', JSON.stringify(err, null, 2));
      } else {
        console.error('Submit error:', err);
        errorMessage = String(err) || errorMessage;
      }
      
      // 在UI上显示具体错误信息
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setRecipientAddress('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in slide-in-from-bottom-4">
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* 头部 */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">新增代付訂單</h2>
          <p className="text-sm text-gray-600 mt-1">填寫訂單信息以創建新的代付訂單</p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={20} />
              <span className="text-sm font-medium">訂單已提交</span>
            </div>
          )}

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              金額 (USDT)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="請輸入金額"
              />
            </div>
          </div>

          <div>
            <label htmlFor="recipientAddress" className="block text-sm font-medium text-gray-700 mb-2">
              收款地址
            </label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="recipientAddress"
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed font-mono text-sm"
                placeholder="0x... 或 T..."
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">請輸入有效的地址（以太坊地址：0x開頭，或 TRC20 地址：T開頭）</p>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[#0ABAB5] text-white rounded-lg font-semibold hover:bg-[#0ABAB5]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>提交中...</span>
                </>
              ) : (
                <span>提交</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

