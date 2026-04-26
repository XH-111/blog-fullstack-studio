const { openAiApiKey, openAiBaseUrl, openAiModel } = require("../config");

function buildFallbackExcerpt(post) {
  const plain = String(post.contentMarkdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<img[^>]*>/g, " ")
    .replace(/[#>*`!\[\]\(\)-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    plain.slice(0, 92).trim() ||
    `${post.title} 的核心内容已经整理完成，适合作为技术复盘、知识总结或继续延展的阅读入口。`
  );
}

function buildFallbackCorrectnessComment(post) {
  return `AI 正确性评论：本文围绕《${post.title}》展开，当前未发现明显的知识性错误或自相矛盾之处，核心结论基本成立；如果涉及强版本依赖、线上参数或实现差异，仍建议结合实际环境确认。`;
}

function buildFallbackInterviewMarkdown(post) {
  return `## 面试可能会问

### 1. 这篇文章最核心的结论是什么？
答：核心结论要围绕《${post.title}》的主题展开，先讲清问题背景，再说明为什么这样设计或判断。

### 2. 如果继续追问，你会补充什么？
答：我会补充实现细节、适用边界和常见误区，而不是只停留在结论本身。

### 3. 面试里怎样回答会更稳？
答：先给定义和主结论，再补一两个关键细节，最后说明适用场景或限制条件。`;
}

async function callExternalModel(prompt) {
  if (!openAiApiKey || !openAiBaseUrl || !openAiModel) {
    return null;
  }

  const response = await fetch(
    `${openAiBaseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: openAiModel,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "你是技术博客写作助手。除非用户明确要求，否则只输出需要的正文，不要附加说明。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`AI 接口调用失败: ${response.status}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || null;
}

async function generateExcerpt(post) {
  const prompt = `请为下面这篇技术博客生成一段适合文章列表展示的摘要。
要求：
1. 只输出摘要文本，不要加标题和引号。
2. 使用中文，控制在 50 到 90 个字。
3. 优先说明文章主题、解决的问题和适合的读者。
标题：${post.title}
正文：${post.contentMarkdown}`;

  try {
    const content = await callExternalModel(prompt);
    return content?.trim() || buildFallbackExcerpt(post);
  } catch (_error) {
    return buildFallbackExcerpt(post);
  }
}

async function generateOfficialComment(post) {
  const prompt = `请只从“内容正确性”角度审阅下面这篇技术博客，并输出一条简短评论。
要求：
1. 只输出纯文本，不要加引号。
2. 如果正文中没有明显知识性错误、明显过时结论、明显自相矛盾或明显需要立即核验的技术判断，请明确写出“本文没有明显的知识性错误”这一类结论，不要为了评论而硬挑问题。
3. 只有在确实存在具体风险时，才指出具体风险点或需要核验的点。
4. 不评价文风，不夸赞，不写泛泛的优缺点，不重复“建议结合官方文档核对”这类空话。
5. 语气客观克制，长度控制在 60 到 130 字。
标题：${post.title}
摘要：${post.excerpt || "无"}
正文：${post.contentMarkdown}`;

  try {
    const content = await callExternalModel(prompt);
    return content?.trim() || buildFallbackCorrectnessComment(post);
  } catch (_error) {
    return buildFallbackCorrectnessComment(post);
  }
}

async function generateInterviewMarkdown(post) {
  const prompt = `请根据下面这篇技术博客，生成一个适合展示在文章页里的“AI 面试板块”。
要求：
1. 使用 Markdown 输出。
2. 直接输出内容，不要加额外说明。
3. 先输出二级标题：## 面试可能会问
4. 生成 3 到 5 个高频面试问题，每个问题都要紧扣文章主题。
5. 每个问题后面给一段简短回答，回答要自然、像真实面试回答，不要太像模板。
6. 回答长度控制在 40 到 120 字，优先讲核心思路、关键点和容易被追问的地方。
7. 不要脱离文章主题乱扩展，不要生成和正文无关的问题。
标题：${post.title}
摘要：${post.excerpt || "无"}
正文：${post.contentMarkdown}`;

  try {
    const content = await callExternalModel(prompt);
    return content?.trim() || buildFallbackInterviewMarkdown(post);
  } catch (_error) {
    return buildFallbackInterviewMarkdown(post);
  }
}

module.exports = {
  generateOfficialComment,
  generateExcerpt,
  generateInterviewMarkdown,
};
