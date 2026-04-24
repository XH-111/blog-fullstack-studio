const path = require("path");

function getEnv(name, fallback = "") {
  return process.env[name] || fallback;
}

module.exports = {
  port: Number(getEnv("API_PORT", "4000")),
  jwtSecret: getEnv("JWT_SECRET", "dev-jwt-secret"),
  openAiApiKey: getEnv("OPENAI_API_KEY", ""),
  openAiBaseUrl: getEnv("OPENAI_BASE_URL", ""),
  openAiModel: getEnv("OPENAI_MODEL", ""),
  databaseUrl: getEnv("DATABASE_URL", `file:${path.join(process.cwd(), "prisma", "dev.db")}`),
};
