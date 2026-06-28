# Development Guide

> Руководство по локальному запуску и разработке CRM системы.

---

## Быстрый старт

### Вариант 1: Docker Compose (рекомендуется)

```bash
# 1. Клонировать репозиторий
git clone git@github.com:issotnikov/crm-project.git
cd crm-project

# 2. Создать .env файл
cp .env.example .env
# Отредактировать .env: задать SECRET_KEY, DB_PASSWORD, S3_SECRET_KEY

# 3. Запустить все сервисы
docker compose up -d

# 4. Проверить статус
docker compose ps

# 5. Применить SQL схему (выполняется автоматически при первом запуске PG)
# Но если нужно вручную:
docker exec -i crm-postgres psql -U crm -d crm < sql/schema/001_initial_schema.sql
docker exec -i crm-postgres psql -U crm -d crm < sql/seeds/seed_data.sql
```

### URLs после запуска

| Сервис | URL | Назначение |
|--------|-----|-----------|
| Frontend (Nginx) | http://localhost (port 80) | CRM интерфейс |
| Backend API | http://localhost/api/v1 | REST API |
| API Docs (Swagger) | http://localhost/api/v1/docs | OpenAPI документация |
| MinIO Console | http://localhost:9001 | Файловое хранилище |
| Grafana | http://localhost:3001 | Дашборды мониторинга |
| Prometheus | http://localhost:9090 | Метрики |

### Вариант 2: Локальная разработка (без Docker)

```bash
# Backend
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Запуск PostgreSQL и Redis локально или через Docker:
docker compose up -d postgres redis minio

# Запуск backend
export DATABASE_URL="postgresql+asyncpg://crm:crm@localhost:5432/crm"
export REDIS_URL="redis://localhost:6379/0"
export SECRET_KEY="dev-secret-key"
uvicorn app.main:app --reload --port 8000

# Celery worker (в другом терминале)
celery -A app.workers.celery_app worker --loglevel=info

# Celery beat (в третьем терминале)
celery -A app.workers.celery_app beat --loglevel=info

# Frontend
cd ../frontend
npm install
npm run dev
```

---

## Учётные данные по умолчанию

| Сервис | Логин | Пароль |
|--------|-------|--------|
| CRM Admin | admin@crm.local | Admin@12345 |
| PostgreSQL | crm | (из .env DB_PASSWORD) |
| MinIO | (из .env S3_ACCESS_KEY) | (из .env S3_SECRET_KEY) |
| Grafana | admin | (из .env GRAFANA_PASSWORD) |

---

## Структура проекта

```
crm-project/
├── docs/                          # Техническая документация
│   ├── 00-assumptions.md          # Допущения и ограничения
│   ├── 01-system-overview.md      # Общее описание системы
│   ├── architecture/              # Архитектура
│   ├── modules/                   # Описание модулей
│   ├── data-model/                # Модель данных
│   ├── integrations/              # Интеграции
│   ├── business-processes/        # Бизнес-процессы
│   ├── ui-ux/                     # UI/UX
│   ├── analytics/                 # Аналитика
│   ├── 09-mvp.md                  # MVP план
│   └── 10-risks.md                # Риски
├── design/mockups/                # HTML прототипы интерфейса
│   ├── dashboard.html             # Дашборд
│   └── kanban-board.html          # Канбан воронка
├── diagrams/                      # Архитектурные диаграммы
├── sql/
│   ├── schema/001_initial_schema.sql  # DDL
│   └── seeds/seed_data.sql            # Начальные данные
├── api/openapi/crm-api.yaml       # OpenAPI 3.0 спецификация
├── backend/                       # FastAPI приложение
│   ├── src/app/
│   │   ├── core/                  # Конфигурация, БД, безопасность
│   │   ├── modules/               # Бизнес-модули
│   │   │   ├── crm/               # Клиенты, лиды, сделки
│   │   │   ├── admin/             # Пользователи, роли, auth
│   │   │   ├── tasks/             # Задачи
│   │   │   ├── finance/           # Счета, оплаты
│   │   │   ├── documents/         # КП, договоры
│   │   │   ├── calendar/          # Календарь
│   │   │   └── analytics/         # Аналитика
│   │   ├── integrations/          # Внешние интеграции
│   │   │   ├── webform/           # Web-форма
│   │   │   ├── telephony/         # Телефония
│   │   │   ├── telegram/          # Telegram Bot
│   │   │   └── email/             # Email IMAP/SMTP
│   │   └── workers/               # Celery задачи
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                      # React приложение
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── nginx/nginx.conf               # Nginx reverse-proxy
├── docker-compose.yml             # Оркестрация сервисов
├── .env.example                   # Шаблон переменных окружения
└── .github/workflows/ci-cd.yml    # CI/CD pipeline
```

