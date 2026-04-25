# PROJECT_NOTES

## 项目现状

- 项目路径：`C:\Users\XH0407\blog-fullstack-studio`
- 线上目录：`/var/www/blog-fullstack-studio`
- 线上地址暂用：`http://47.114.127.226`
- GitHub 仓库：`git@github.com:XH-111/blog-fullstack-studio.git`
- 技术栈：Next.js + Express + Prisma + SQLite + PM2 + Nginx

博客已经是完整前后端项目：

- 前台：首页、文章详情、分类、归档、搜索、关于页
- 后台：登录、文章新建/编辑/删除、分类标签管理、站点设置
- 文章：支持 Markdown 编辑、发布/撤回、摘要自动补充
- 评论：游客评论、楼层、时间展示
- AI：已删除 AI 审核功能；只保留可选的“AI 正确性评论”
- 图片：正文支持复制粘贴图片、URL 插入和宽度调整；头像支持后台本地上传
- 首页：个人头像、首页背景图、标题、简介都能在后台修改

## 最近关键改动

- 删除 AI 审核生成和展示逻辑
- 保留 AI 正确性评论，由后台文章编辑页开关控制
- 摘要为空时，后端自动调用 AI 生成摘要；AI 不可用时走 fallback
- 编辑器支持直接粘贴图片、图片 URL 插入、320 / 480 / 640 / 800px 快捷调整
- 站点设置支持本地上传头像，保存到数据库字段 `profileImage`
- Markdown 渲染已开启 HTML，以支持 `<img width="...">`

## 重要文件

- `src/app/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/settings/page.tsx`
- `src/components/admin-post-form.tsx`
- `src/components/markdown-editor.tsx`
- `src/app/posts/[slug]/page.tsx`
- `server/routes/posts.js`
- `server/services/ai-service.js`
- `server/utils/markdown.js`
- `prisma/schema.prisma`
- `PROJECT_NOTES.md`

## 本地运行

生产模式推荐：

```powershell
cd C:\Users\XH0407\blog-fullstack-studio
npm.cmd run start:server
```

另开一个终端：

```powershell
cd C:\Users\XH0407\blog-fullstack-studio
npm.cmd start
```

访问：

- `http://127.0.0.1:3000`
- `http://127.0.0.1:3000/admin/login`

最近一次本地验证通过：

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

## 服务器部署

服务器已经改成 SSH 拉 GitHub，HTTPS 拉取不稳定。

```bash
ssh root@47.114.127.226
cd /var/www/blog-fullstack-studio
git pull
npm install
npm run db:generate
npm run db:push
npm run build
pm2 restart ecosystem.config.cjs
pm2 status
```

如果 `git pull` 提示 `prisma/dev.db` 会被覆盖，先备份数据库：

```bash
mkdir -p backups
cp prisma/dev.db backups/dev-$(date +%F-%H%M%S).db
git restore prisma/dev.db
git pull
```

PM2 服务：

- `blog-web`
- `blog-api`

日志：

```bash
pm2 logs blog-web --lines 50
pm2 logs blog-api --lines 50
```

Nginx 配置：

```bash
/etc/nginx/sites-available/blog-fullstack-studio
nginx -t && systemctl restart nginx
```

## AI 配置

服务器 `.env`：

```env
OPENAI_API_KEY="你的新Key"
OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
OPENAI_MODEL="qwen-plus"
```

改完重启：

```bash
pm2 restart ecosystem.config.cjs
```

注意：之前有一把百炼 API Key 曾经在截图中暴露过，应该视为泄露，需要在阿里云百炼控制台重置。

## 已知注意点

- 域名 `hechenxu.cn` 正在备案中，备案完成前先用 IP 访问。
- 头像现在是 base64/data URL 存数据库，头像小图可用。
- 正文图片目前粘贴后也可能是 base64，后续更专业的方向是做 `/uploads` 文件上传或接阿里云 OSS。
- SQLite 数据库文件在服务器上要注意备份，不要直接覆盖线上 `prisma/dev.db`。
- `AiReview` 表仍在 schema 中，当前保存文章时会清理旧审核记录；后续可以做迁移彻底删除。

## 建议下一步

- 把头像和正文图片升级为真正上传到服务器 `/public/uploads`
- 清理历史 `AiReview` 表和旧数据
- 域名备案完成后配置 HTTPS
- 做一键部署脚本，减少手工命令出错概率
