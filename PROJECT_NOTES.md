# PROJECT_NOTES

## 项目概况

- 项目名称：`blog-fullstack-studio`
- 本地路径：`C:\Users\XH0407\blog-fullstack-studio`
- 项目类型：全栈个人博客系统
- 当前状态：本地可运行，阿里云已部署，公网 IP 可访问，域名已解析但备案未完成

## 当前技术栈

- 前端：Next.js 16 + React 19 + Tailwind CSS 4
- 后端：Node.js + Express
- 数据库：SQLite + Prisma
- AI 接入：OpenAI 兼容接口
- 进程管理：PM2
- 反向代理：Nginx

## 已实现功能

- 首页、文章详情页、分类页、归档页、关于页
- 后台登录
- 文章新建、编辑、删除
- Markdown 编辑与预览
- 分类、标签管理
- 游客评论
- AI 内容审核建议
- AI 官方评论自动生成

## 代码结构

- `src/app/`
  - Next.js 页面
- `src/components/`
  - 前端 UI 组件
- `src/lib/`
  - API 请求与前端工具
- `server/`
  - Express API、路由、AI 服务、鉴权、工具函数
- `prisma/`
  - Prisma schema、seed、SQLite 数据文件

## 本地运行方式

### 本地后端

```powershell
cd C:\Users\XH0407\blog-fullstack-studio
npm.cmd run start:server
```

### 本地前端开发模式

```powershell
cd C:\Users\XH0407\blog-fullstack-studio
npm.cmd run dev:web
```

### 本地前端生产模式

```powershell
cd C:\Users\XH0407\blog-fullstack-studio
npm.cmd run build
npm.cmd start
```

### 本地数据库初始化

```powershell
cd C:\Users\XH0407\blog-fullstack-studio
npm.cmd run db:generate
npm.cmd run db:push
npm.cmd run db:seed
```

## 本地环境变量说明

本地 `.env` 关键项：

```env
DATABASE_URL="file:./dev.db"
API_PORT="4000"
JWT_SECRET="..."
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="..."
ADMIN_DISPLAY_NAME="博客管理员"
NEXT_PUBLIC_API_BASE="http://127.0.0.1:4000"
OPENAI_API_KEY="..."
OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
OPENAI_MODEL="qwen-plus"
```

注意：

- `OPENAI_BASE_URL` 变量名必须是 `URL`，不能写成 `URI`
- `.env` 不应提交到 GitHub
- `.env.example` 应保留为模板文件

## AI 相关说明

- 当前接入目标：阿里云百炼
- 接入方式：OpenAI 兼容接口
- 建议模型：`qwen-plus`
- AI 调用位置：
  - `server/services/ai-service.js`
- 触发时机：
  - 新建文章
  - 编辑文章

AI 功能包括：

- 文章内容审核
- 自动生成 AI 官方评论

## 已知问题

### 1. 本地 Next.js dev 模式热更新不稳定

现象：

- `ws://127.0.0.1:3000/_next/webpack-hmr...` 报错
- 浏览器里可能出现：
  - `ERR_INVALID_HTTP_RESPONSE`
  - 字体 `403`
  - 页面壳子正常但数据请求不正常

结论：

- 问题更像本地浏览器缓存 / 插件 / HMR 通道异常
- 不是后端和数据库本身故障

建议：

- 开发时优先用无痕窗口
- 发生异常时删除 `.next` 后重启前端
- 用生产模式复核：

```powershell
npm.cmd run build
npm.cmd start
```

### 2. 域名备案未完成

当前状态：

- 服务器公网 IP：`47.114.127.226`
- 域名：`hechenxu.cn`
- 域名解析已指向服务器
- 但因为备案 / 接入备案状态问题，域名访问被阿里云拦截

现阶段建议：

- 暂时使用 IP 访问
- 等备案完成后再继续配置 HTTPS

## 当前服务器部署信息

- 服务器类型：阿里云轻量应用服务器
- 系统：Ubuntu 22.04
- 公网 IP：`47.114.127.226`
- 项目目录：`/var/www/blog-fullstack-studio`

## 服务器运行方式

### PM2

启动：

```bash
cd /var/www/blog-fullstack-studio
pm2 start ecosystem.config.cjs
```

查看状态：

```bash
pm2 status
```

查看日志：

```bash
pm2 logs
pm2 logs blog-api
pm2 logs blog-web
```

重启：

```bash
pm2 restart ecosystem.config.cjs
```

### Nginx

配置文件：

```bash
/etc/nginx/sites-available/blog-fullstack-studio
```

生效链接：

```bash
/etc/nginx/sites-enabled/blog-fullstack-studio
```

常用命令：

```bash
nginx -t
systemctl restart nginx
systemctl reload nginx
systemctl status nginx
```

## 线上更新流程

### 本地

```powershell
git add .
git commit -m "你的改动说明"
git push
```

### 服务器

```bash
cd /var/www/blog-fullstack-studio
git pull
npm install
npm run db:generate
npm run db:push
npm run build
pm2 restart ecosystem.config.cjs
```

## Git / GitHub 说明

- 远程仓库已推送到 GitHub
- 主分支：`main`
- 推荐做法：
  - 本地开发
  - 提交到 GitHub
  - 服务器 `git pull`
- 不要直接在服务器上手改业务代码

## 后续建议优先级

### 高优先级

- 域名备案完成后启用域名访问
- 配置 HTTPS
- 修复本地 dev 模式热更新异常

### 中优先级

- 增加后台一键发布 / 撤回按钮
- 优化文章编辑页交互
- 优化 AI 提示词与结果展示

### 可选升级

- SQLite 迁移到 MySQL / PostgreSQL
- 接入对象存储上传图片
- 增加评论审核
- 增加文章草稿自动保存

## 给后续 AI / 开发者的提示

如果以后继续开发，优先以代码和本文件为准，不要依赖早期聊天记录。

建议进入项目后先确认：

- 本地 `.env` 是否正确
- 本地后端 `http://127.0.0.1:4000/api/posts` 是否有数据
- 本地前端当前使用的是 `dev` 还是生产模式
- 服务器上 `pm2 status` 是否正常

