const slugify = require("slugify");

function fallbackSlug(input) {
  return Array.from(input)
    .map((char) => {
      if (/[a-z0-9]/i.test(char)) {
        return char.toLowerCase();
      }

      const codePoint = char.codePointAt(0);
      return codePoint ? `u${codePoint.toString(36)}` : "";
    })
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function toSlug(value) {
  const input = String(value || "").trim();
  const slug = slugify(input, {
    lower: true,
    strict: true,
    locale: "zh",
    trim: true,
  });

  if (slug) {
    return slug;
  }

  return fallbackSlug(input) || `entry-${Date.now().toString(36)}`;
}

module.exports = { toSlug };
