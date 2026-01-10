import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  status: 'pending' | 'active' | 'suspended' | 'banned';
  role: 'admin' | 'merchant';
  two_factor_enabled: boolean;
  created_at: string;
}

// 管理员邮箱列表（备用方案）
const ADMIN_EMAILS = ['aaronchan6322@gmail.com', 'admin@usdt-gateway.com'];

/**
 * 检查用户是否是管理员（新版本，基于 profile）
 * @param user 当前登录用户
 * @param profile 用户资料
 * @returns 是否是管理员
 */
export function isAdmin(user: User | null, profile?: Profile | null): boolean {
  if (!user) return false;
  
  // 优先使用 profile 中的 role 字段
  if (profile) {
    return profile.role === 'admin' && profile.status === 'active';
  }
  
  // 备用方案：检查邮箱列表
  if (user.email) {
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  }
  
  return false;
}

/**
 * 检查用户是否可以访问管理面板
 */
export function canAccessAdminPanel(user: User | null, profile?: Profile | null): boolean {
  return isAdmin(user, profile);
}

/**
 * 获取用户显示名称
 */
export function getUserDisplayName(profile: Profile | null): string {
  if (!profile) return '未知用户';
  
  if (profile.role === 'admin') {
    return '系统管理员';
  }
  
  return profile.company_name || profile.contact_person || profile.email;
}

/**
 * 获取状态文本
 */
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    active: '正常',
    suspended: '已暂停',
    banned: '已禁用',
  };
  return statusMap[status] || status;
}

/**
 * 获取状态颜色样式
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-orange-100 text-orange-800',
    banned: 'bg-red-100 text-red-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

