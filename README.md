# ❤️ 心语盒子 - 专属留言板

一个温馨浪漫的专属留言板应用，让你随时随地给她留下温暖的话语。

## ✨ 特性

- 📱 **跨平台支持** - 安卓、苹果、电脑都能用
- 💝 **PWA 应用** - 可添加到手机桌面，像原生 APP 一样
- 🎨 **精美界面** - 温馨浪漫的设计风格
- ⚡ **实时更新** - 发布留言后立即显示
- 🔒 **数据安全** - 基于 Supabase，数据安全可靠
- 💯 **完全免费** - 无需服务器，零成本运行

## 🎯 功能

### 她的界面（查看端）
- ✅ 查看所有留言
- ✅ 留言详情展示
- ✅ 点赞留言
- ✅ 统计数据（收到留言数、在一起天数等）
- ✅ 下拉刷新
- ✅ 心情标签（想你、加油、晚安、惊喜）

### 你的界面（管理端）
- ✅ 发布新留言
- ✅ 添加图片
- ✅ 选择心情标签
- ✅ 定时发布
- ✅ 查看留言状态（已读/未读）
- ✅ 查看点赞数

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

1. 访问 [https://supabase.com](https://supabase.com) 创建账号
2. 创建新项目
3. 按照 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 配置数据库
4. 复制 `.env.example` 为 `.env`，填入你的 Supabase 配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```
VITE_SUPABASE_URL=你的_supabase_url
VITE_SUPABASE_ANON_KEY=你的_supabase_anon_key
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

### 4. 构建生产版本

```bash
npm run build
```

## 📱 添加到手机桌面

### 安卓手机
1. 用 Chrome 浏览器打开应用
2. 点击右上角菜单
3. 选择"添加到主屏幕"
4. 完成！桌面会出现应用图标

### 苹果手机
1. 用 Safari 浏览器打开应用
2. 点击底部分享按钮
3. 选择"添加到主屏幕"
4. 完成！桌面会出现应用图标

## 🎨 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI 组件**: Vant 4
- **状态管理**: Pinia
- **路由**: Vue Router
- **后端服务**: Supabase (BaaS)
- **PWA**: vite-plugin-pwa

## 📂 项目结构

```
love-notes/
├── src/
│   ├── assets/          # 静态资源
│   │   └── styles/      # 全局样式
│   ├── components/      # 公共组件
│   ├── router/          # 路由配置
│   ├── stores/          # 状态管理
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数
│   ├── views/           # 页面组件
│   │   ├── MessageList.vue      # 留言列表
│   │   ├── MessageDetail.vue    # 留言详情
│   │   ├── Stats.vue            # 统计页面
│   │   ├── Admin.vue            # 管理后台
│   │   ├── AdminNew.vue         # 发布留言
│   │   └── Login.vue            # 登录页面
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── public/              # 公共资源
├── .env                 # 环境变量（需要自己创建）
├── .env.example         # 环境变量示例
├── SUPABASE_SETUP.md    # Supabase 配置指南
└── README.md            # 项目说明
```

## 🎯 使用指南

### 发布留言

1. 访问 `/admin` 进入管理后台
2. 点击"发布新留言"
3. 选择心情标签
4. 输入留言内容
5. 可选：添加图片 URL
6. 选择立即发布或定时发布
7. 点击发布按钮

### 查看留言

1. 访问首页 `/messages`
2. 查看所有留言列表
3. 点击留言卡片查看详情
4. 可以点赞留言

### 查看统计

1. 在首页点击"统计"按钮
2. 查看收到留言数、在一起天数等数据

## 🚀 部署

### 部署到 Vercel（推荐）

1. 将代码推送到 GitHub
2. 访问 [https://vercel.com](https://vercel.com)
3. 导入你的 GitHub 仓库
4. 添加环境变量（VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY）
5. 点击部署
6. 完成！获得一个 HTTPS 域名

### 部署到 Netlify

1. 将代码推送到 GitHub
2. 访问 [https://netlify.com](https://netlify.com)
3. 导入你的 GitHub 仓库
4. 构建命令：`npm run build`
5. 发布目录：`dist`
6. 添加环境变量
7. 点击部署

## 🎨 自定义

### 修改主题色

编辑 `src/assets/styles/global.css`：

```css
:root {
  --primary-color: #ff6b9d;  /* 主色调 */
  --secondary-color: #ffd93d; /* 辅助色 */
  /* ... 其他颜色 */
}
```

### 修改应用名称

编辑 `vite.config.ts` 中的 PWA 配置：

```typescript
manifest: {
  name: '你的应用名称',
  short_name: '短名称',
  // ...
}
```

### 添加新的心情标签

编辑 `src/types/index.ts`：

```typescript
export const MOOD_TAGS = {
  miss: { label: '想你', emoji: '💕', color: '#ff6b9d' },
  // 添加新的标签...
}
```

## 📝 后续优化

- [ ] 添加用户认证功能
- [ ] 实现图片上传到 Supabase Storage
- [ ] 添加回复功能
- [ ] 实现每日一句模式
- [ ] 添加纪念日提醒
- [ ] 实现心情日历视图
- [ ] 添加语音留言功能
- [ ] 生成年度报告

## 💖 致谢

感谢你选择这个项目，希望它能给你的女朋友带来惊喜和温暖！

---

用 ❤️ 制作
