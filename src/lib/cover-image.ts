export const defaultCoverImage = "/images/default-cover.svg";

const legacyDefaultCoverTokens = [
  "photo-1498050108023-c5249f4df085",
  "photo-1515879218367-8466d910aaa4",
  "photo-1516321318423-f06f85e504b3",
];

export function isLegacyDefaultCover(value?: string | null) {
  if (!value) {
    return false;
  }

  return legacyDefaultCoverTokens.some((token) => value.includes(token));
}

export function resolveCoverImage(value?: string | null) {
  if (!value || isLegacyDefaultCover(value)) {
    return defaultCoverImage;
  }

  return value;
}

export function getEditableCoverImage(value?: string | null) {
  return isLegacyDefaultCover(value) ? "" : value || "";
}
