-- 愿望清单表
CREATE TABLE IF NOT EXISTS wishes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishes_created_by ON wishes(created_by);
CREATE INDEX IF NOT EXISTS idx_wishes_is_completed ON wishes(is_completed);

ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view wishes" ON wishes FOR SELECT USING (true);
CREATE POLICY "Anyone can create wishes" ON wishes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update wishes" ON wishes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete wishes" ON wishes FOR DELETE USING (true);

-- "想你了"功能表
CREATE TABLE IF NOT EXISTS miss_you (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_miss_you_to_user ON miss_you(to_user);
CREATE INDEX IF NOT EXISTS idx_miss_you_created_at ON miss_you(created_at);

ALTER TABLE miss_you ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view miss_you" ON miss_you FOR SELECT USING (true);
CREATE POLICY "Anyone can create miss_you" ON miss_you FOR INSERT WITH CHECK (true);

-- 每日打卡表
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('morning', 'night')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON check_ins(check_in_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_check_ins_unique ON check_ins(user_id, check_in_date, type);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view check_ins" ON check_ins FOR SELECT USING (true);
CREATE POLICY "Anyone can create check_ins" ON check_ins FOR INSERT WITH CHECK (true);

-- 纪念日表
CREATE TABLE IF NOT EXISTS anniversaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('together', 'birthday', 'first_date', 'custom')),
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anniversaries_date ON anniversaries(date);

ALTER TABLE anniversaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view anniversaries" ON anniversaries FOR SELECT USING (true);
CREATE POLICY "Anyone can create anniversaries" ON anniversaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update anniversaries" ON anniversaries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete anniversaries" ON anniversaries FOR DELETE USING (true);

-- 时光胶囊表
CREATE TABLE IF NOT EXISTS time_capsules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_by TEXT NOT NULL,
  unlock_date DATE NOT NULL,
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_capsules_unlock_date ON time_capsules(unlock_date);
CREATE INDEX IF NOT EXISTS idx_time_capsules_is_unlocked ON time_capsules(is_unlocked);

ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view time_capsules" ON time_capsules FOR SELECT USING (true);
CREATE POLICY "Anyone can create time_capsules" ON time_capsules FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update time_capsules" ON time_capsules FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete time_capsules" ON time_capsules FOR DELETE USING (true);

-- 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'emoji')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chat_messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can create chat_messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete their own chat_messages" ON chat_messages FOR DELETE USING (true);
