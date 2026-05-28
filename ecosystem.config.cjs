module.exports = {
  apps: [
    {
      name: "freeapi-forge",
      script: "pnpm",
      args: "dev",
      cwd: "/home/jahanzaib/freeapi-forge",
      env: {
        NODE_ENV: "development",
        PORT: 5051,
        DATABASE_URL: "postgresql://litellm_user:litellm_password_123@localhost:5434/freeapi_forge",
        REDIS_URL: "redis://localhost:6379/1",
        LITELLM_URL: "http://localhost:5050",
        LITELLM_API_KEY: "sk-ai-lab-master-key",
        JWT_SECRET: "freeapi-forge-local-secret",
      },
      max_restarts: 10,
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
    },
  ],
};
