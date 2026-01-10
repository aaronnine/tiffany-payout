# Supabase 配置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 选择组织并填写项目信息：
   - Name: `usdt-gateway`
   - Database Password: 生成一个强密码并保存
   - Region: 选择离您最近的区域
4. 等待项目创建完成（约2分钟）

## 2. 执行数据库 Schema

1. 在 Supabase Dashboard 中，进入您的项目
2. 点击左侧菜单的 "SQL Editor"
3. 点击 "New Query"
4. 复制 `supabase-schema.sql` 文件的全部内容
5. 粘贴到 SQL Editor 中
6. 点击 "Run" 执行

**注意**: 如果遇到错误，请按照文件中的注释分段执行。

## 3. 配置环境变量

在项目根目录的 `.env.local` 文件中添加以下配置：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 可选：Service Role Key (仅用于服务端操作)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

获取这些值的方法：
1. 在 Supabase Dashboard 中，点击左侧的 "Settings"
2. 点击 "API"
3. 复制以下值：
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY`

## 4. 验证配置

### 4.1 检查表创建
在 Supabase Dashboard 中：
1. 点击 "Table Editor"
2. 确认以下表已创建：
   - `profiles`
   - `wallets`
   - `api_keys`
   - `transactions`
   - `wallet_logs`
   - `system_settings`

### 4.2 检查 RLS 策略
1. 点击任意表名
2. 点击 "RLS" 标签
3. 确认策略已启用且正确配置

### 4.3 测试认证流程
1. 启动 Next.js 应用：`npm run dev`
2. 访问 `http://localhost:3000`
3. 尝试注册一个新账户
4. 检查 Supabase Dashboard 中的 "Authentication" → "Users"
5. 确认用户已创建且 `profiles` 表中有对应记录

## 5. 创建管理员账户

### 方法一：通过 SQL
在 SQL Editor 中执行：

```sql
-- 1. 首先在 Authentication 中手动创建用户，或通过应用注册
-- 2. 然后更新该用户为管理员
UPDATE profiles 
SET role = 'admin', status = 'active' 
WHERE email = 'your-admin-email@example.com';
```

### 方法二：通过 Dashboard
1. 在 "Authentication" → "Users" 中点击 "Invite User"
2. 输入管理员邮箱
3. 用户注册后，在 "Table Editor" → "profiles" 中：
   - 找到该用户记录
   - 将 `role` 改为 `admin`
   - 将 `status` 改为 `active`

## 6. 测试完整流程

### 6.1 商户注册流程
1. 访问应用并注册新商户账户
2. 确认状态为 `pending`
3. 尝试登录，应该显示"等待管理员审核"

### 6.2 管理员审核流程
1. 使用管理员账户登录
2. 在管理后台找到待审核用户
3. 将用户状态改为 `active`
4. 商户现在应该能够正常登录

### 6.3 数据隔离测试
1. 创建多个商户账户
2. 确认每个商户只能看到自己的数据
3. 管理员可以看到所有数据

## 7. 安全配置

### 7.1 RLS 策略验证
确保以下策略正常工作：
- 商户只能查看自己的钱包和交易
- 管理员可以查看所有数据
- 未认证用户无法访问任何敏感数据

### 7.2 API 密钥管理
- 妥善保管 Service Role Key
- 在生产环境中使用环境变量
- 定期轮换密钥

## 8. 生产环境部署

### 8.1 环境变量配置
在 Vercel 中配置环境变量：
1. 进入 Vercel 项目设置
2. 点击 "Environment Variables"
3. 添加所有必要的环境变量

### 8.2 数据库备份
1. 在 Supabase Dashboard 中设置自动备份
2. 定期导出重要数据
3. 测试恢复流程

## 9. 监控和维护

### 9.1 设置监控
- 启用 Supabase 的监控功能
- 设置关键指标的告警
- 监控 API 使用量和性能

### 9.2 日志管理
- 定期检查错误日志
- 监控异常登录尝试
- 跟踪重要业务操作

## 故障排除

### 常见问题

**问题 1**: 用户注册后没有创建 profile 记录
- 检查触发器是否正确创建
- 查看 Supabase 日志中的错误信息
- 手动执行触发器函数测试

**问题 2**: RLS 策略不生效
- 确认策略已启用
- 检查策略条件是否正确
- 测试不同角色的访问权限

**问题 3**: 环境变量未生效
- 重启开发服务器
- 检查变量名是否正确
- 确认 `.env.local` 文件位置

**问题 4**: 数据库连接失败
- 检查网络连接
- 验证 URL 和密钥是否正确
- 查看 Supabase 项目状态

## 下一步

完成基础配置后，您可以：
1. 实现 API 密钥管理功能
2. 添加交易处理逻辑
3. 集成区块链监控
4. 实现回调通知系统
5. 添加 2FA 功能

如有问题，请查看 Supabase 官方文档或联系技术支持。