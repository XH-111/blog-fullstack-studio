"use client";

const ADMIN_TOKEN_KEY = "blog_admin_token";

export function getStoredAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function setStoredAdminToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearStoredAdminToken() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