---

## Команды разработки

### Backend

```bash
# Запуск тестов
cd backend
pytest tests/ -v

# Запуск с покрытием
pytest tests/ --cov=src/app --cov-report=html

# Линтинг
ruff check src/
ruff format src/

# Проверка типов
mypy src/

# Миграции (когда будут добавлены)
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Frontend

```bash
cd frontend
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check
```

### Docker

```bash
# Пересборка образов
docker compose build

# Логи
docker compose logs -f api
docker compose logs -f worker_default

# Перезапуск сервиса
docker compose restart api

# Остановка
docker compose down

# Остановка + удаление volumes (ПОЛНОЕ удаление данных!)
docker compose down -v
```

### База данных

```bash
# Подключение к PostgreSQL
docker exec -it crm-postgres psql -U crm -d crm

# Бэкап
docker exec crm-postgres pg_dump -U crm crm > backup.sql

# Восстановление
cat backup.sql | docker exec -i crm-postgres psql -U crm -d crm

# Применить изменения в схеме
docker exec -i crm-postgres psql -U crm -d crm < sql/schema/001_initial_schema.sql
```

---

## Настройка интеграций

### Telegram Bot

1. Создать бота через [@BotFather](https://t.me/BotFather)
2. Получить токен
3. Добавить в `.env`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
   ```

### Email (IMAP/SMTP)

1. Настроить общий почтовый ящик (sales@company.ru)
2. Добавить в `.env`:
   ```
   IMAP_HOST=imap.company.ru
   IMAP_USER=sales@company.ru
   IMAP_PASSWORD=...
   SMTP_HOST=smtp.company.ru
   SMTP_USER=sales@company.ru
   SMTP_PASSWORD=...
   ```

### IP-телефония (Mango Office)

1. Получить API ключ в личном кабинете Mango
2. Настроить webhook на `https://crm.company.ru/api/v1/webhooks/telephony`
3. Добавить в `.env`:
   ```
   PHONE_PROVIDER=mango
   PHONE_API_KEY=...
   PHONE_API_SECRET=...
   PHONE_DOMAIN=...
   ```

### Web-форма сайта

1. Сгенерировать API ключ для домена сайта
2. Добавить в `.env`:
   ```
   WEBFORM_API_KEY=...
   ```
3. На сайте использовать виджет или прямые POST запросы:
   ```html
   <form action="https://crm.company.ru/api/v1/public/leads" method="POST">
     <input type="hidden" name="X-API-Key" value="YOUR_API_KEY">
     <input name="name" placeholder="Ваше имя" required>
     <input name="phone" placeholder="Телефон" required>
     <textarea name="message"></textarea>
     <button type="submit">Отправить</button>
   </form>
   ```

---

## TLS сертификаты

### Development (self-signed)

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=RU/ST=Moscow/L=Moscow/O=CRM/CN=crm.local"
```

### Production (Let's Encrypt)

```bash
certbot certonly --standalone -d crm.company.ru
cp /etc/letsencrypt/live/crm.company.ru/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/crm.company.ru/privkey.pem nginx/ssl/
```
