"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { JSONContent } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { apiFetch, CategoryRecord, PostRecord, TagRecord } from "@/lib/api";
import { defaultCoverImage, getEditableCoverImage } from "@/lib/cover-image";
import { RichTextEditor } from "@/components/rich-text-editor";

type AdminPostFormProps = {
  token: string;
  mode: "create" | "edit";
  initialPost?: PostRecord | null;
};

type SaveState = "idle" | "saving-draft" | "saving-published";

export function AdminPostForm({ token, mode, initialPost }: AdminPostFormProps) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [title, setTitle] = useState(initialPost?.title || "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [coverImage, setCoverImage] = useState(getEditableCoverImage(initialPost?.coverImage));
  const [contentJson, setContentJson] = useState<string | null>(
    initialPost?.contentJson || null
  );
  const [contentHtml, setContentHtml] = useState(initialPost?.contentHtml || "");
  const [contentText, setContentText] = useState(
    initialPost?.contentText || initialPost?.contentMarkdown || ""
  );
  const [categoryId, setCategoryId] = useState<number>(initialPost?.category.id || 0);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialPost?.tags.map((tag) => tag.name) || []
  );
  const [tagSelectId, setTagSelectId] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [generateAiComment, setGenerateAiComment] = useState(
    Boolean(initialPost?.aiOfficialComment)
  );
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");

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

  useEffect(() => {
    let alive = true;

    Promise.all([
      apiFetch<CategoryRecord[]>("/api/categories"),
      apiFetch<TagRecord[]>("/api/tags"),
    ])
      .then(([categoryList, tagList]) => {
        if (!alive) {
          return;
        }
        setCategories(categoryList);
        setTags(tagList);

        if (!initialPost?.category.id && categoryList[0]) {
          setCategoryId(categoryList[0].id);
        }
      })
      .catch((error) => {
        if (alive) {
          setMessage(error instanceof Error ? error.message : "元数据加载失败");
        }
      });

    return () => {
      alive = false;
    };
  }, [initialPost?.category.id]);

  const isPublished = initialPost?.status === "PUBLISHED";
  const selectedTagRecord = tags.find((tag) => String(tag.id) === tagSelectId);

  const handleEditorChange = useCallback(
    (value: { json: JSONContent | null; html: string; text: string }) => {
      setContentJson(value.json ? JSON.stringify(value.json) : null);
      setContentHtml(value.html);
      setContentText(value.text);
    },
    []
  );

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCoverImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function addSelectedTag(name: string) {
    const normalizedName = name.trim();
    if (!normalizedName || selectedTags.includes(normalizedName)) {
      return;
    }
    setSelectedTags((current) => [...current, normalizedName]);
  }

  async function handleAddExistingTag() {
    if (!selectedTagRecord) {
      return;
    }
    addSelectedTag(selectedTagRecord.name);
    setTagSelectId("");
  }

  async function handleCreateTag(event: FormEvent) {
    event.preventDefault();
    const normalizedName = newTagName.trim();
    if (!normalizedName) {
      return;
    }

    try {
      const existed = tags.find((tag) => tag.name === normalizedName);
      if (!existed) {
        await apiFetch<TagRecord>("/api/tags", {
          method: "POST",
          token,
          body: JSON.stringify({ name: normalizedName }),
        });
        await loadMeta();
      }
      addSelectedTag(normalizedName);
      setNewTagName("");
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建标签失败");
    }
  }

  async function handleDeleteSelectedGlobalTag() {
    if (!selectedTagRecord) {
      return;
    }

    if (!window.confirm(`删除标签「${selectedTagRecord.name}」？已被文章使用的标签不会被删除。`)) {
      return;
    }

    try {
      await apiFetch(`/api/tags/${selectedTagRecord.id}`, {
        method: "DELETE",
        token,
      });
      setSelectedTags((current) => current.filter((name) => name !== selectedTagRecord.name));
      setTagSelectId("");
      await loadMeta();
      setMessage("标签已删除");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除标签失败");
    }
  }

  async function handleSubmit(nextStatus: "DRAFT" | "PUBLISHED") {
    setSaveState(nextStatus === "PUBLISHED" ? "saving-published" : "saving-draft");
    setMessage("");

    try {
      const payload = {
        title,
        excerpt,
        coverImage,
        contentJson,
        contentHtml,
        contentText,
        contentMarkdown: contentText,
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
    <div className="min-h-screen bg-[#dfe3e8]">
      <div className="min-h-screen px-4 py-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <div className="flex items-center justify-between gap-4 rounded-[10px] border border-[#d6d9de] bg-[#f8f9fb] px-4 py-3 shadow-sm">
            <Link
              href="/admin"
              className="rounded-[6px] border border-[#cfd4dc] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)]"
            >
              返回后台
            </Link>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Word Style Editor
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="overflow-hidden rounded-[10px] border border-[#d6d9de] bg-[#eef0f3] shadow-[0_18px_55px_rgba(15,23,42,0.12)]">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="文章大标题..."
                className="w-full border-b border-[#d6d9de] bg-white px-8 py-6 font-serif text-4xl font-semibold leading-tight text-[var(--color-ink)] outline-none placeholder:text-[#a0a7b2]"
                required
              />
              <RichTextEditor
                initialJson={initialPost?.contentJson}
                initialHtml={initialPost?.contentHtml}
                onChange={handleEditorChange}
              />
            </section>

            <aside className="h-fit rounded-[10px] border border-[#d6d9de] bg-[#f8f9fb] p-5 shadow-[0_18px_55px_rgba(15,23,42,0.10)] lg:sticky lg:top-24">
              <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent)]">
                Document
              </p>
              <h2 className="mt-2 font-serif text-2xl text-[var(--color-ink)]">文档属性</h2>

              <div className="mt-6 space-y-5">
                <section className="space-y-2 text-sm text-[var(--color-text)]">
                  <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                    Cover Image
                  </span>
                  <button
                    type="button"
                    data-testid="cover-picker"
                    onClick={() => coverInputRef.current?.click()}
                    className="block aspect-[16/9] w-full rounded-[8px] border border-[#d6d9de] bg-white bg-cover bg-center text-left"
                    style={{ backgroundImage: `url(${coverImage || defaultCoverImage})` }}
                    aria-label="选择封面图"
                  />
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="absolute -left-[9999px] h-px w-px opacity-0 pointer-events-none"
                    onChange={handleCoverChange}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="rounded-[6px] bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white"
                    >
                      选择封面
                    </button>
                    {coverImage && (
                      <button
                        type="button"
                        onClick={() => setCoverImage("")}
                        className="rounded-[6px] border border-[#cfd4dc] bg-white px-4 py-2 text-xs text-[var(--color-text)]"
                      >
                        使用默认
                      </button>
                    )}
                  </div>
                </section>

                <label className="block space-y-2 text-sm text-[var(--color-text)]">
                  <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                    Category
                  </span>
                  <select
                    value={categoryId}
                    onChange={(event) => setCategoryId(Number(event.target.value))}
                    className="w-full rounded-[6px] border border-[#cfd4dc] bg-white px-4 py-3 text-sm outline-none"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <section className="space-y-3 text-sm text-[var(--color-text)]">
                  <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                    Relevant Tags
                  </span>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
                    <select
                      data-testid="tag-select"
                      value={tagSelectId}
                      onChange={(event) => setTagSelectId(event.target.value)}
                      className="min-w-0 rounded-[6px] border border-[#cfd4dc] bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option value="">选择已有标签</option>
                      {tags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      data-testid="tag-add"
                      onClick={() => void handleAddExistingTag()}
                      disabled={!selectedTagRecord}
                      className="rounded-[6px] bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-45"
                    >
                      加入
                    </button>
                    <button
                      type="button"
                      data-testid="tag-delete-global"
                      onClick={() => void handleDeleteSelectedGlobalTag()}
                      disabled={!selectedTagRecord}
                      className="rounded-[6px] border border-[#cfd4dc] bg-white px-3 py-2 text-xs text-[var(--color-text)] disabled:opacity-45"
                    >
                      删除
                    </button>
                  </div>
                  <form onSubmit={handleCreateTag} className="flex gap-2">
                    <input
                      data-testid="tag-input"
                      value={newTagName}
                      onChange={(event) => setNewTagName(event.target.value)}
                      placeholder="输入新标签后回车"
                      className="min-w-0 flex-1 rounded-[6px] border border-[#cfd4dc] bg-white px-3 py-2 text-sm outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-[6px] border border-[#cfd4dc] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-ink)]"
                    >
                      新建
                    </button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tagName) => (
                      <button
                        key={tagName}
                        type="button"
                        onClick={() =>
                          setSelectedTags((current) =>
                            current.filter((name) => name !== tagName)
                          )
                        }
                        className="rounded-[6px] border border-[#cfd4dc] bg-white px-3 py-1 text-xs text-[var(--color-text)]"
                      >
                        {tagName} ×
                      </button>
                    ))}
                  </div>
                </section>

                <label className="block space-y-2 text-sm text-[var(--color-text)]">
                  <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
                    Description
                  </span>
                  <textarea
                    value={excerpt}
                    onChange={(event) => setExcerpt(event.target.value)}
                    placeholder="可留空，保存时会自动生成摘要"
                    className="min-h-[130px] w-full rounded-[6px] border border-[#cfd4dc] bg-white px-4 py-3 text-sm leading-7 outline-none"
                  />
                </label>

                <label className="flex items-center justify-between gap-4 rounded-[6px] border border-[#cfd4dc] bg-white px-4 py-3 text-sm text-[var(--color-text)]">
                  <span>生成 AI 正确性评论</span>
                  <input
                    type="checkbox"
                    checked={generateAiComment}
                    onChange={(event) => setGenerateAiComment(event.target.checked)}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => void handleSubmit("PUBLISHED")}
                  disabled={saveState !== "idle"}
                  className="rounded-[6px] bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(73,132,140,0.20)] disabled:opacity-60"
                >
                  {saveState === "saving-published"
                    ? "发布中..."
                    : mode === "create"
                      ? "正式发布"
                      : "保存并发布"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmit("DRAFT")}
                  disabled={saveState !== "idle"}
                  className="rounded-[6px] border border-[#cfd4dc] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-60"
                >
                  {saveState === "saving-draft"
                    ? "保存草稿中..."
                    : isPublished
                      ? "撤回为草稿"
                      : "保存草稿"}
                </button>
              </div>

              <p className="mt-4 min-h-5 text-sm text-[var(--color-text-faint)]">{message}</p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
