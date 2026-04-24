"use client";

import { useMemo, useRef, useState } from "react";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const toolbarActions = [
  { label: "H1", insert: "# 标题\n" },
  { label: "H2", insert: "## 小节标题\n" },
  { label: "列表", insert: "- 列表项一\n- 列表项二\n" },
  { label: "代码", insert: "```java\nSystem.out.println(\"hello\");\n```\n" },
  { label: "引用", insert: "> 一段引用\n" },
];

const defaultImageWidth = 640;

function simpleMarkdownPreview(markdown: string) {
  return markdown
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^!\[(.*)\]\((.*)\)$/gm, '<p><img alt="$1" src="$2" /></p>')
    .replace(/^\- (.*)$/gm, "<li>$1</li>")
    .replace(/\n/g, "<br />");
}

function buildImageTag(src: string, width: number, alt = "文章配图") {
  return `<img src="${src}" alt="${alt}" width="${width}" />\n`;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("文章配图");
  const [imageWidth, setImageWidth] = useState(defaultImageWidth);
  const preview = useMemo(() => simpleMarkdownPreview(value), [value]);

  function appendBlock(block: string) {
    onChange(`${value}${value.endsWith("\n") || value.length === 0 ? "" : "\n"}${block}`);
  }

  function replaceAroundSelection(replacer: (current: string, cursor: number) => string) {
    const textarea = textareaRef.current;
    const cursor = textarea?.selectionStart ?? value.length;
    onChange(replacer(value, cursor));
  }

  function insertImageTag(src: string) {
    if (!src.trim()) {
      return;
    }

    appendBlock(buildImageTag(src.trim(), imageWidth, imageAlt.trim() || "文章配图"));
    setImageUrl("");
  }

  async function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const item = Array.from(event.clipboardData.items).find((entry) =>
      entry.type.startsWith("image/")
    );

    if (!item) {
      return;
    }

    event.preventDefault();
    const file = item.getAsFile();
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        insertImageTag(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function applyWidthToCurrentImage(nextWidth: number) {
    replaceAroundSelection((current, cursor) => {
      const start = current.lastIndexOf("<img", cursor);
      const end = current.indexOf(">", cursor);

      if (start === -1 || end === -1 || end < start) {
        return current;
      }

      const tag = current.slice(start, end + 1);
      const updatedTag = /width="\d+"/.test(tag)
        ? tag.replace(/width="\d+"/, `width="${nextWidth}"`)
        : tag.replace(/\/?>$/, ` width="${nextWidth}" />`);

      return `${current.slice(0, start)}${updatedTag}${current.slice(end + 1)}`;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {toolbarActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => appendBlock(action.insert)}
            className="rounded-full border border-[var(--color-line)] bg-white/78 px-3 py-1.5 text-xs text-[var(--color-text)]"
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 rounded-[22px] border border-[var(--color-line)] bg-[var(--color-panel-soft)] p-4 lg:grid-cols-[minmax(0,1fr)_150px_120px_120px]">
        <input
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="图片 URL，或直接在正文中 Ctrl+V 粘贴图片"
          className="rounded-[16px] border border-[var(--color-line)] bg-white px-4 py-3 text-sm outline-none"
        />
        <input
          value={imageAlt}
          onChange={(event) => setImageAlt(event.target.value)}
          placeholder="图片描述"
          className="rounded-[16px] border border-[var(--color-line)] bg-white px-4 py-3 text-sm outline-none"
        />
        <input
          type="number"
          min={120}
          max={1600}
          step={20}
          value={imageWidth}
          onChange={(event) => setImageWidth(Number(event.target.value) || defaultImageWidth)}
          className="rounded-[16px] border border-[var(--color-line)] bg-white px-4 py-3 text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => insertImageTag(imageUrl)}
          className="rounded-[16px] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white"
        >
          插入图片
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-faint)]">
        <span>光标放在图片标签里后可快速改宽度：</span>
        {[320, 480, 640, 800].map((width) => (
          <button
            key={width}
            type="button"
            onClick={() => {
              setImageWidth(width);
              applyWidthToCurrentImage(width);
            }}
            className="rounded-full border border-[var(--color-line)] bg-white/78 px-3 py-1"
          >
            {width}px
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onPaste={(event) => void handlePaste(event)}
          className="min-h-[360px] rounded-[22px] border border-[var(--color-line)] bg-white/92 p-4 text-sm leading-7 text-[var(--color-ink)] outline-none"
          placeholder="在这里输入 Markdown 内容。支持直接粘贴图片，插入后可通过 width 调整大小。"
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
