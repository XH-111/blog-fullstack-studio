module.exports = {
  apps: [
    {
      name: "blog-web",
      script: "npm",
      args: "start",
      cwd: "./",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "blog-api",
      script: "npm",
      args: "run start:server",
      cwd: "./",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
