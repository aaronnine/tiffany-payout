# USDT B2B 支付网关系统架构文档

## 项目概述

这是一个 USDT B2B 支付网关系统，为下游商户提供代付（Payout）和代收（Pay-in）服务。

### 核心角色
- **平台管理员（Admin）**: 系统管理员，负责审核商户、管理系统
- **下游商户（Clients）**: 使用支付网关服务的商户
- **最终用户（End Users）**: 商户的客户，实际的资金流动对象

### 核心业务流程

#### 代付（Payout）流程
1. 商户通过 API 发起代付请求
2. 系统验证商户 API 凭证和余额
3. 扣除商户在平台的余额
4. 平台向最终用户地址转账 USDT
5. 返回交易结果给商户

#### 代收（Pay-in）流程
1. 最终用户向平台指定地址充值 USDT
2. 平台监控到充值交易
3. 增加对应商户的余额
4. 通过回调 API 通知商户
5. 商户确认收到通知

## 数据库架构设计

### 1. 用户表 (profiles)
扩展 Supabase Auth 的用户系统，添加业务字段。

```sql
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'banned');
CREATE TYPE user_role AS ENUM ('admin', 'merchant');

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    company_name TEXT,
    contact_person TEXT,
    phone TEXT,
    status user_status DEFAULT 'pending',
    role user_role DEFAULT 'merchant',
    two_factor_secret TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES profiles(id)
);
```

### 2. 商户钱包表 (wallets)
管理每个商户的 USDT 余额，实现严格的数据隔离。

```sql
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    balance DECIMAL(20,8) DEFAULT 0.00000000,
    frozen_balance DECIMAL(20,8) DEFAULT 0.00000000,
    total_deposit DECIMAL(20,8) DEFAULT 0.00000000,
    total_payout DECIMAL(20,8) DEFAULT 0.00000000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_balance CHECK (balance >= 0),
    CONSTRAINT positive_frozen_balance CHECK (frozen_balance >= 0),
    UNIQUE(merchant_id)
);
```

### 3. API 凭证表 (api_keys)
为每个商户生成和管理 API 访问凭证。

```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL UNIQUE,
    secret_key_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    permissions TEXT[] DEFAULT ARRAY['payout', 'payin', 'balance'],
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_permissions CHECK (
        permissions <@ ARRAY['payout', 'payin', 'balance', 'webhook']
    )
);
```

### 4. 交易记录表 (transactions)
记录所有的代付和代收交易。

```sql
CREATE TYPE transaction_type AS ENUM ('payout', 'payin', 'adjustment');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES profiles(id),
    type transaction_type NOT NULL,
    status transaction_status DEFAULT 'pending',
    amount DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) DEFAULT 0,
    net_amount DECIMAL(20,8) NOT NULL,
    
    -- 收款信息
    recipient_address TEXT,
    recipient_network TEXT DEFAULT 'TRC20',
    
    -- 商户订单信息
    merchant_order_id TEXT,
    callback_url TEXT,
    
    -- 区块链信息
    tx_hash TEXT,
    block_number BIGINT,
    confirmations INTEGER DEFAULT 0,
    
    -- 元数据
    metadata JSONB,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_network CHECK (recipient_network IN ('TRC20', 'ERC20', 'BEP20'))
);
```

### 5. 钱包操作日志表 (wallet_logs)
记录所有钱包余额变动，确保资金流向可追溯。

```sql
CREATE TYPE wallet_operation AS ENUM ('deposit', 'withdraw', 'freeze', 'unfreeze', 'adjustment');

CREATE TABLE wallet_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    merchant_id UUID NOT NULL REFERENCES profiles(id),
    transaction_id UUID REFERENCES transactions(id),
    operation wallet_operation NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    balance_before DECIMAL(20,8) NOT NULL,
    balance_after DECIMAL(20,8) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. 系统配置表 (system_settings)
存储系统级别的配置参数。

```sql
CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);
```

## 安全与权限设计

### Row Level Security (RLS) 策略

```sql
-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_logs ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的资料
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 管理员可以查看所有用户
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 商户只能查看自己的钱包
CREATE POLICY "Merchants can view own wallet" ON wallets
    FOR SELECT USING (merchant_id = auth.uid());

-- 管理员可以查看所有钱包
CREATE POLICY "Admins can view all wallets" ON wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 类似的策略应用到其他表...
```

### 认证流程设计

#### 注册流程
1. 用户通过 Supabase Auth 注册
2. 触发器自动创建 profiles 记录，status 为 'pending'
3. 自动创建对应的 wallet 记录
4. 用户收到"等待审核"提示

#### 登录验证
1. Supabase Auth 验证用户凭证
2. 检查 profiles.status 字段
3. 只允许 'active' 状态用户登录
4. 'pending' 用户显示"等待管理员审核"
5. 'suspended'/'banned' 用户显示相应错误信息

#### 管理员审核流程
1. 管理员在后台查看待审核用户
2. 审核通过：将 status 更新为 'active'
3. 自动生成初始 API 凭证
4. 发送审核通过通知邮件

## 技术实现要点

### 1. 数据库触发器
```sql
-- 自动创建 profile 和 wallet
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email)
    VALUES (NEW.id, NEW.email);
    
    INSERT INTO wallets (merchant_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 2. API 认证中间件
- 验证 API Key 和 Secret
- 检查权限范围
- 记录 API 使用日志
- 实现速率限制

### 3. 余额操作原子性
- 使用数据库事务确保余额操作原子性
- 实现乐观锁防止并发问题
- 记录详细的操作日志

## 下一步实施计划

### Phase 1: 基础认证系统
1. 创建数据库 Schema
2. 实现用户注册/登录
3. 实现状态检查逻辑
4. 创建管理员审核界面

### Phase 2: API 网关
1. 实现 API 凭证管理
2. 创建 API 认证中间件
3. 实现基础的余额查询 API

### Phase 3: 交易系统
1. 实现代付 API
2. 实现代收监控
3. 添加交易状态管理
4. 实现回调通知系统

这个架构设计确保了：
- 数据安全和隔离
- 可扩展性
- 审计追踪
- 高可用性
- 符合金融级安全要求