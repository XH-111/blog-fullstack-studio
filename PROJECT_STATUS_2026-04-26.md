# 项目当前进展说明（2026-04-26）

## 1. 当前总体状态

项目已经形成可用的前后端闭环，核心能力包括：

- 博客前台展示
- 后台登录与密码修改/找回
- 文章创建、编辑、发布、置顶
- Markdown 优先写作、实时预览、代码高亮
- 图片上传到 `public/uploads/...`
- 分类、标签、留言板、关于我模块
- 首页置顶文章展示、知识库排序、文章点赞
- AI 正确性评论
- AI 面试板块（代码已接入）

当前 `npm run build` 可通过。

## 2. 最近已完成的重点功能

- 首页左侧统计卡调整为：文章 / 点赞 / 阅读
- 首页置顶文章支持分页轮播
- 知识库置顶文章支持推荐印章和封面高光
- Markdown 编辑器支持：
  - 实时预览
  - Tab / Shift+Tab 缩进
  - 本地图片上传并插入 Markdown
  - 代码块语法高亮
- 后台文章支持手动设置：
  - 发布时间
  - 阅读量
  - 点赞数
- 新增 AI 面试板块：
  - 后台可勾选生成
  - 前台显示在 AI 正确性评论下方

## 3. 已知风险

### 高优先级

1. `JWT_SECRET` 有默认值  
文件：`server/config.js`  
风险：如果服务器未配置正式密钥，可能被伪造管理员 token。

2. 登录/验证码接口没有限流  
文件：`server/routes/auth.js`  
风险：可被暴力尝试密码、验证码和刷邮件。

3. 评论、留言、首页点赞没有限流  
文件：
- `server/routes/comments.js`
- `server/routes/guestbook.js`
- `server/routes/home-reactions.js`  
风险：容易被刷接口和灌库。

4. CORS 全开放  
文件：`server/index.js`  
风险：任意站点都可以直接跨域调用 API。

5. 上传接口允许 SVG  
文件：`server/routes/uploads.js`  
风险：SVG 不是纯图片，建议禁用或做净化。

## 4. 已知功能欠缺 / 没完全收口的点

1. AI 面试板块代码已接好，但本地 `prisma generate` 曾被 Node 进程锁文件阻塞。  
现状：
- `schema.prisma` 已加 `AiInterview`
- 后端保存逻辑已加
- 前台展示已加
- `build` 通过  
建议：在本地和服务器各执行一次：

```bash
npm run db:generate
npm run db:push
```

2. 文章阅读量显示会慢一拍  
文件：`server/routes/posts.js`  
原因：先查询文章，再自增阅读量，但返回的是自增前的数据。

3. 评论接口没有检查文章是否存在、是否已发布  
文件：`server/routes/comments.js`  
表现：草稿文章或异常 `postId` 的评论逻辑不够严谨。

4. 首页欢迎标签分隔逻辑历史上出现过编码残留  
文件：`src/components/home-page-content.tsx`  
建议：后续统一做一轮 UTF-8 清理，避免再出现中文文案乱码。

## 5. 建议下一步优先处理

### 第一优先级：安全加固

1. 去掉默认 JWT 密钥，未配置则启动失败
2. 给 auth / comments / guestbook / home-reactions 加限流
3. 限制 CORS 到正式前端域名
4. 禁止 SVG 上传

### 第二优先级：功能收口

1. 完成 Prisma Client 最终生成确认
2. 修正文章阅读量返回值慢一拍
3. 给评论接口补文章状态校验
4. 统一清理历史乱码文案

### 第三优先级：内容体验

1. 优化 AI 正确性评论风格，避免“硬挑刺”
2. 优化 AI 面试板块问答质量
3. 继续完善知识库文章内容质量

## 6. 跨 Agent 交接建议

如果交给其他 agent，建议先让对方阅读这些文件：

- `prisma/schema.prisma`
- `server/routes/posts.js`
- `server/services/ai-service.js`
- `src/components/admin-post-form.tsx`
- `src/app/posts/[slug]/page.tsx`
- `src/components/home-page-content.tsx`
- `src/app/knowledge/page.tsx`

建议对方先确认三件事：

1. `npm run db:generate` 是否成功
2. `npm run db:push` 是否成功
3. 勾选“生成 AI 面试板块”后，文章页是否实际展示

## 7. 说明

这份文档优先记录“当前真实状态”和“接下来最值得做的事”，不是完整产品说明。  
旧的 `README.md` 和 `PROJECT_NOTES.md` 不一定反映最新代码状态，后续如需统一，应以当前代码为准重新整理。
