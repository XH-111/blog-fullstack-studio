require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { port } = require("./config");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");
const categoryRoutes = require("./routes/categories");
const tagRoutes = require("./routes/tags");
const dashboardRoutes = require("./routes/dashboard");
const settingsRoutes = require("./routes/settings");
const guestbookRoutes = require("./routes/guestbook");
const homeReactionRoutes = require("./routes/home-reactions");
const aboutRoutes = require("./routes/about");
const uploadRoutes = require("./routes/uploads");

const app = express();

app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));
// ???? base64 ?? JSON ???????????????
app.use(express.json({ limit: "80mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/guestbook", guestbookRoutes);
app.use("/api/home-reactions", homeReactionRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/uploads", uploadRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "服务器内部错误" });
});

app.listen(port, () => {
  console.log(`API server listening on http://127.0.0.1:${port}`);
});
