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

type SaveState = "idle" | "saving";

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
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(
    initialPost?.status || "DRAFT"
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaveState("saving");
    setMessage("");

    try {
      const payload = {
        title,
        excerpt,
        coverImage,
        contentMarkdown,
        categoryId,
        tags: selectedTags,
        status,
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
    } finally {
      setSaveState("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        placeholder="文章摘要"
        className="min-h-[110px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
        required
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

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as "DRAFT" | "PUBLISHED")
          }
          className="rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
        >
          <option value="DRAFT">草稿</option>
          <option value="PUBLISHED">发布</option>
        </select>
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

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-[var(--color-text-faint)]">{message}</span>
        <button
          type="submit"
          disabled={saveState === "saving"}
          className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saveState === "saving"
            ? "保存中..."
            : mode === "create"
              ? "创建文章"
              : "保存修改"}
        </button>
      </div>
    </form>
  );
}
