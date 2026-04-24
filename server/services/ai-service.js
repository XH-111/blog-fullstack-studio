const { openAiApiKey, openAiBaseUrl, openAiModel } = require("../config");

function buildFallbackReview(post) {
  const content = `${post.title}\n${post.excerpt}\n${post.contentMarkdown}`;
  const issues = [];

  if (content.length < 180) {
    issues.push("正文偏短，建议补充更多背景、过程和结论。");
  }
  if (!/[。！？?!]$/.test(post.excerpt || "")) {
    issues.push("摘要结尾缺少收束标点，建议补一个句号。");
  }
  if ((post.contentMarkdown.match(/\n#/g) || []).length < 2) {
    issues.push("建议增加分节标题，让内容层次更清楚。");
  }

  return {
    typoIssues:
      "当前未接入高置信度拼写校验，只能做基础结构检查；发布前建议人工复核专有名词。",
    clarityIssues: issues[0] || "语句整体通顺，可以继续压缩部分长句，提升阅读节奏。",
    logicIssues: issues[1] || "逻辑结构基本完整，建议在开头更快说明文章目标和适用场景。",
    knowledgeIssues:
      "当前未做外部知识核验，涉及版本、参数或结论时建议结合官方文档再次确认。",
    formatIssues: issues[2] || "格式整体正常，可继续增加小标题、列表或总结段落。",
    overallSuggestion:
      issues.length > 0
        ? issues.join(" ")
        : "文章结构已经比较完整，建议发布前再做一次人工精修。",
    rawResponse: JSON.stringify({ mode: "fallback", issues }),
  };
}

function buildFallbackOfficialComment(post) {
  return `AI 评论：这篇文章围绕《${post.title}》展开，内容方向明确，结构也比较清楚。优点是主题聚焦、表达直接，适合做个人知识沉淀；如果后续能再补充实际案例、边界条件和更明确的小结，整体说服力会更强。`;
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
              "你是技术博客编辑与内容审核助手。输出必须严格符合用户要求，除非明确要求，否则不要输出多余说明。",
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
  const prompt = `请检查下面这篇博客文章，并严格返回 JSON，字段必须完整：
{
  "typoIssues": "",
  "clarityIssues": "",
  "logicIssues": "",
  "knowledgeIssues": "",
  "formatIssues": "",
  "overallSuggestion": ""
}

要求：
1. 用中文回答。
2. 每个字段给出简明、可执行的建议。
3. 如果没有明显问题，也要给出客观评价，不要留空。

标题：${post.title}
摘要：${post.excerpt}
正文：${post.contentMarkdown}`;

  try {
    const content = await callExternalModel(prompt);
    if (!content) {
      return buildFallbackReview(post);
    }

    const parsed = JSON.parse(content);
    return {
      typoIssues: parsed.typoIssues || "未发现明显错别字。",
      clarityIssues: parsed.clarityIssues || "表达基本清楚。",
      logicIssues: parsed.logicIssues || "逻辑结构基本完整。",
      knowledgeIssues: parsed.knowledgeIssues || "知识性内容建议结合官方资料复核。",
      formatIssues: parsed.formatIssues || "格式整体正常。",
      overallSuggestion:
        parsed.overallSuggestion || "文章已经具备发布基础，建议发布前再做一次人工精修。",
      rawResponse: content,
    };
  } catch (_error) {
    return buildFallbackReview(post);
  }
}

async function generateOfficialComment(post) {
  const prompt = `请为下面这篇技术博客生成一条客观、克制、专业的官方评论。

要求：
1. 直接输出纯文本，不要加引号。
2. 点评文章的优点和不足。
3. 可以补充一句延伸思路，但不要过度夸赞。
4. 语气像博客站点的官方评论员。

标题：${post.title}
摘要：${post.excerpt}
正文：${post.contentMarkdown}`;

  try {
    const content = await callExternalModel(prompt);
    return content || buildFallbackOfficialComment(post);
  } catch (_error) {
    return buildFallbackOfficialComment(post);
  }
}

module.exports = { reviewPostContent, generateOfficialComment };
