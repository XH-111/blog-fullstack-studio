# Blog Fullstack Studio

一套可直接部署的高颜值个人博客全站项目，前后端完整，支持：

- 文章发布、编辑、删除
- Markdown 在线编辑与预览
- 分类、标签、归档、搜索
- 游客评论与楼层展示
- 管理员后台登录
- AI 内容审核建议
- AI 官方评论自动生成

## 技术栈

- 前端：Next.js 16 + React 19 + Tailwind CSS 4
- 后端：Node.js + Express
- 数据库：SQLite + Prisma
- AI：OpenAI 兼容接口，可替换任意兼容大模型服务

## 目录结构

```text
blog-fullstack-studio/
├─ prisma/                 # 数据模型、SQLite 数据库、种子脚本
├─ server/                 # Express API、鉴权、AI 服务、路由
├─ src/
│  ├─ app/                 # Next.js 页面
│  ├─ components/          # UI 组件与编辑器组件
│  └─ lib/                 # API 请求与主题工具
├─ .env.example            # 环境变量模板
└─ package.json
```

## 核心功能说明

### 1. 博客内容系统

- 首页展示文章卡片、分类入口、站内搜索入口
- 后台支持新建、编辑、删除文章
- 文章支持摘要、封面图、分类、标签、发布状态
- 文章详情页展示正文、AI 审核建议、评论列表

### 2. 评论系统

- 游客匿名评论
- 支持昵称、邮箱、评论时间、楼层
- 每篇文章自动维护评论楼层

### 3. AI 系统

- 发布或更新文章后，后端自动生成 AI 审核结果：
  - 错别字
  - 语句通顺
  - 逻辑结构
  - 知识准确
  - 格式排版
  - 综合建议
- 同时自动生成一条 AI 官方评论，并写入评论区
- 未配置大模型时，自动使用本地规则兜底，不会阻塞发布

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

默认关键配置：

```env
DATABASE_URL="file:./dev.db"
API_PORT="4000"
JWT_SECRET="replace-with-a-long-random-secret"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123456"
ADMIN_DISPLAY_NAME="博客管理员"
NEXT_PUBLIC_API_BASE="http://127.0.0.1:4000"
OPENAI_API_KEY=""
OPENAI_BASE_URL=""
OPENAI_MODEL=""
```

### 3. 初始化数据库

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. 启动开发环境

```bash
npm run dev
```

启动后：

- 前端：`http://127.0.0.1:3000`
- 后端：`http://127.0.0.1:4000`
- 后台登录：`/admin/login`

默认管理员账号：

- 用户名：`admin`
- 密码：`admin123456`

## 生产部署到阿里云 ECS

以下方案适用于 Ubuntu 22.04。

### 1. 服务器准备

安装基础环境：

```bash
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

确认版本：

```bash
node -v
npm -v
pm2 -v
```

### 2. 上传项目

可以用 `git clone` 或者直接上传目录到服务器，例如：

```bash
cd /var/www
git clone <你的仓库地址> blog-fullstack-studio
cd blog-fullstack-studio
```

### 3. 安装依赖并初始化数据库

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
```

把 `.env` 中这几项改成你的生产值：

- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_API_BASE`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

如果前后端都部署在同一台服务器，建议：

```env
NEXT_PUBLIC_API_BASE="https://你的域名"
API_PORT="4000"
```

### 4. 构建前端

```bash
npm run build
```

### 5. 启动前后端

前端：

```bash
pm2 start npm --name blog-web -- start
```

后端：

```bash
pm2 start npm --name blog-api -- run start:server
```

保存自启：

```bash
pm2 save
pm2 startup
```

### 6. 配置 Nginx

新建配置：

```bash
sudo nano /etc/nginx/sites-available/blog-fullstack-studio
```

写入：

```nginx
server {
    listen 80;
    server_name 你的域名;

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/blog-fullstack-studio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. 配置 HTTPS

如果域名已解析到阿里云服务器：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
```

## AI 接口接入说明

本项目已预留 OpenAI 兼容接口。

只要配置以下变量即可启用真实 AI：

```env
OPENAI_API_KEY="你的密钥"
OPENAI_BASE_URL="https://你的兼容接口地址/v1"
OPENAI_MODEL="gpt-4o-mini"
```

未配置时：

- 可以正常发文
- 会走本地规则兜底
- AI 审核和 AI 评论依然会生成，但不是大模型结果

## 已完成验证

已完成以下验证：

- `npm run lint`
- `npx tsc --noEmit`
- `npm run db:seed`
- 后端接口实测通过：
  - `/api/health`
  - `/api/auth/login`
  - `/api/posts`
  - `/api/comments`

当前 Windows 本地环境在执行 `npm run build` 时会在 Next.js 最后阶段遇到：

```text
Error: spawn EPERM
```

这个问题发生在当前系统环境的进程拉起阶段，不是本项目的 TypeScript 或 ESLint 错误。代码编译已经完成，建议最终以阿里云 Linux 环境的 `npm run build` 结果为准。

## 后续可扩展方向

- 上传图片到 OSS / S3
- 真正富文本编辑器接入 Tiptap UI
- 评论审核与敏感词过滤
- 多管理员角色
- RSS、站点地图、SEO 增强
- 文章草稿自动保存
