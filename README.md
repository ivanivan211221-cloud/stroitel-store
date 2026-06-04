# Hozyan Website

Современный fullstack интернет-магазин стройматериалов `Хозяин`:
- клиент: `React + Vite + Framer Motion`
- сервер: `Node.js + Express + Sequelize ORM + PostgreSQL`
- auth/security: `JWT`, `bcrypt`, `helmet`, серверная валидация (`zod`)
- админка: `/admin` с ролями `ADMIN`, `MANAGER`, `CONTENT_MANAGER`

## Быстрый старт (локально)

### Шаг 0: PostgreSQL

**Docker** (из корня репозитория):

```bash
docker compose up -d
```

или `npm run db:up` — Postgres на порту **5433**, БД `hozyan`.

**Без Docker:** [Neon](https://neon.tech) / [Supabase](https://supabase.com) — скопируйте `DATABASE_URL` в `server/.env`.

### Шаг 1: Backend

```bash
cd server
copy .env.example .env
npm install
npm run seed
npm run dev
```

API: http://localhost:4000 — проверка: http://localhost:4000/api/health

### Шаг 2: Frontend

```bash
cd client
copy .env.example .env
npm install
npm run dev
```

Сайт: http://localhost:5173/

### Вход в админку (после seed)

- Email: `admin@hozyan.ru`
- Password: `Admin123!`  
- **На хостинге смените пароль после первого входа.**

---

## Деплой на хостинг (Render)

В репозитории настроен **рекомендуемый** вариант: **один Web-сервис + PostgreSQL** (`render.yaml`). API отдаёт и JSON, и собранный фронт — один URL, без возни с CORS.

### Шаги

1. Залейте проект на **GitHub** / GitLab.
2. [Render](https://render.com) → **New** → **Blueprint** → выберите репозиторий.
3. Render подхватит `render.yaml` (БД `hozyan-db` + сервис `hozyan`).
4. Дождитесь зелёного деплоя. Откройте URL вида `https://hozyan-xxxx.onrender.com`.
5. **Один раз** заполните БД: в Render → ваш сервис → **Shell**:

```bash
cd server && npm run seed
```

6. Проверьте:
   - `https://ваш-url.onrender.com/api/health` → `{"ok":true,"db":true}`
   - главная страница, каталог, вход в `/admin`

### Переменные (уже в render.yaml)

| Переменная | Назначение |
|------------|------------|
| `DATABASE_URL` | из PostgreSQL Render |
| `JWT_SECRET` | генерируется автоматически |
| `NODE_ENV` | `production` |
| `DISABLE_FILE_UPLOAD` | `true` — на Render диск временный; для фото указывайте **URL** в админке |

Дополнительно в панели можно задать `SITE_PHONE`, `SITE_EMAIL`, `SITE_ADDRESS`.

### Свой домен

Render → Settings → **Custom Domain** → DNS по инструкции Render.  
`RENDER_EXTERNAL_URL` обновится; для картинок с `/uploads` (если включите загрузку на VPS) используйте `PUBLIC_API_URL`.

### Альтернатива: API и фронт раздельно

Файл `render-split.yaml` — два сервиса (Node API + Static Site). После деплоя вручную задайте:

- API: `CORS_ORIGIN` = URL фронта  
- API: `PUBLIC_API_URL` = URL API  
- Client (при сборке): `VITE_API_URL` = `https://ваш-api.onrender.com/api`

### Локальная проверка «как на хосте»

```bash
npm run start:prod
```

Соберёт клиент с `VITE_API_URL=/api` и запустит API на http://localhost:4000 (сайт там же).

---

## Деплой на VPS / другой хостинг

1. PostgreSQL (локально или облако).
2. `server/.env` — `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`.
3. Из **корня** репозитория:

```bash
npm run render-build
cd server && npm run seed
npm run render-start
```

4. **Nginx**: проксировать весь трафик на `127.0.0.1:4000` (API сам отдаёт `client/dist`).
5. HTTPS (Let's Encrypt / certbot).

Для раздельного фронта: соберите `client` с `VITE_API_URL=https://api.домен.ru/api`, раздавайте `dist` через nginx, API — на поддомене, укажите `CORS_ORIGIN`.

---

## Облачная БД без Docker (локальная разработка)

1. [Neon](https://neon.tech) или [Supabase](https://supabase.com) → Connection string.
2. `server/.env` → `DATABASE_URL=...` (часто с `?sslmode=require`).
3. `cd server && npm run seed`.

---

## Что реализовано

- Публичный сайт: главная, каталог, карточка товара, корзина, checkout, избранное, кабинет, контакты
- Промокод `FIRST10` (−10% на первый заказ), доставка 490 ₽ / бесплатно от 5000 ₽
- Заказ в 1 клик, форма обратной связи (сообщения в админке)
- Имитация онлайн-оплаты (CARD → статус PAID; для реальных платежей нужна ЮKassa/Stripe)
- Админка: товары, категории, заказы, отзывы, пользователи, обращения

## Ограничения на бесплатном Render

- Сервис «засыпает» без трафика (~минута на первый запрос).
- Загрузка файлов на диск не сохраняется между перезапусками — используйте URL изображений.
- **Shell** на бесплатном тарифе недоступен — сид не нужно запускать вручную: при первом старте, если в БД нет товаров, сервер сам вызовет seed (`SEED_IF_EMPTY=true` в `render.yaml`).

### Заполнить БД без Shell (с вашего ПК)

1. Render → **hozyan_db** → **Connect** → скопируйте **External Database URL**.
2. В `server/.env` на компьютере: `DATABASE_URL=<строка из Render>` (часто нужен `?sslmode=require` в конце).
3. PowerShell:

```powershell
cd server
npm run seed
```

После деплоя с авто-seed достаточно дождаться перезапуска сервиса **hozyan** (или нажать **Manual Deploy**). Админ: `admin@hozyan.ru` / `Admin123!`.
