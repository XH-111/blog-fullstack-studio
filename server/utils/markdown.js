const MarkdownIt = require("markdown-it");

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

function renderMarkdown(content) {
  return markdown.render(content || "");
}

module.exports = { renderMarkdown };
