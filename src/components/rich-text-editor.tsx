"use client";

import { Extension } from "@tiptap/core";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import {
  EditorContent,
  JSONContent,
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type RichTextValue = {
  json: JSONContent | null;
  html: string;
  text: string;
};

type RichTextEditorProps = {
  initialJson?: string | null;
  initialHtml?: string | null;
  onChange: (value: RichTextValue) => void;
};

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  onRun: () => void;
};

const swatches = ["#111827", "#2563eb", "#7c3aed", "#dc2626", "#16a34a"];
const fontSizes = ["14px", "16px", "18px", "20px", "24px", "28px", "32px"];
const imageWidthPresets = [320, 480, 640, 800];

const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }

              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

function ResizableImage({ node, selected, updateAttributes }: NodeViewProps) {
  const startRef = useRef({ x: 0, width: 0 });
  const style = String(node.attrs.style || "");
  const widthMatch = style.match(/width:\s*(\d+)px/);
  const width = widthMatch ? Number(widthMatch[1]) : 640;

  function startResize(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    startRef.current = { x: event.clientX, width };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function resize(event: React.PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    const delta = event.clientX - startRef.current.x;
    const nextWidth = Math.max(160, Math.min(1100, startRef.current.width + delta));
    updateAttributes({ style: `width: ${Math.round(nextWidth)}px;` });
  }

  function endResize(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <NodeViewWrapper className="my-6 flex justify-center">
      <span
        className={`group relative inline-block max-w-full rounded-[8px] ${
          selected ? "ring-2 ring-[var(--color-accent)] ring-offset-4" : ""
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          title={node.attrs.title || ""}
          className="block h-auto max-w-full rounded-[8px]"
          style={{ width }}
          draggable={false}
        />
        <button
            type="button"
            aria-label="拖拽调整图片宽度"
            onPointerDown={startResize}
            onPointerMove={resize}
            onPointerUp={endResize}
          className={`absolute -bottom-3 -right-3 h-6 w-6 cursor-ew-resize rounded-full border-2 border-white bg-[var(--color-accent)] shadow-lg transition ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
          }`}
        />
      </span>
    </NodeViewWrapper>
  );
}

const RichImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) => {
          if (!attributes.style) {
            return {};
          }

          return { style: attributes.style };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImage);
  },
});

function parseInitialJson(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as JSONContent;
  } catch {
    return null;
  }
}

function ToolbarButton({ label, active = false, onRun }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();
        onRun();
      }}
      className={`h-9 rounded-[6px] px-3 text-xs font-semibold transition ${
        active
          ? "bg-[#dbeafe] text-[#1d4ed8]"
          : "bg-white text-[var(--color-text)] hover:bg-[#f1f5f9]"
      }`}
    >
      {label}
    </button>
  );
}

export function RichTextEditor({
  initialJson,
  initialHtml,
  onChange,
}: RichTextEditorProps) {
  const [imageWidth, setImageWidth] = useState("640");
  const parsedJson = useMemo(() => parseInitialJson(initialJson), [initialJson]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      RichImage.configure({
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: "开始写正文，支持粘贴图片、插入链接、编号、字号和颜色。",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      FontSize,
      Color,
    ],
    content: parsedJson || initialHtml || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[840px] max-w-none px-16 py-14 text-[16px] leading-8 text-[var(--color-ink)] outline-none prose prose-slate prose-ol:list-decimal prose-ol:pl-7 prose-li:pl-1 prose-li:my-1",
      },
      handlePaste(view, event) {
        const item = Array.from(event.clipboardData?.items || []).find((entry) =>
          entry.type.startsWith("image/")
        );

        if (!item) {
          return false;
        }

        const file = item.getAsFile();
        if (!file) {
          return false;
        }

        event.preventDefault();
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            const { schema } = view.state;
            const node = schema.nodes.image.create({
              src: reader.result,
              alt: "文章配图",
              style: "width: 640px;",
            });
            view.dispatch(view.state.tr.replaceSelectionWith(node));
          }
        };
        reader.readAsDataURL(file);
        return true;
      },
    },
    onUpdate({ editor: current }) {
      onChange({
        json: current.getJSON(),
        html: current.getHTML(),
        text: current.getText({ blockSeparator: "\n" }),
      });
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    onChange({
      json: editor.getJSON(),
      html: editor.getHTML(),
      text: editor.getText({ blockSeparator: "\n" }),
    });
  }, [editor, onChange]);

  function insertImage(src: string) {
    if (!src || !editor) {
      return;
    }

    editor
      .chain()
      .focus()
      .setImage({ src, alt: "文章配图" })
      .updateAttributes("image", { style: "width: 640px;" })
      .run();
  }

  function applyImageWidth(width: number) {
    if (!editor) {
      return;
    }

    const nextWidth = Math.max(80, Math.min(1600, Math.round(width)));
    setImageWidth(String(nextWidth));
    editor.chain().focus().updateAttributes("image", { style: `width: ${nextWidth}px;` }).run();
  }

  function handleImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        insertImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  if (!editor) {
    return (
      <div className="min-h-[560px] rounded-[12px] border border-[#d7d7d7] bg-white p-8 text-sm text-[var(--color-text-faint)]">
        编辑器加载中...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#d6d9de] bg-[#eef0f3] shadow-[0_18px_55px_rgba(15,23,42,0.12)]">
      <div className="sticky top-0 z-10 border-b border-[#d6d9de] bg-[#f8f9fb] px-4 py-3">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <select
            defaultValue="16px"
            onChange={(event) => editor.chain().focus().setFontSize(event.target.value).run()}
            className="h-9 rounded-[6px] border border-[#cfd4dc] bg-white px-3 text-sm text-[var(--color-ink)] outline-none"
          >
            {fontSizes.map((size) => (
              <option key={size} value={size}>
                {size.replace("px", "")}
              </option>
            ))}
          </select>

          <label className="flex h-9 items-center gap-2 rounded-[6px] border border-[#cfd4dc] bg-white px-3 text-sm text-[var(--color-text)]">
            字色
            <input
              type="color"
              defaultValue="#111827"
              onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
              className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>

          <label className="flex h-9 items-center gap-2 rounded-[6px] border border-[#cfd4dc] bg-white px-3 text-sm text-[var(--color-text)]">
            标记
            <input
              type="color"
              defaultValue="#fff1a8"
              onChange={(event) =>
                editor.chain().focus().toggleHighlight({ color: event.target.value }).run()
              }
              className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: "B", active: editor.isActive("bold"), action: () => editor.chain().focus().toggleBold().run() },
            { label: "I", active: editor.isActive("italic"), action: () => editor.chain().focus().toggleItalic().run() },
            { label: "U", active: editor.isActive("underline"), action: () => editor.chain().focus().toggleUnderline().run() },
            { label: "S", active: editor.isActive("strike"), action: () => editor.chain().focus().toggleStrike().run() },
            { label: "编号", active: editor.isActive("orderedList"), action: () => editor.chain().focus().toggleOrderedList().run() },
          ].map((item) => (
            <ToolbarButton
              key={item.label}
              label={item.label}
              active={item.active}
              onRun={item.action}
            />
          ))}

          <span className="mx-1 h-6 w-px bg-[var(--color-line)]" />

          {[
            { label: "左", action: () => editor.chain().focus().setTextAlign("left").run() },
            { label: "中", action: () => editor.chain().focus().setTextAlign("center").run() },
            { label: "右", action: () => editor.chain().focus().setTextAlign("right").run() },
          ].map((item) => (
            <ToolbarButton key={item.label} label={item.label} onRun={item.action} />
          ))}

          <span className="mx-1 h-6 w-px bg-[var(--color-line)]" />

          {swatches.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`文字颜色 ${color}`}
              onMouseDown={(event) => {
                event.preventDefault();
                editor.chain().focus().setColor(color).run();
              }}
              className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: color }}
            />
          ))}

          <ToolbarButton
            label="高亮"
            active={editor.isActive("highlight")}
            onRun={() => editor.chain().focus().toggleHighlight({ color: "#fff1a8" }).run()}
          />
          <ToolbarButton label="撤销" onRun={() => editor.chain().focus().undo().run()} />
        </div>
      </div>

      <input
        ref={imageInputRef}
        id="post-image-input"
        type="file"
        accept="image/*"
        className="absolute -left-[9999px] h-px w-px opacity-0 pointer-events-none"
        onChange={handleImageInputChange}
      />

      <div className="flex flex-wrap items-center gap-3 border-b border-[#d6d9de] bg-[#f8f9fb] px-5 py-4">
        <label
          htmlFor="post-image-input"
          className="cursor-pointer rounded-[6px] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          插入图片
        </label>
        <label className="flex h-10 items-center gap-2 rounded-[6px] border border-[#cfd4dc] bg-white px-3 text-sm text-[var(--color-text)]">
          图片大小
          <input
            list="image-width-presets"
            inputMode="numeric"
            value={imageWidth}
            onChange={(event) => setImageWidth(event.target.value.replace(/\D/g, ""))}
            onBlur={() => {
              const width = Number(imageWidth) || 640;
              applyImageWidth(width);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyImageWidth(Number(imageWidth) || 640);
              }
            }}
            className="h-8 w-24 rounded-[6px] border border-[#cfd4dc] bg-[#f8f9fb] px-2 text-sm text-[var(--color-ink)] outline-none"
          />
          <span className="text-xs text-[var(--color-text-faint)]">px</span>
          <datalist id="image-width-presets">
            {imageWidthPresets.map((width) => (
              <option key={width} value={width} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="overflow-auto bg-[#dfe3e8] px-4 py-8">
        <div className="mx-auto min-h-[960px] w-full max-w-[860px] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.18)]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
