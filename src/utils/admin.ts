import { User } from '@supabase/supabase-js';

// 管理员邮箱列表
const ADMIN_EMAILS = ['aaronchan6322@gmail.com'];

/**
 * 检查用户是否是管理员
 * @param user 当前登录用户
 * @returns 是否是管理员
 */
export function isAdmin(user: User | null): boolean {
  if (!user || !user.email) {
    return false;
  }
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

