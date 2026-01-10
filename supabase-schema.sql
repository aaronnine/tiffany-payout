-- USDT B2B 支付网关系统 - Supabase 数据库 Schema
-- 执行顺序：按照此文件的顺序在 Supabase SQL Editor 中执行

-- ============================================================================
-- 1. 创建枚举类型
-- ============================================================================

CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'banned');
CREATE TYPE user_role AS ENUM ('admin', 'merchant');
CREATE TYPE transaction_type AS ENUM ('payout', 'payin', 'adjustment');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE wallet_operation AS ENUM ('deposit', 'withdraw', 'freeze', 'unfreeze', 'adjustment');

-- ============================================================================
-- 2. 用户资料表 (profiles)
-- ============================================================================

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
    approved_by UUID REFERENCES profiles(id),
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 创建索引
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- 3. 商户钱包表 (wallets)
-- ============================================================================

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
    CONSTRAINT positive_total_deposit CHECK (total_deposit >= 0),
    CONSTRAINT positive_total_payout CHECK (total_payout >= 0),
    UNIQUE(merchant_id)
);

-- 创建索引
CREATE INDEX idx_wallets_merchant_id ON wallets(merchant_id);

-- ============================================================================
-- 4. API 凭证表 (api_keys)
-- ============================================================================

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
    ),
    CONSTRAINT non_empty_name CHECK (LENGTH(TRIM(name)) > 0)
);

-- 创建索引
CREATE INDEX idx_api_keys_merchant_id ON api_keys(merchant_id);
CREATE INDEX idx_api_keys_api_key ON api_keys(api_key);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- ============================================================================
-- 5. 交易记录表 (transactions)
-- ============================================================================

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
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT non_negative_fee CHECK (fee >= 0),
    CONSTRAINT valid_network CHECK (recipient_network IN ('TRC20', 'ERC20', 'BEP20')),
    CONSTRAINT valid_confirmations CHECK (confirmations >= 0)
);

-- 创建索引
CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_merchant_order_id ON transactions(merchant_order_id);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);

-- ============================================================================
-- 6. 钱包操作日志表 (wallet_logs)
-- ============================================================================

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT non_zero_amount CHECK (amount != 0),
    CONSTRAINT non_negative_balances CHECK (balance_before >= 0 AND balance_after >= 0)
);

-- 创建索引
CREATE INDEX idx_wallet_logs_wallet_id ON wallet_logs(wallet_id);
CREATE INDEX idx_wallet_logs_merchant_id ON wallet_logs(merchant_id);
CREATE INDEX idx_wallet_logs_transaction_id ON wallet_logs(transaction_id);
CREATE INDEX idx_wallet_logs_created_at ON wallet_logs(created_at);

-- ============================================================================
-- 7. 系统配置表 (system_settings)
-- ============================================================================

CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id),
    
    CONSTRAINT non_empty_key CHECK (LENGTH(TRIM(key)) > 0)
);

-- ============================================================================
-- 8. 创建触发器函数
-- ============================================================================

-- 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用到相关表
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自动创建用户资料和钱包
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, role)
    VALUES (
        NEW.id, 
        NEW.email,
        CASE 
            WHEN NEW.email = 'admin@usdt-gateway.com' THEN 'admin'::user_role
            ELSE 'merchant'::user_role
        END
    );
    
    -- 只为商户创建钱包
    IF NEW.email != 'admin@usdt-gateway.com' THEN
        INSERT INTO wallets (merchant_id)
        VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 9. 启用 Row Level Security (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. 创建 RLS 策略
-- ============================================================================

-- Profiles 策略
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Wallets 策略
CREATE POLICY "Merchants can view own wallet" ON wallets
    FOR SELECT USING (merchant_id = auth.uid());

CREATE POLICY "Admins can view all wallets" ON wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- API Keys 策略
CREATE POLICY "Merchants can manage own api keys" ON api_keys
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY "Admins can view all api keys" ON api_keys
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Transactions 策略
CREATE POLICY "Merchants can view own transactions" ON transactions
    FOR SELECT USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can create own transactions" ON transactions
    FOR INSERT WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Admins can manage all transactions" ON transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Wallet Logs 策略
CREATE POLICY "Merchants can view own wallet logs" ON wallet_logs
    FOR SELECT USING (merchant_id = auth.uid());

CREATE POLICY "Admins can view all wallet logs" ON wallet_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System Settings 策略 (仅管理员)
CREATE POLICY "Only admins can manage system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 11. 插入初始数据
-- ============================================================================

-- 插入系统配置
INSERT INTO system_settings (key, value, description) VALUES
('payout_fee_rate', '0.005', '代付手续费率 (0.5%)'),
('payin_fee_rate', '0.003', '代收手续费率 (0.3%)'),
('min_payout_amount', '10.0', '最小代付金额 (USDT)'),
('max_payout_amount', '100000.0', '最大代付金额 (USDT)'),
('min_payin_amount', '1.0', '最小代收金额 (USDT)'),
('confirmation_blocks', '12', '确认区块数'),
('api_rate_limit', '100', 'API 每分钟请求限制'),
('maintenance_mode', 'false', '维护模式开关');

-- ============================================================================
-- 12. 创建有用的视图
-- ============================================================================

-- 商户概览视图
CREATE VIEW merchant_overview AS
SELECT 
    p.id,
    p.email,
    p.company_name,
    p.status,
    p.created_at,
    w.balance,
    w.frozen_balance,
    w.total_deposit,
    w.total_payout,
    (SELECT COUNT(*) FROM api_keys ak WHERE ak.merchant_id = p.id AND ak.is_active = true) as active_api_keys,
    (SELECT COUNT(*) FROM transactions t WHERE t.merchant_id = p.id) as total_transactions
FROM profiles p
LEFT JOIN wallets w ON p.id = w.merchant_id
WHERE p.role = 'merchant';

-- 交易统计视图
CREATE VIEW transaction_stats AS
SELECT 
    merchant_id,
    type,
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    SUM(fee) as total_fee,
    AVG(amount) as avg_amount,
    DATE_TRUNC('day', created_at) as date
FROM transactions
GROUP BY merchant_id, type, status, DATE_TRUNC('day', created_at);

-- ============================================================================
-- 完成！
-- ============================================================================

-- 创建完成后，记得在 Supabase Dashboard 中：
-- 1. 检查所有表是否创建成功
-- 2. 验证 RLS 策略是否正确应用
-- 3. 测试触发器是否正常工作
-- 4. 创建第一个管理员账户