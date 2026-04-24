const { openAiApiKey, openAiBaseUrl, openAiModel } = require("../config");

function buildFallbackReview(post) {
  const content = `${post.title}\n${post.excerpt}\n${post.contentMarkdown}`;
  const issues = [];

  if (content.length < 180) {
    issues.push("正文偏短，建议补充更多背景、过程和结论。");
  }
  if (!/[。！？?!]$/.test(post.excerpt || "")) {
    issues.push("摘要结尾缺少句号或收束标点。");
  }
  if ((post.contentMarkdown.match(/\n#/g) || []).length < 1) {
    issues.push("建议增加分节标题，提升阅读层次。");
  }

  return {
    typoIssues:
      "当前未接入外部大模型，因此无法做高置信度错别字识别；建议发布前人工复核专有名词。",
    clarityIssues: issues[0] || "语句整体可读，但仍可继续优化过长句子。",
    logicIssues: issues[1] || "逻辑结构基本完整，建议在开头更快交代文章目标。",
    knowledgeIssues:
      "当前未接入外部知识校验，仅做基础结构检查；涉及专业知识时建议人工复核。",
    formatIssues: issues[2] || "格式整体正常，可继续补充小标题和列表。",
    overallSuggestion:
      issues.length > 0
        ? issues.join(" ")
        : "文章整体结构完整，建议发布前再做一次人工精修。",
    rawResponse: JSON.stringify({ mode: "fallback", issues }),
  };
}

function buildFallbackOfficialComment(post) {
  return `AI 评论：这篇文章围绕“${post.title}”展开，结构较清晰，能够看出作者在问题拆解与工程表达上的意识。优点是主题明确、内容聚焦；后续可以继续加强案例细节、反例说明和更系统的总结，这样会更适合长期归档与传播。`;
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
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "你是技术博客编辑与内容审校助手。输出必须是合法 JSON，不要输出任何额外说明。",
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

async function reviewPostContent(post) {
  const prompt = `
请检查以下博客文章内容，并严格返回 JSON：
{
  "typoIssues": "",
  "clarityIssues": "",
  "logicIssues": "",
  "knowledgeIssues": "",
  "formatIssues": "",
  "overallSuggestion": ""
}

标题：${post.title}
摘要：${post.excerpt}
正文：${post.contentMarkdown}
`;

  try {
    const content = await callExternalModel(prompt);
    if (!content) {
      return buildFallbackReview(post);
    }

    const parsed = JSON.parse(content);
    return {
      typoIssues: parsed.typoIssues || "",
      clarityIssues: parsed.clarityIssues || "",
      logicIssues: parsed.logicIssues || "",
      knowledgeIssues: parsed.knowledgeIssues || "",
      formatIssues: parsed.formatIssues || "",
      overallSuggestion: parsed.overallSuggestion || "",
      rawResponse: content,
    };
  } catch (error) {
    return buildFallbackReview(post);
  }
}

async function generateOfficialComment(post) {
  const prompt = `
请为以下技术博客生成一条客观、克制、专业的 AI 官方评论，要求：
1. 点评文章优缺点
2. 简短补充扩展知识
3. 语气客观，不要过度夸张
4. 直接返回纯文本

标题：${post.title}
摘要：${post.excerpt}
正文：${post.contentMarkdown}
`;

  try {
    const content = await callExternalModel(prompt);
    return content || buildFallbackOfficialComment(post);
  } catch (error) {
    return buildFallbackOfficialComment(post);
  }
}

module.exports = { reviewPostContent, generateOfficialComment };
