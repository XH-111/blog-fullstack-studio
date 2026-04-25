"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiFetch,
  AboutHonorItem,
  AboutProfileRecord,
  SiteSettingsRecord,
} from "@/lib/api";
import { SurfaceCard } from "@/components/surface-card";
import { pastelChips } from "@/lib/theme";

const emptySettings: SiteSettingsRecord = {
  id: "site",
  siteTitle: "",
  heroTitle: "",
  heroDescription: "",
  heroImage: "",
  welcomeEyebrow: "欢迎光临",
  welcomeTitle: "",
  welcomeBody: "",
  welcomeTags: "",
  featuredTitle: "置顶文章",
  featuredDescription: "从知识库里挑选的最多三篇内容。",
  profileName: "",
  profileTagline: "",
  profileImage: "",
  updatedAt: new Date().toISOString(),
};

const emptyAbout: AboutProfileRecord = {
  id: "about",
  introTitle: "个人简介",
  introBody: "",
  skills: "",
  experiences: "",
  projects: "",
  honors: "[]",
  updatedAt: new Date().toISOString(),
};

function splitWelcomeTags(value: string) {
  return value
    .split(/[,，\n]/)
    .map((label) => label.trim())
    .filter(Boolean);
}

function parseHonors(value: string): AboutHonorItem[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item) => ({
      title: String(item?.title || ""),
      description: String(item?.description || ""),
      image: String(item?.image || ""),
    }));
  } catch (_error) {
    return [];
  }
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [token] = useState(
    () =>
      (typeof window !== "undefined" &&
        localStorage.getItem("blog_admin_token")) ||
      ""
  );
  const [form, setForm] = useState<SiteSettingsRecord>(emptySettings);
  const [aboutForm, setAboutForm] = useState<AboutProfileRecord>(emptyAbout);
  const [honors, setHonors] = useState<AboutHonorItem[]>([]);
  const [message, setMessage] = useState("");
  const [aboutMessage, setAboutMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAbout, setIsSavingAbout] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
      return;
    }

    Promise.all([
      apiFetch<SiteSettingsRecord>("/api/settings"),
      apiFetch<AboutProfileRecord>("/api/about"),
    ])
      .then(([settings, about]) => {
        setForm({ ...emptySettings, ...settings });
        setAboutForm({ ...emptyAbout, ...about });
        setHonors(parseHonors(about.honors));
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "加载设置失败");
      });
  }, [router, token]);

  async function readImageFile(file: File, onLoad: (value: string) => void) {
    if (!file.type.startsWith("image/")) {
      setMessage("请选择图片文件");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setMessage("单张图片请控制在 4MB 以内");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onLoad(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleProfileFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await readImageFile(file, (value) => {
      setForm((current) => ({ ...current, profileImage: value }));
      setMessage("本地头像已载入，保存设置后生效");
    });
  }

  async function handleHonorFileChange(
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await readImageFile(file, (value) => {
      setHonors((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, image: value } : item
        )
      );
      setAboutMessage("荣誉图片已载入，保存关于我后生效");
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const payload = {
        siteTitle: form.siteTitle,
        heroTitle: form.heroTitle,
        heroDescription: form.heroDescription,
        heroImage: form.heroImage,
        welcomeEyebrow: form.welcomeEyebrow,
        welcomeTitle: form.welcomeTitle,
        welcomeBody: form.welcomeBody,
        welcomeTags: form.welcomeTags,
        featuredTitle: form.featuredTitle,
        featuredDescription: form.featuredDescription,
        profileName: form.profileName,
        profileTagline: form.profileTagline,
        profileImage: form.profileImage,
      };

      const updated = await apiFetch<SiteSettingsRecord>("/api/settings", {
        method: "PUT",
        token,
        body: JSON.stringify(payload),
      });

      setForm({ ...emptySettings, ...updated });
      setMessage("站点设置已保存");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存站点设置失败");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAboutSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSavingAbout(true);
    setAboutMessage("");

    try {
      const updated = await apiFetch<AboutProfileRecord>("/api/about", {
        method: "PUT",
        token,
        body: JSON.stringify({
          introTitle: aboutForm.introTitle,
          introBody: aboutForm.introBody,
          skills: aboutForm.skills,
          experiences: aboutForm.experiences,
          projects: aboutForm.projects,
          honors: JSON.stringify(honors),
        }),
      });

      setAboutForm({ ...emptyAbout, ...updated });
      setHonors(parseHonors(updated.honors));
      setAboutMessage("关于我内容已保存");
    } catch (error) {
      setAboutMessage(error instanceof Error ? error.message : "保存关于我失败");
    } finally {
      setIsSavingAbout(false);
    }
  }

  const previewTags = splitWelcomeTags(form.welcomeTags);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-serif text-4xl text-[var(--color-ink)]">
          站点设置
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text)]">
          修改首页视觉、个人信息、欢迎卡片、置顶模块，以及关于我页面内容。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[var(--color-ink)]">
                站点信息
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-[var(--color-text)]">
                  <span>站点标题</span>
                  <input
                    value={form.siteTitle}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        siteTitle: event.target.value,
                      }))
                    }
                    className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm text-[var(--color-text)]">
                  <span>个人姓名</span>
                  <input
                    value={form.profileName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        profileName: event.target.value,
                      }))
                    }
                    className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm text-[var(--color-text)]">
                <span>个人一句话简介</span>
                <input
                  value={form.profileTagline}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      profileTagline: event.target.value,
                    }))
                  }
                  className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
                />
              </label>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[var(--color-ink)]">
                顶部主视觉
              </h2>
              <label className="space-y-2 text-sm text-[var(--color-text)]">
                <span>首页主标题</span>
                <input
                  value={form.heroTitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      heroTitle: event.target.value,
                    }))
                  }
                  className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-[var(--color-text)]">
                <span>首页描述</span>
                <textarea
                  value={form.heroDescription}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      heroDescription: event.target.value,
                    }))
                  }
                  className="min-h-[110px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-[var(--color-text)]">
                <span>首页背景图 URL</span>
                <input
                  value={form.heroImage || ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      heroImage: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
                />
              </label>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[var(--color-ink)]">
                首页欢迎卡片
              </h2>
              <label className="space-y-2 text-sm text-[var(--color-text)]">
                <span>小标题</span>
                <input
                  value={form.welcomeEyebrow}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      welcomeEyebrow: event.target.value,
                    }))
                  }
                  className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-[var(--color-text)]">
                <span>欢迎主标题</span>
                <input
                  value={form.welcomeTitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      welcomeTitle: event.target.value,
                    }))
                  }
                  className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-[var(--color-text)]">
                <span>欢迎正文</span>
                <textarea
                  value={form.welcomeBody}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      welcomeBody: event.target.value,
                    }))
                  }
                  className="min-h-[110px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-[var(--color-text)]">
                <span>标签列表</span>
                <textarea
                  value={form.welcomeTags}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      welcomeTags: event.target.value,
                    }))
                  }
                  placeholder="帅气, 天真, 可爱"
                  className="min-h-[88px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
                />
                <span className="block text-xs text-[var(--color-text-faint)]">
                  支持中文逗号、英文逗号或换行分隔。
                </span>
              </label>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[var(--color-ink)]">
                首页置顶模块
              </h2>
              <label className="space-y-2 text-sm text-[var(--color-text)]">
                <span>模块标题</span>
                <input
                  value={form.featuredTitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      featuredTitle: event.target.value,
                    }))
                  }
                  placeholder="主包精选"
                  className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-[var(--color-text)]">
                <span>模块说明</span>
                <textarea
                  value={form.featuredDescription}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      featuredDescription: event.target.value,
                    }))
                  }
                  placeholder="从知识库里挑选的最多三篇内容。"
                  className="min-h-[88px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
                />
              </label>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl text-[var(--color-ink)]">
                头像
              </h2>
              <div className="space-y-2 text-sm text-[var(--color-text)]">
                <span>个人头像</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleProfileFileChange(event)}
                  className="block w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                />
                <div className="flex gap-2">
                  <input
                    value={form.profileImage || ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        profileImage: event.target.value,
                      }))
                    }
                    placeholder="也可以直接粘贴头像 URL"
                    className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({ ...current, profileImage: "" }))
                    }
                    className="rounded-[18px] border border-[var(--color-line)] bg-white px-4 py-3 text-sm"
                  >
                    清空
                  </button>
                </div>
              </div>
            </section>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-[var(--color-text-faint)]">
                {message}
              </span>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? "保存中..." : "保存设置"}
              </button>
            </div>
          </form>
        </SurfaceCard>

        <SurfaceCard className="overflow-hidden">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
            预览
          </p>
          <div
            className="mt-4 rounded-[24px] bg-cover bg-center p-5"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(17, 33, 41, 0.26), rgba(17, 33, 41, 0.5)), url(${
                form.heroImage ||
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80"
              })`,
            }}
          >
            <div className="rounded-[24px] bg-white/78 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-white">
                  {form.profileImage ? (
                    <div
                      aria-label={form.profileName}
                      title={form.profileName}
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${form.profileImage})` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--color-accent-soft)] text-xl font-semibold text-[var(--color-accent)]">
                      {form.profileName.slice(0, 2) || "HX"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-serif text-2xl text-[var(--color-ink)]">
                    {form.siteTitle || "POETIZE"}
                  </p>
                  <p className="text-sm text-[var(--color-text)]">
                    {form.profileName || "何晨旭"}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[22px] bg-white/76 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  {form.welcomeEyebrow || "欢迎光临"}
                </p>
                <p className="mt-3 font-serif text-2xl leading-tight text-[var(--color-ink)]">
                  {form.welcomeTitle || "首页欢迎主标题"}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text)]">
                  {form.welcomeBody || "首页欢迎正文会显示在这里。"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {previewTags.map((label, index) => (
                    <span
                      key={`${label}-${index}`}
                      className="rounded-full px-3 py-1.5 text-xs text-[var(--color-ink)]"
                      style={{
                        backgroundColor:
                          pastelChips[index % pastelChips.length],
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[22px] bg-white/76 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Featured
                </p>
                <p className="mt-3 font-serif text-2xl text-[var(--color-ink)]">
                  {form.featuredTitle || "置顶文章"}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text)]">
                  {form.featuredDescription || "从知识库里挑选的最多三篇内容。"}
                </p>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <form onSubmit={handleAboutSubmit} className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
              About Page
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[var(--color-ink)]">
              关于我内容
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text)]">
              前台关于我页面有五个可跳转模块：个人简介、技能方向、个人经历、项目经历、荣誉照片墙。
            </p>
          </div>

          <section className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-[var(--color-text)]">
              <span>个人简介标题</span>
              <input
                value={aboutForm.introTitle}
                onChange={(event) =>
                  setAboutForm((current) => ({
                    ...current,
                    introTitle: event.target.value,
                  }))
                }
                className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              />
            </label>

            <label className="space-y-2 text-sm text-[var(--color-text)]">
              <span>技能栈 / 关注方向</span>
              <textarea
                value={aboutForm.skills}
                onChange={(event) =>
                  setAboutForm((current) => ({
                    ...current,
                    skills: event.target.value,
                  }))
                }
                placeholder="每行一个，例如：Java"
                className="min-h-[120px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              />
            </label>
          </section>

          <label className="block space-y-2 text-sm text-[var(--color-text)]">
            <span>个人简介正文</span>
            <textarea
              value={aboutForm.introBody}
              onChange={(event) =>
                setAboutForm((current) => ({
                  ...current,
                  introBody: event.target.value,
                }))
              }
              placeholder="支持换行，每段会在前台自然分段。"
              className="min-h-[150px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-[var(--color-text)]">
              <span>个人经历</span>
              <textarea
                value={aboutForm.experiences}
                onChange={(event) =>
                  setAboutForm((current) => ({
                    ...current,
                    experiences: event.target.value,
                  }))
                }
                placeholder="格式：时间｜内容，每行一条"
                className="min-h-[150px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              />
            </label>

            <label className="space-y-2 text-sm text-[var(--color-text)]">
              <span>项目经历</span>
              <textarea
                value={aboutForm.projects}
                onChange={(event) =>
                  setAboutForm((current) => ({
                    ...current,
                    projects: event.target.value,
                  }))
                }
                placeholder="格式：项目名｜说明｜技术栈｜链接，每行一条"
                className="min-h-[150px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 outline-none"
              />
            </label>
          </div>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl text-[var(--color-ink)]">
                  荣誉照片墙
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text)]">
                  可以添加证书、奖项或成长记录，支持本地选择图片。
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setHonors((current) => [
                    ...current,
                    { title: "", description: "", image: "" },
                  ])
                }
                className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                添加照片
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {honors.map((honor, index) => (
                <div
                  key={index}
                  className="rounded-[24px] border border-[var(--color-line)] bg-white/72 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      照片 {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setHonors((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                      className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs text-[var(--color-text)]"
                    >
                      删除
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <input
                      value={honor.title}
                      onChange={(event) =>
                        setHonors((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, title: event.target.value }
                              : item
                          )
                        )
                      }
                      placeholder="标题"
                      className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm outline-none"
                    />
                    <textarea
                      value={honor.description}
                      onChange={(event) =>
                        setHonors((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, description: event.target.value }
                              : item
                          )
                        )
                      }
                      placeholder="说明"
                      className="min-h-[88px] w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm outline-none"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        void handleHonorFileChange(index, event)
                      }
                      className="block w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-accent)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    />
                    <input
                      value={honor.image}
                      onChange={(event) =>
                        setHonors((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, image: event.target.value }
                              : item
                          )
                        )
                      }
                      placeholder="图片 URL 或本地图片数据"
                      className="w-full rounded-[18px] border border-[var(--color-line)] bg-white/92 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-[var(--color-text-faint)]">
              {aboutMessage}
            </span>
            <button
              type="submit"
              disabled={isSavingAbout}
              className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSavingAbout ? "保存中..." : "保存关于我"}
            </button>
          </div>
        </form>
      </SurfaceCard>
    </main>
  );
}
