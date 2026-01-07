import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined') {
    // 服务器端：在构建时给出警告，但不抛出错误
    console.warn('Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.');
  }
}

// 创建 Supabase 客户端
// 如果环境变量缺失，使用占位符值（避免构建时错误）
// 在实际运行时，如果环境变量缺失，API 调用会失败，但不会导致整个应用崩溃
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

