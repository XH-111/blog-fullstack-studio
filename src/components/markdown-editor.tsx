"use client";

import { useMemo } from "react";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const toolbarActions = [
  { label: "H1", insert: "# 标题\n" },
  { label: "H2", insert: "## 小节标题\n" },
  { label: "列表", insert: "- 列表项一\n- 列表项二\n" },
  { label: "代码", insert: "```ts\nconsole.log('hello');\n```\n" },
  { label: "引用", insert: "> 一段引用\n" },
];

function simpleMarkdownPreview(markdown: string) {
  return markdown
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^\> (.*)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^\- (.*)$/gm, "<li>$1</li>")
    .replace(/\n/g, "<br />");
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const preview = useMemo(() => simpleMarkdownPreview(value), [value]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {toolbarActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => onChange(`${value}\n${action.insert}`)}
            className="rounded-full border border-[var(--color-line)] bg-white/78 px-3 py-1.5 text-xs text-[var(--color-text)]"
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[360px] rounded-[22px] border border-[var(--color-line)] bg-white/92 p-4 text-sm leading-7 text-[var(--color-ink)] outline-none"
          placeholder="在这里输入 Markdown 内容"
        />
        <div className="min-h-[360px] rounded-[22px] border border-[var(--color-line)] bg-white/92 p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[var(--color-text-faint)]">
            预览
          </p>
          <div
            className="prose prose-sm max-w-none text-[var(--color-text)]"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
      </div>
    </div>
  );
}
