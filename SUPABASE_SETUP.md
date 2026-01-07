# Supabase 数据库设置指南

## 步骤 1: 在 Supabase 控制台执行 SQL

1. 登录到您的 Supabase 项目控制台
2. 进入 **SQL Editor**
3. 复制 `supabase-setup.sql` 文件中的内容
4. 粘贴到 SQL Editor 中
5. 点击 **Run** 执行 SQL

这将创建：
- `profiles` 表
- 自动创建 profile 的数据库触发器
- Row Level Security (RLS) 策略

## 步骤 2: 验证设置

执行 SQL 后，您应该能够：
- 在 **Table Editor** 中看到 `profiles` 表
- 当新用户注册时，`profiles` 表中会自动创建对应的记录

## 注意事项

- 如果数据库触发器已设置，客户端代码会优雅地处理重复插入的情况
- 如果触发器未设置，客户端代码会自动创建 profile 记录
- 所有敏感信息都存储在 `.env.local` 文件中，不会提交到代码仓库

