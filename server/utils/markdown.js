const MarkdownIt = require("markdown-it");
const hljs = require("highlight.js");

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  highlight(code, language) {
    const normalizedLanguage = String(language || "").trim().toLowerCase();

    if (normalizedLanguage && hljs.getLanguage(normalizedLanguage)) {
      const highlighted = hljs.highlight(code, {
        language: normalizedLanguage,
        ignoreIllegals: true,
      }).value;
      return `<pre><code class="hljs language-${normalizedLanguage}">${highlighted}</code></pre>`;
    }

    const highlighted = hljs.highlightAuto(code).value;
    return `<pre><code class="hljs">${highlighted}</code></pre>`;
  },
});

function renderMarkdown(content) {
  return markdown.render(content || "");
}

module.exports = { renderMarkdown };
