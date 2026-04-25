const net = require("net");
const tls = require("tls");

function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.ADMIN_RESET_EMAIL
  );
}

function encodeBase64(value) {
  return Buffer.from(String(value), "utf8").toString("base64");
}

function encodeHeader(value) {
  return `=?UTF-8?B?${encodeBase64(value)}?=`;
}

function createClient({ host, port, secure }) {
  return new Promise((resolve, reject) => {
    const socket = secure
      ? tls.connect({ host, port, servername: host }, () => resolve(socket))
      : net.connect({ host, port }, () => resolve(socket));

    socket.setEncoding("utf8");
    socket.setTimeout(15000);
    socket.on("error", reject);
    socket.on("timeout", () => reject(new Error("SMTP connection timed out")));
  });
}

function createReader(socket) {
  let buffer = "";

  return function readResponse() {
    return new Promise((resolve, reject) => {
      function cleanup() {
        socket.off("data", onData);
        socket.off("error", onError);
      }

      function onError(error) {
        cleanup();
        reject(error);
      }

      function onData(chunk) {
        buffer += chunk;
        const lines = buffer.split(/\r?\n/).filter(Boolean);
        const lastLine = lines[lines.length - 1] || "";

        if (/^\d{3}\s/.test(lastLine)) {
          cleanup();
          const response = buffer;
          buffer = "";
          resolve(response);
        }
      }

      socket.on("data", onData);
      socket.on("error", onError);
    });
  };
}

async function sendCommand(socket, readResponse, command, expectedCodes) {
  if (command) {
    socket.write(`${command}\r\n`);
  }

  const response = await readResponse();
  const code = Number(response.slice(0, 3));
  if (!expectedCodes.includes(code)) {
    throw new Error(`SMTP command failed: ${response.trim()}`);
  }
  return response;
}

async function sendMail({ to, subject, text }) {
  if (!isMailConfigured()) {
    throw new Error("邮件服务未配置");
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || "true") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  let socket = await createClient({ host, port, secure });
  let readResponse = createReader(socket);

  await sendCommand(socket, readResponse, null, [220]);
  await sendCommand(socket, readResponse, `EHLO ${host}`, [250]);

  if (!secure) {
    await sendCommand(socket, readResponse, "STARTTLS", [220]);
    socket = tls.connect({ socket, servername: host });
    socket.setEncoding("utf8");
    readResponse = createReader(socket);
    await sendCommand(socket, readResponse, `EHLO ${host}`, [250]);
  }

  await sendCommand(socket, readResponse, "AUTH LOGIN", [334]);
  await sendCommand(socket, readResponse, encodeBase64(user), [334]);
  await sendCommand(socket, readResponse, encodeBase64(pass), [235]);
  await sendCommand(socket, readResponse, `MAIL FROM:<${from}>`, [250]);
  await sendCommand(socket, readResponse, `RCPT TO:<${to}>`, [250, 251]);
  await sendCommand(socket, readResponse, "DATA", [354]);

  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text.replace(/\r?\n/g, "\r\n"),
    ".",
    "",
  ].join("\r\n");

  socket.write(message);
  await sendCommand(socket, readResponse, null, [250]);
  await sendCommand(socket, readResponse, "QUIT", [221]);
  socket.end();
}

module.exports = { isMailConfigured, sendMail };
