const { Sequelize } = require("sequelize");

/**
 * Подключение только к PostgreSQL (через DATABASE_URL).
 * Локально: см. docker-compose.yml в корне репозитория.
 * Облако: Neon, Supabase, Render Postgres — вставьте выданную строку подключения.
 */
function shouldUseSsl(databaseUrl) {
  if (process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1") return true;
  if (process.env.DATABASE_SSL === "false" || process.env.DATABASE_SSL === "0") return false;
  try {
    const u = new URL(databaseUrl);
    const mode = u.searchParams.get("sslmode");
    if (mode === "require" || mode === "verify-full") return true;
  } catch {
    // ignore
  }
  return /neon\.tech|supabase\.co|pooler\.supabase|amazonaws\.com|render\.com|\.database\.app/i.test(
    databaseUrl,
  );
}

function createSequelize() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      "Задайте DATABASE_URL в server/.env (см. server/.env.example). Локальный Postgres: из корня проекта выполните «docker compose up -d», затем строка с localhost.",
    );
  }

  const logging = process.env.SEQUELIZE_LOGGING === "true" ? console.log : false;
  const useSsl = shouldUseSsl(databaseUrl);

  return new Sequelize(databaseUrl, {
    dialect: "postgres",
    logging,
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: process.env.PGSSL_STRICT === "true",
          },
        }
      : {},
  });
}

module.exports = createSequelize();
