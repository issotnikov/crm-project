# 09. MVP версия системы

---

## 1. Принципы MVP

1. **Time-to-market за 3 месяца** — быстрая проверка гипотез
2. **Core value first** — сначала то, что закрывает главную боль (сбор и обработка заявок)
3. **Production-ready** — не прототип, а рабочая система с первого дня
4. **Extensible** — архитектура должна позволять добавлять post-MVP функции без переписывания

---

## 2. Что входит в MVP

### 2.1. Модули MVP

| Модуль | В MVP | Обоснование |
|--------|:-----:|-------------|
| **CRM (клиенты, лиды, сделки)** | ✅ Полностью | Ядро системы |
| **Коммуникации (4 канала)** | ✅ TG + Email + Phone + Web | Главная ценность — омниканальность |
| **Задачи и контроль** | ✅ Базовые задачи | Контроль сотрудников |
| **Финансы** | ✅ Счета + оплаты | Финансовый учёт |
| **Документы** | ✅ КП + счета (PDF) | Основной документооборот |
| **Календарь** | ✅ Базовый | Планирование |
| **Администрирование** | ✅ RBAC + базовые настройки | Управление доступом |
| **Аналитика** | ✅ Базовый дашборд | Видимость результатов |
| Проекты | ❌ Post-MVP | Расширенный модуль |
| Маркетинг (сегментация) | ❌ Post-MVP | Не критично для старта |

### 2.2. Функциональность MVP по модулям

#### CRM

| Функция | MVP | Post-MVP |
|---------|:---:|:--------:|
| Создание/редактирование клиентов | ✅ | |
| Управление контактами | ✅ | |
| Дедупликация (phone + email) | ✅ Авто | |
| Дедупликация по INN | ✅ | |
| Кастомные поля | ❌ | ✅ |
| Создание/управление лидами | ✅ | |
| Авто-распределение (round-robin) | ✅ | |
| Rule-based распределение | ❌ | ✅ |
| Лид-скоринг | ❌ Базовый | ✅ Продвинутый |
| Воронка продаж (канбан) | ✅ | |
| Настраиваемые воронки | ✅ Одна | ✅ Несколько |
| Управление сделками | ✅ | |
| Timeline взаимодействий | ✅ | |
| Слияние дубликатов | ❌ | ✅ UI для merge |
| Импорт клиентов (CSV) | ❌ | ✅ |
| Экспорт (CSV) | ✅ | |

#### Коммуникации

| Функция | MVP | Post-MVP |
|---------|:---:|:--------:|
| Telegram Bot (приём + отправка) | ✅ | |
| Email IMAP (приём) | ✅ | |
| Email SMTP (отправка) | ✅ | |
| IP-телефония (webhook) | ✅ | |
| Click-to-call | ❌ | ✅ |
| Web-форма сайта | ✅ | |
| reCAPTCHA | ✅ | |
| Вложения | ✅ | |
| Поиск по коммуникациям | ✅ Базовый (PG tsvector) | ✅ Elasticsearch |
| Автоответчики | ✅ | |

#### Задачи

| Функция | MVP | Post-MVP |
|---------|:---:|:--------:|
| Создание задач | ✅ | |
| Назначение исполнителю | ✅ | |
| Дедлайны и приоритеты | ✅ | |
| Статусы | ✅ | |
| Подзадачи (checklist) | ✅ | |
| Комментарии | ❌ | ✅ |
| Повторяющиеся задачи | ❌ | ✅ |
| Тайм-трекинг | ❌ | ✅ |

#### Финансы

| Функция | MVP | Post-MVP |
|---------|:---:|:--------:|
| Выставление счетов | ✅ | |
| Регистрация оплат | ✅ | |
| Контроль задолженности | ✅ | |
| Генерация PDF счёта | ✅ | |
| Интеграция с 1С | ❌ | ✅ |
| Мультивалютность | ❌ | ✅ |
| Несколько счетов по сделке | ✅ | |

#### Документы

