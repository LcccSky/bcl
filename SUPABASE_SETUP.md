# Supabase 数据库配置指南

## 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project" 创建新项目
4. 填写项目信息：
   - Name: love-notes
   - Database Password: 设置一个强密码（请记住）
   - Region: 选择离你最近的区域
5. 等待项目创建完成（约2分钟）

## 2. 获取 API 密钥

1. 进入项目后，点击左侧菜单的 "Settings" → "API"
2. 找到以下信息：
   - **Project URL**: 复制这个URL
   - **anon public**: 复制这个密钥
3. 将这两个值填入项目根目录的 `.env` 文件：
   ```
   VITE_SUPABASE_URL=你的Project URL
   VITE_SUPABASE_ANON_KEY=你的anon public密钥
   ```

## 3. 创建数据库表

在 Supabase 控制台，点击左侧菜单的 "SQL Editor"，然后执行以下 SQL：

### 3.1 创建 users 表

```sql
-- 创建用户表
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建策略：所有人可以读取
CREATE POLICY "Allow public read access" ON users
  FOR SELECT USING (true);
```

### 3.2 创建 messages 表

```sql
-- 创建留言表
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  image_url TEXT,
  mood_tag TEXT NOT NULL CHECK (mood_tag IN ('miss', 'cheer', 'goodnight', 'surprise')),
  publish_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_published BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 创建策略：所有人可以读取已发布的留言
CREATE POLICY "Allow public read published messages" ON messages
  FOR SELECT USING (is_published = true AND publish_at <= NOW());

-- 创建策略：所有人可以插入留言（后续可以改为仅管理员）
CREATE POLICY "Allow insert messages" ON messages
  FOR INSERT WITH CHECK (true);

-- 创建策略：所有人可以更新留言（后续可以改为仅管理员）
CREATE POLICY "Allow update messages" ON messages
  FOR UPDATE USING (true);

-- 创建策略：所有人可以删除留言（后续可以改为仅管理员）
CREATE POLICY "Allow delete messages" ON messages
  FOR DELETE USING (true);
```

### 3.3 创建 replies 表

```sql
-- 创建回复表
CREATE TABLE replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- 创建策略：所有人可以读取回复
CREATE POLICY "Allow public read replies" ON replies
  FOR SELECT USING (true);

-- 创建策略：所有人可以插入回复
CREATE POLICY "Allow insert replies" ON replies
  FOR INSERT WITH CHECK (true);
```

### 3.4 创建 settings 表

```sql
-- 创建设置表
CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  theme TEXT DEFAULT 'pink',
  notification_enabled BOOLEAN DEFAULT true,
  daily_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户可以读取自己的设置
CREATE POLICY "Users can read own settings" ON settings
  FOR SELECT USING (true);

-- 创建策略：用户可以更新自己的设置
CREATE POLICY "Users can update own settings" ON settings
  FOR UPDATE USING (true);
```

### 3.5 创建点赞函数

```sql
-- 创建点赞函数
CREATE OR REPLACE FUNCTION increment_likes(message_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET likes_count = likes_count + 1
  WHERE id = message_id;
END;
$$ LANGUAGE plpgsql;
```

### 3.6 创建自动更新时间戳的触发器

```sql
-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 messages 表创建触发器
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 settings 表创建触发器
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 4. 插入测试数据

```sql
-- 插入测试用户
INSERT INTO users (username, role) VALUES
  ('admin', 'admin'),
  ('viewer', 'viewer');

-- 插入测试留言（使用第一个用户的ID）
INSERT INTO messages (author_id, content, mood_tag, publish_at, is_published, likes_count)
SELECT
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '今天天气很好，想你了～',
  'miss',
  NOW(),
  true,
  5;

INSERT INTO messages (author_id, content, mood_tag, publish_at, is_published, likes_count)
SELECT
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '记得吃早餐哦！',
  'cheer',
  NOW() - INTERVAL '1 day',
  true,
  12;

INSERT INTO messages (author_id, content, mood_tag, publish_at, is_published, likes_count)
SELECT
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  '晚安，做个好梦～',
  'goodnight',
  NOW() - INTERVAL '2 days',
  true,
  8;
```

## 5. 启用实时订阅（可选）

如果你想要实时更新功能：

1. 在 Supabase 控制台，点击 "Database" → "Replication"
2. 找到 `messages` 表，点击右侧的开关启用实时订阅

## 6. 配置存储（用于图片上传）

1. 点击左侧菜单的 "Storage"
2. 点击 "Create a new bucket"
3. 填写信息：
   - Name: `message-images`
   - Public bucket: 勾选（允许公开访问）
4. 点击 "Create bucket"

## 7. 验证配置

完成以上步骤后：

1. 确保 `.env` 文件已正确填写
2. 重启开发服务器：`npm run dev`
3. 打开浏览器访问应用
4. 应该能看到测试留言数据

## 常见问题

### Q: 提示连接失败？
A: 检查 `.env` 文件中的 URL 和密钥是否正确复制，注意不要有多余的空格。

### Q: 数据无法显示？
A: 检查是否正确执行了所有 SQL 语句，特别是行级安全策略。

### Q: 如何重置数据库？
A: 在 SQL Editor 中执行：
```sql
DROP TABLE IF EXISTS replies CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```
然后重新执行创建表的 SQL。

## 下一步

配置完成后，你可以：
1. 运行 `npm run dev` 启动开发服务器
2. 访问 `http://localhost:3000` 查看应用
3. 测试留言列表、详情、点赞等功能
4. 开始添加你自己的留言内容
