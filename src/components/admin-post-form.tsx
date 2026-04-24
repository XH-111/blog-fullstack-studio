"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, CategoryRecord, PostRecord, TagRecord } from "@/lib/api";
import { MarkdownEditor } from "@/components/markdown-editor";

type AdminPostFormProps = {
  token: string;
  mode: "create" | "edit";
  initialPost?: PostRecord | null;
};

type SaveState = "idle" | "saving-draft" | "saving-published";

export function AdminPostForm({
  token,
  mode,
  initialPost,
}: AdminPostFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [title, setTitle] = useState(initialPost?.title || "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage || "");
  const [contentMarkdown, setContentMarkdown] = useState(
    initialPost?.contentMarkdown || ""
  );
  const [categoryId, setCategoryId] = useState<number>(
    initialPost?.category.id || 0
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialPost?.tags.map((tag) => tag.name) || []
  );
  const [generateAiComment, setGenerateAiComment] = useState(
    Boolean(initialPost?.aiOfficialComment)
  );
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    async function loadMeta() {
      const [categoryList, tagList] = await Promise.all([
        apiFetch<CategoryRecord[]>("/api/categories"),
        apiFetch<TagRecord[]>("/api/tags"),
      ]);
      setCategories(categoryList);
      setTags(tagList);

      if (!initialPost?.category.id && categoryList[0]) {
        setCategoryId(categoryList[0].id);
      }
    }

    loadMeta().catch((error) => {
      setMessage(error instanceof Error ? error.message : "元数据加载失败");
    });
  }, [initialPost?.category.id]);

  const tagInput = useMemo(() => selectedTags.join(", "), [selectedTags]);
  const isPublished = initialPost?.status === "PUBLISHED";

  async function handleSubmit(nextStatus: "DRAFT" | "PUBLISHED") {
    setSaveState(nextStatus === "PUBLISHED" ? "saving-published" : "saving-draft");
    setMessage("");

    try {
      const payload = {
        title,
        excerpt,
        coverImage,
        contentMarkdown,
        categoryId,
        tags: selectedTags,
        status: nextStatus,
        generateAiComment,
      };

      if (mode === "create") {
        await apiFetch<PostRecord>("/api/posts", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
      } else if (initialPost) {
        await apiFetch<PostRecord>(`/api/posts/${initialPost.id}`, {
          method: "PUT",
          token,
          body: JSON.stringify(payload),
        });
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
      setSaveState("idle");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="文章标题"
          className="rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
          required
        />
        <input
          value={coverImage}
          onChange={(event) => setCoverImage(event.target.value)}
          placeholder="封面图 URL（可选）"
          className="rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
        />
      </div>

      <textarea
        value={excerpt}
        onChange={(event) => setExcerpt(event.target.value)}
        placeholder="文章摘要（可留空，发布时会由 AI 自动补充）"
        className="min-h-[110px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(Number(event.target.value))}
          className="rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <input
          value={tagInput}
          onChange={(event) =>
            setSelectedTags(
              event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            )
          }
          placeholder="标签，多个用逗号分隔"
          className="rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
        />

        <label className="flex items-center justify-between rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm text-[var(--color-text)]">
          <span>生成 AI 正确性评论</span>
          <input
            type="checkbox"
            checked={generateAiComment}
            onChange={(event) => setGenerateAiComment(event.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
        </label>
      </div>

      <div className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-panel-soft)] p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[var(--color-text-faint)]">
          可选已有标签
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                if (!selectedTags.includes(tag.name)) {
                  setSelectedTags([...selectedTags, tag.name]);
                }
              }}
              className="rounded-full border border-[var(--color-line)] bg-white/82 px-3 py-1 text-xs text-[var(--color-text)]"
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <MarkdownEditor value={contentMarkdown} onChange={setContentMarkdown} />

      <div className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-panel-soft)] p-4">
        <p className="text-sm leading-7 text-[var(--color-text)]">
          AI 审核会在每次保存时自动刷新。AI 评论现在是可选项，只会从内容正确性角度给出一条简短评论。
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-sm text-[var(--color-text-faint)]">{message}</span>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleSubmit("DRAFT")}
            disabled={saveState !== "idle"}
            className="rounded-full border border-[var(--color-line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-60"
          >
            {saveState === "saving-draft"
              ? "保存草稿中..."
              : isPublished
                ? "撤回为草稿"
                : "保存为草稿"}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit("PUBLISHED")}
            disabled={saveState !== "idle"}
            className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saveState === "saving-published"
              ? "发布中..."
              : mode === "create"
                ? "发布文章"
                : "保存并发布"}
          </button>
        </div>
      </div>
    </div>
  );
}