| Функция | MVP | Post-MVP |
|---------|:---:|:--------:|
| Генерация КП из шаблона | ✅ | |
| Генерация договора из шаблона | ✅ | |
| Хранение документов | ✅ | |
| Версионность | ❌ | ✅ |
| Электронная подпись | ❌ | ✅ |
| Отправка из системы | ✅ | |

#### Календарь

| Функция | MVP | Post-MVP |
|---------|:---:|:--------:|
| Создание событий | ✅ | |
| Day/Week/Month views | ✅ | |
| Напоминания | ✅ | |
| iCal экспорт | ✅ | |
| Google Calendar sync | ❌ | ✅ |
| Проверка занятости (free/busy) | ❌ | ✅ |

#### Администрирование

| Функция | MVP | Post-MVP |
|---------|:---:|:--------:|
| Управление пользователями | ✅ | |
| Роли и права (RBAC) | ✅ | |
| Журнал аудита | ✅ | |
| Настройки воронки | ✅ | |
| Настройки интеграций | ✅ | |
| Кастомные поля | ❌ | ✅ |
| 2FA | ❌ | ✅ |
| SSО (LDAP/SAML) | ❌ | ✅ |

#### Аналитика

| Функция | MVP | Post-MVP |
|---------|:---:|:--------:|
| Дашборд руководителя | ✅ Базовый | ✅ Расширенный |
| Дашборд менеджера | ✅ | |
| Воронка-отчёт | ✅ | |
| Отчёт по сотрудникам | ✅ | |
| Отчёт по источникам | ✅ | |
| Конструктор отчётов | ❌ | ✅ |
| Scheduled reports (email) | ❌ | ✅ |

---

## 3. Минимальная архитектура MVP

### 3.1. Инфраструктура

```
┌─────────────────────────────────────────────────────┐
│                   VPS (8 vCPU / 16GB RAM)           │
│                                                     │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐    │
│  │  Nginx    │──▶│  FastAPI  │──▶│ PostgreSQL│    │
│  │ (Proxy+TLS)│  │ (2 workers)│   │   16      │    │
│  └───────────┘   └─────┬─────┘   └───────────┘    │
│                         │                          │
│  ┌───────────┐         │         ┌───────────┐    │
│  │  React    │         │         │  Redis 7  │    │
│  │ (static)  │         │         │           │    │
│  └───────────┘         │         └─────┬─────┘    │
│                         │               │          │
│                  ┌──────▼──────┐ ┌──────▼──────┐  │
│                  │   Celery    │ │  Celery     │  │
│                  │  Workers    │ │  Beat       │  │
│                  │ (4 process) │ │ (scheduler) │  │
│                  └─────────────┘ └─────────────┘  │
│                         │                          │
│                  ┌──────▼──────┐                  │
│                  │   MinIO     │                  │
│                  │ (file store)│                  │
│                  └─────────────┘                  │
└─────────────────────────────────────────────────────┘
```

### 3.2. Серверные требования (MVP)

| Компонент | CPU | RAM | Disk | ОС |
|-----------|-----|-----|------|----|
| Application + DB (1 сервер) | 8 vCPU | 16 GB | 200 GB SSD | Ubuntu 22.04 LTS |
| Backup storage | — | — | 500 GB | — |

