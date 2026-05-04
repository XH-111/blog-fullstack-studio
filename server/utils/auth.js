const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

function signAdminToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

function requireAdmin(req, res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: "未登录或登录已过期" });
  }

  try {
    const payload = verifyAdminToken(token);
    req.admin = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "登录凭证无效" });
  }
}

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
}

function verifyAdminToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = { signAdminToken, requireAdmin, extractBearerToken, verifyAdminToken };
