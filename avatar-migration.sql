-- 为 chat_messages 表添加 avatar_url 列
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 为 messages 表添加 avatar_url 列（如果存在该表）
-- ALTER TABLE messages ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 为 replies 表添加 avatar_url 列（如果存在该表）
-- ALTER TABLE replies ADD COLUMN IF NOT EXISTS avatar_url TEXT;