### 3.3. Docker Compose (MVP)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: crm
      POSTGRES_USER: crm
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crm"]
      interval: 10s

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data

  api:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
    environment:
      - DATABASE_URL=postgresql+asyncpg://crm:${DB_PASSWORD}@postgres:5432/crm
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - IMAP_HOST=${IMAP_HOST}
      - IMAP_USER=${IMAP_USER}
      - IMAP_PASSWORD=${IMAP_PASSWORD}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  worker:
    build: ./backend
    command: celery -A app.workers.celery_app worker --loglevel=info --concurrency=4 -Q ingestion,default,documents
    environment:
      # same as api
      ...

  beat:
    build: ./backend
    command: celery -A app.workers.celery_app beat --loglevel=info
    environment:
      # same as api
      ...

  frontend:
    build: ./frontend
    environment:
      - VITE_API_URL=https://crm.company.ru/api/v1
    ports:
      - "3000:80"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./frontend/dist:/usr/share/nginx/html
    depends_on:
      - api

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${S3_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${S3_SECRET_KEY}
    volumes:
      - minio_data:/data

volumes:
  pg_data:
  redis_data:
  minio_data:
```

---

## 4. Roadmap разработки MVP (12 недель)

### Фаза 1: Foundation (Недели 1–3)

| Неделя | Задачи |
|--------|--------|
| 1 | Настройка инфраструктуры (Docker, PG, Redis, MinIO); базовая структура backend; аутентификация (JWT); RBAC |
| 2 | Модель данных (SQLAlchemy); миграции (Alembic); базовый CRUD для users, roles, permissions |
| 3 | Frontend: layout, sidebar, routing; базовые таблицы; design system (shadcn/ui) |

### Фаза 2: Core CRM (Недели 4–6)

| Неделя | Задачи |
|--------|--------|
| 4 | Модуль CRM: customers, contacts, contact_channels; дедупликация |
| 5 | Модуль CRM: leads, pipelines, deal_stages, deals; воронка (канбан UI) |
| 6 | Timeline (interactions); карточки клиента и сделки; быстрый поиск |

### Фаза 3: Интеграции (Недели 7–8)

| Неделя | Задачи |
|--------|--------|
| 7 | Telegram Bot API (приём + отправка); Email IMAP/SMTP |
| 8 | IP-телефония webhook; Web-форма сайта; нормализация + идемпотентность |

### Фаза 4: Tasks + Finance + Documents (Недели 9–10)

| Неделя | Задачи |
|--------|--------|
| 9 | Модуль задач; SLA-контроль; автозадачи; уведомления |
| 10 | Финансы (счета, оплаты); генерация PDF (КП, счёт); календарь |

### Фаза 5: Polish + Deploy (Недели 11–12)

| Неделя | Задачи |
|--------|--------|
| 11 | Дашборды и аналитика; WebSocket (real-time); уведомления (in-app, email) |
| 12 | Тестирование (unit + integration + e2e); CI/CD pipeline; деплой на production; документация |

---

## 5. Команда MVP

| Роль | Количество | Описание |
|------|-----------|----------|
| Tech Lead / Backend | 1 | FastAPI, архитектура, интеграции |
| Frontend Developer | 1 | React + TypeScript |
| Full-stack / DevOps | 1 | Docker, CI/CD, PostgreSQL |
| QA Engineer | 1 (part-time) | Тестирование |

**Итого:** 3–4 человека на 12 недель.

---

## 6. Критерии готовности MVP (Definition of Done)

| Критерий | Метрика |
|----------|---------|
| Все 4 канала работают | Заявка из TG/Email/Phone/Web → лид в CRM за < 30 сек |
| Дедупликация | Дублей клиентов < 1% |
| Воронка | Полный цикл: лид → сделка → won → счёт → оплата |
| Документы | КП и счёт генерируются из шаблона < 10 сек |
| Производительность | p95 latency API < 300ms |
| Доступность | Uptime > 99.5% |
| Тестовое покрытие | > 70% code coverage |
| Документация | API docs (OpenAPI), README, deployment guide |
| Безопасность | HTTPS, JWT auth, RBAC, audit log |

---

## 7. Post-MVP Roadmap (месяцы 4–9)

| Приоритет | Функция | Сложность |
|-----------|---------|-----------|
| P1 | Модуль проектов (полный) | Высокая |
| P1 | Кастомные поля | Средняя |
| P1 | Слияние дубликатов (UI) | Средняя |
| P1 | Массовые операции (bulk actions) | Средняя |
| P2 | Маркетинговые сегменты | Средняя |
| P2 | Интеграция с 1С | Высокая |
| P2 | Конструктор отчётов | Высокая |
| P2 | Мобильное приложение (React Native) | Высокая |
| P3 | Elasticsearch (полный поиск) | Средняя |
| P3 | Google Calendar sync | Низкая |
| P3 | 2FA + SSO (LDAP/SAML) | Средняя |
| P3 | Мультивалютность | Средняя |
| P3 | Мультитенантность (SaaS mode) | Очень высокая |
| P3 | AI-ассистент (авто-суммаризация, подсказки) | Высокая |
