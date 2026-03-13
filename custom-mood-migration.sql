-- 为 messages 表添加自定义心情字段
ALTER TABLE messages ADD COLUMN IF NOT EXISTS mood_emoji TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS mood_color TEXT;
