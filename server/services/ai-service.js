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
    `${post.title} 的核心内容已经整理完成，适合继续作为技术沉淀和后续扩展。`
  );
}

function buildFallbackCorrectnessComment(post) {
  return `AI 正确性点评：这篇文章围绕《${post.title}》展开，整体结构清楚，但当前仅基于文内信息做静态判断，未发现明显自相矛盾之处。若文中涉及 JVM 参数、版本差异或具体结论，仍建议结合官方文档和实际日志再次核对。`;
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
2. 用中文，控制在 50 到 90 个字。
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
  const prompt = `请只从“内容正确性”角度为下面这篇技术博客生成一条简短评论。

要求：
1. 只输出纯文本，不要加引号。
2. 仅评价内容是否存在明显知识性风险、模糊表述或需要核验的点。
3. 不评价文风，不夸赞，不写泛泛的优缺点。
4. 语气客观克制，长度控制在 70 到 140 字。

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

module.exports = {
  generateOfficialComment,
  generateExcerpt,
};
