# Blog Fullstack Studio

一个可部署的个人博客全栈项目，包含前台展示、后台管理、评论、Markdown 写作、站点设置和可选 AI 辅助能力。

## 当前状态

- 前台：首页、文章详情、分类、归档、搜索、关于页
- 后台：登录、文章新建/编辑/删除、分类标签管理、站点设置
- 文章：Markdown 编辑、发布/撤回、摘要自动补充
- 评论：游客评论、楼层、时间展示
- AI：已删除 AI 审核功能，仅保留可选的“AI 正确性评论”
- 图片：正文支持粘贴图片、URL 插图和宽度调整；头像支持后台本地上传
- 首页：头像、背景图、标题、简介均可在后台修改

## 技术栈

- 前端：Next.js 16 + React 19 + Tailwind CSS 4
- 后端：Node.js + Express
- 数据库：SQLite + Prisma
- 部署：PM2 + Nginx
- AI：OpenAI 兼容接口，可接入阿里云百炼等兼容服务

## 本地运行

安装依赖：

```bash
npm install
```

初始化数据库：

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

生产模式本地预览推荐分两个终端启动：

```powershell
cd C:\Users\XH0407\blog-fullstack-studio
npm.cmd run start:server
```

```powershell
cd C:\Users\XH0407\blog-fullstack-studio
npm.cmd start
```

访问地址：

- 前台：`http://127.0.0.1:3000`
- 后台：`http://127.0.0.1:3000/admin/login`

开发模式也可以使用：

```bash
npm run dev
```

## 环境变量

复制 `.env.example` 为 `.env` 后修改：

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

AI 推荐配置示例：

```env
OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
OPENAI_MODEL="qwen-plus"
```

说明：

- 摘要为空时，后端会尝试调用 AI 生成摘要；AI 不可用时使用本地 fallback。
- “AI 正确性评论”由后台文章编辑页开关控制。
- AI 审核功能已经移除，不再生成或展示审核报告。

## 服务器部署

当前服务器使用 SSH 拉取 GitHub 仓库：

- 线上目录：`/var/www/blog-fullstack-studio`
- 暂用地址：`http://47.114.127.226`
- 仓库：`git@github.com:XH-111/blog-fullstack-studio.git`

部署命令：

```bash
cd /var/www/blog-fullstack-studio
git pull
npm install
npm run db:generate
npm run db:push
npm run build
pm2 restart ecosystem.config.cjs
pm2 status
```

如果 `git pull` 提示 `prisma/dev.db` 会被覆盖，先备份线上数据库：

```bash
mkdir -p backups
cp prisma/dev.db backups/dev-$(date +%F-%H%M%S).db
git restore prisma/dev.db
git pull
```

PM2 服务：

- `blog-web`
- `blog-api`

查看日志：

```bash
pm2 logs blog-web --lines 50
pm2 logs blog-api --lines 50
```

Nginx 配置文件：

```bash
/etc/nginx/sites-available/blog-fullstack-studio
```

重启 Nginx：

```bash
nginx -t && systemctl restart nginx
```

## 验证

最近一次本地验证通过：

```bash
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

## 已知注意点

- 域名 `hechenxu.cn` 正在备案中，备案完成前先用 IP 访问。
- 头像当前以 base64/data URL 存入数据库，小图可用；大量正文图片不建议长期这样存。
- 正文粘贴图片目前也可能是 base64，后续更适合升级为 `/public/uploads` 或阿里云 OSS。
- SQLite 数据库文件在服务器上要注意备份，不要直接覆盖线上 `prisma/dev.db`。
- 之前有一把阿里云百炼 API Key 曾在截图中暴露，应视为泄露并在控制台重置。

## 建议下一步

- 把头像和正文图片升级为真正上传到服务器 `/public/uploads`
- 清理历史 `AiReview` 表和旧数据
- 域名备案完成后配置 HTTPS
- 增加一键部署脚本，减少手工命令出错概率
