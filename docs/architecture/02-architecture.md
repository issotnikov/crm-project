# 02. Архитектура системы

---

## 1. Архитектурный стиль: Модульный монолит с Event Bus

### Обоснование выбора

| Критерий | Монолит | Микросервисы | **Модульный монолит** ✅ |
|----------|---------|--------------|--------------------------|
| Скорость разработки MVP | ✅ Высокая | ❌ Низкая (DevOps overhead) | ✅ Высокая |
| Транзакционная целостность | ✅ Локальные транзакции | ❌ Saga / 2PC | ✅ Локальные транзакции |
| Масштабирование | ❌ Только целиком | ✅ Независимое | ✅ Репликация + вертикальное |
| Сложность эксплуатации | ✅ Низкая | ❌ Высокая (service mesh, tracing) | ✅ Низкая |
| Изоляция сбоев | ❌ Общий процесс | ✅ Изоляция | 🔶 Частичная (через очереди) |
| Командная работа | 🔶 Конфликты | ✅ Независимость | ✅ Чёткие границы модулей |
| Переход к микросервисам | ❌ Сложный рефакторинг | — | ✅ Границы уже определены |

**Решение:** Модульный монолит с чёткими границами между модулями. Каждый модуль — это самостоятельный Python-пакет со своим набором моделей, сервисов и API-роутеров. Взаимодействие между модулями — только через **внутренний сервисный слой** (не через прямые запросы к БД).

Выделенные сервисы (worker'ы) используются для асинх発ных задач: ingestion listeners (Telegram, IMAP), тяжёлые задачи (генерация документов, рассылки).

### Путь эволюции

```
MVP                          Growth                        Scale
│                            │                             │
├─ Модульный монолит         ├─ Выделение коммуникаций    ├─ Микросервисы
├─ 1 PostgreSQL              │  в отдельный сервис         ├─ Read-реплики
├─ 1 Redis                   ├─ Read-реплики PG            ├─ Elasticsearch
├─ Celery workers            ├─ Elasticsearch              ├─ Sharding
├─ Docker Compose            ├─ K8s migration              ├─ CQRS
└─ Nginx reverse-proxy       └─ K8s                        └─ Event Sourcing
```

---

## 2. Компонентная архитектура

```
                              ┌──────────────────┐
                              │   Пользователь   │
                              │  (браузер/PWA)   │
                              └────────┬─────────┘
                                       │ HTTPS
                              ┌────────▼─────────┐
                              │     Nginx        │
                              │  (Reverse Proxy  │
                              │   + TLS + WAF)   │
                              └────────┬─────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
              ┌─────▼─────┐    ┌──────▼──────┐   ┌──────▼──────┐
              │ Frontend  │    │  Backend    │   │  Webhook    │
              │ (React)   │    │  API        │   │  Endpoints  │
              │ (SPA)     │    │  (FastAPI)  │   │  (FastAPI)  │
              └─────┬─────┘    └──────┬──────┘   └──────┬──────┘
                    │                 │                  │
                    │          ┌──────▼──────┐           │
                    │          │ Core Domain │           │
                    │          │ (Modules)   │           │
                    │          └──────┬──────┘           │
                    │                 │                  │
              ┌─────┴─────────────────┴──────────────────┘
              │
    ┌─────────▼────────┐     ┌───────────────────┐
    │  PostgreSQL 16   │     │  Redis 7          │
    │  (Primary + RR)  │     │  (Cache + Broker) │
    └──────────────────┘     └────────┬──────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
             ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
             │ Celery      │ │ Celery      │ │ Celery      │
             │ Worker:     │ │ Worker:     │ │ Scheduler   │
             │ Ingestion   │ │ Tasks       │ │ (Beat)      │
             │ (TG, IMAP)  │ │ (Docs, ML)  │ │ (cron jobs) │
             └─────────────┘ └─────────────┘ └─────────────┘
                    │
             ┌──────▼──────┐
             │ MinIO / S3  │
             │ (File Store)│
             └─────────────┘
```

---

## 3. Backend архитектура

### 3.1. Структурный паттерн: Clean Architecture / Layered

```
backend/src/
├── app/
│   ├── main.py                    # FastAPI app entry point
│   ├── deps.py                    # Dependency injection
│   │
│   ├── core/                      # Cross-cutting concerns
│   │   ├── config.py              # Settings (pydantic-settings)
│   │   ├── security.py            # JWT, hashing, encryption
│   │   ├── database.py            # Async SQLAlchemy engine/session
│   │   ├── exceptions.py          # Domain exceptions
│   │   └── middleware.py          # Request ID, audit, logging
│   │
│   ├── modules/                   # Business modules (bounded contexts)
│   │   ├── crm/                   # Клиенты, лиды, сделки
│   │   │   ├── models/            # SQLAlchemy ORM models
│   │   │   ├── schemas/           # Pydantic schemas (DTO)
│   │   │   ├── services/          # Business logic layer
│   │   │   ├── repositories/      # Data access layer
│   │   │   └── api/               # FastAPI routers
│   │   ├── comms/                 # Коммуникации
│   │   ├── tasks/                 # Задачи
│  /modules/                      # ... each follows the same pattern
│   │   ├── projects/
│   │   ├── finance/
│   │   ├── documents/
│   │   ├── marketing/
│   │   ├── calendar/
│   │   ├── analytics/
│   │   └── admin/
│   │
│   ├── integrations/              # External service adapters
│   │   ├── telegram/              # Telegram Bot API client
│   │   ├── email/                 # IMAP/SMTP client
│   │   ├── telephony/             # VoIP API client
│   │   └── webform/               # Public web form handler
│   │
│   ├── workers/                   # Celery tasks
│   │   ├── celery_app.py
│   │   ├── ingestion_tasks.py     # Polling: Telegram, IMAP
│   │   ├── document_tasks.py      # PDF/DOCX generation
│   │   ├── notification_tasks.py  # Email/Telegram notifications
│   │   └── scheduled_tasks.py     # Beat: reminders, SLA checks
│   │
│   └── events/                    # Event system
│       ├── bus.py                 # Event publisher/subscriber
│       ├── handlers.py            # Event → action mapping
│       └── types.py               # Event type definitions
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

### 3.2. Слои внутри каждого модуля

```
┌─────────────────────────────────────────────────────────┐
│  API Layer (FastAPI Routers)                             │
│  - HTTP endpoints, request validation, auth             │
│  - Отвечает за транспорт, не содержит бизнес-логики     │
├─────────────────────────────────────────────────────────┤
│  Service Layer (Business Logic)                          │
│  - Оркестрирует репозитории, события, интеграции        │
│  - Транзакционные границы (unit of work)                │
│  - Правила валидации, авторизации на уровне домена      │
├─────────────────────────────────────────────────────────┤
│  Repository Layer (Data Access)                          │
│  - CRUD операции, сложные запросы, фильтрация           │
│  - Абстракция над ORM (интерфейс + реализация)          │
├─────────────────────────────────────────────────────────┤
│  Domain Layer (Models + Schemas)                         │
│  - ORM models, Pydantic DTOs, Enums                      │
│  - Инварианты сущностей, value objects                  │
└─────────────────────────────────────────────────────────┘
```

### 3.3. Взаимодействие между модулями

Модули **не могут** обращаться напрямую к моделям и репозиториям друг друга. Взаимодействие — только через:

1. **Service-to-Service** — вызов публичных методов сервисного слоя другого модуля (с DI)
2. **Domain Events** — асинхронные события через Redis Pub/Sub (для развязки)

```python
# ПРИМЕР: создание лида из входящего сообщения
# module: comms → service → event → crm

class IngestionService:
    def process_incoming(self, request: IncomingRequestDTO) -> LeadDTO:
        # 1. Дедупликация клиента (через CRM service)
        customer = await self.crm_service.find_or_create_customer(
            phone=request.phone,
            email=request.email,
            name=request.name
        )

        # 2. Создание лида (через CRM service)
        lead = await self.crm_service.create_lead(
            customer_id=customer.id,
            source=request.source_type,
            description=request.message
        )

        # 3. Публикация события (для уведомлений, аналитики)
        await self.event_bus.publish(
            LeadCreatedEvent(lead_id=lead.id, customer_id=customer.id)
        )

        return lead
```

---

## 4. Frontend архитектура

### 4.1. Технологии

| Технология | Назначение |
|-----------|-----------|
| **React 18** | UI framework (функциональные компоненты, hooks) |
| **TypeScript 5** | Статическая типизация, type safety |
| **Vite** | Сборка и dev-сервер |
| **TanStack Query** | Server state (кэширование, рефетчи, optimistic updates) |
| **Zustand** | Client state (UI state, фильтры, сессия) |
| **TanStack Table** | Таблицы (сортировка, фильтрация, пагинация) |
| **React DnD / Hello-Pangea/dnd** | Drag-and-drop (канбан-доска) |
| **Tailwind CSS + shadcn/ui** | Стилизация, компонентная библиотека |
| **FullCalendar** | Календарь |
| **react-hook-form + Zod** | Формы и валидация |
| **Recharts** | Графики и диаграммы |

### 4.2. Структура

```
frontend/src/
├── App.tsx
├── main.tsx
├── router/                    # React Router
├── api/                       # API client (axios + react-query hooks)
│   ├── client.ts              # Axios instance with interceptors
│   ├── hooks/                 # useLeads, useDeals, useTasks...
│   └── types/                 # TypeScript types from OpenAPI
├── stores/                    # Zustand stores
├── components/                # Shared UI components
│   ├── ui/                    # shadcn/ui primitives
│   ├── layout/                # Sidebar, Header, PageContainer
│   └── shared/                # DataTable, StatusBadge, Avatar, etc.
┐ components/
├── features/                  # Feature-based modules
│   ├── dashboard/
│   ├── crm/                   # Клиенты, лиды, сделки
│   ├── comms/                 # Сообщения, история
│   ├── tasks/                 # Задачи
│   ├── projects/
│   ├── finance/
│   ├── documents/
│   ├── calendar/
│   ├── analytics/
│   └── settings/
├── hooks/                     # Shared hooks
├── lib/                       # Utils, formatters, constants
└── assets/                    # Static assets
```

### 4.3. Паттерны

- **Feature-Sliced Design** — каждый модуль (feature) самодостаточен: содержит свои компоненты, hooks, типы
- **Server-State vs Client-State** — TanStack Query для данных с сервера, Zustand только для UI
- **Optimistic Updates** — при перемещении карточки в канбане UI обновляется мгновенно, откат при ошибке
- **Real-time updates** через WebSocket (статусы, уведомления, новые заявки)

---

## 5. Хранилища данных

### 5.1. PostgreSQL 16 — основная БД

| Назначение | Особенности |
|-----------|-------------|
| Все реляционные данные | Таблицы модулей CRM, финансов, задач и т.д. |
| JSONB поля | Гибкие данные: `metadata`, `custom_fields`, `raw_payload` |
| Полнотекстовый поиск (tsvector) | Поиск по клиентам, лидам, коммуникациям |
| Row-Level Security (опц.) | Мультитенантность на будущее |
| `pgcrypto` | Шифрование чувствительных полей (телефоны, email) |
| Partitioning | Партицирование `interactions` и `audit_log` по месяцам |

**Стратегия индексов:**
- B-tree: внешние ключи, поля фильтрации (status, created_at)
- GIN: JSONB поля, tsvector
- Partial index: `WHERE deleted_at IS NULL` (soft delete)

### 5.2. Redis 7 — кэш и брокер

| Назначение | Конфигурация |
|-----------|-------------|
| **Celery Broker** | Очереди задач (ingestion, documents, notifications) |
| **Celery Result Backend** | Результаты асинхронных задач |
| **Cache** | Сессии, справочники, hot queries (TTL 5–60 мин) |
| **Rate Limiter** | Ограничение частоты API (по пользователю/IP) |
| **Pub/Sub** | Real-time events для WebSocket gateway |
| **Distributed Locks** | Координация workers (предотвращение двойной обработки) |

### 5.3. MinIO / S3 — файловое хранилище

| Тип данных | Путь |
|-----------|------|
| Вложения email | `s3://crm-attachments/{interaction_id}/{filename}` |
| Документы (КП, договоры) | `s3://crm-documents/{entity_type}/{entity_id}/{filename}` |
| Аватары | `s3://crm-avatars/{user_id}.webp` |
| Сгенерированные PDF | `s3://crm-pdf/{document_id}.pdf` |

**Пресайз-подписанные URL (presigned URLs)** — клиент получает временную ссылку для загрузки/скачивания напрямую в/из S3, минуя backend.

### 5.4. Elasticsearch (Post-MVP)

Полный текстовый поиск по всем коммуникациям, файлам, заметкам. Заменяет `tsvector` при росте объёмов.

---

## 6. Очереди событий и асинхронная обработка

### 6.1. Celery — очередь задач

| Очередь | Задачи | Конкурентность |
|---------|--------|----------------|
| `ingestion` | Telegram polling, IMAP polling, VoIP event processing | 2 workers |
| `default` | Уведомления, нормализация данных, дедупликация | 4 workers |
| `documents` | Генерация PDF/DOCX, конвертация | 2 workers |
| `heavy` | Массовые операции, экспорт отчётов, бэкапы | 1 worker |

### 6.2. Event Flow (внутренние события)

```
Входящий канал ──▶ Ingestion Queue ──▶ Normalize+Dedup ──▶ Create Lead
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
            Notification Queue    Analytics Queue        WebSocket Push
            (email/tg to mgr)     (update counters)      (real-time UI)
```

**Примеры доменных событий:**

| Событие | Инициирующий модуль | Подписчики |
|---------|---------------------|------------|
| `IncomingRequestReceived` | comms | crm (create lead), notifications, analytics |
| `LeadCreated` | crm | notifications, analytics, calendar |
| `LeadQualified` | crm | tasks (create follow-up), notifications |
| `DealStageChanged` | crm | finance, analytics, notifications |
| `DealWon` | crm | projects (create project), finance (invoice), documents |
| `TaskOverdue` | tasks | notifications, analytics |
| `PaymentReceived` | finance | crm (update deal), analytics, notifications |
| `DocumentGenerated` | documents | notifications |

### 6.3. Celery Beat — планировщик

| Расписание | Задача |
|-----------|--------|
| Каждые 30 сек | IMAP poll (новые письма) |
| Каждые 2 сек | Telegram getUpdates (long polling) |
| Каждые 5 мин | SLA check (просроченные лиды, задачи) |
| Ежечасно | Reminder notifications (задачи на сегодня) |
| Ежедневно 09:00 | Morning digest (отчёт для менеджеров) |
| Ежедневно 18:00 | Daily summary report |
| Еженедельно (пн 09:00) | Weekly analytics report |
| Ежедневно 02:00 | Auto-archive closed leads (older 90 days) |

---

## 7. Масштабирование

### 7.1. Вертикальное (MVP → Growth)

- Увеличение CPU/RAM серверов БД и приложения
- Оптимизация запросов, добавление индексов
- Read-реплики PostgreSQL для аналитических запросов

### 7.2. Горизонтальное (Growth → Scale)

| Компонент | Стратегия |
|-----------|-----------|
| Backend API | Stateless → за Load Balancer, реплицируется горизонтально |
| Celery Workers | Добавление worker-инстансов (auto-scaling по длине очереди) |
| PostgreSQL | Read-реплики (1 master + N read replicas) + pgBouncer (connection pooling) |
| Redis | Redis Cluster (sharding) или Redis Sentinel (HA) |
| MinIO/S3 | Erasure coding, multi-node |
| Frontend | CDN (Cloudflare) для статических ассетов |

### 7.3. Метрики для scaling decisions

| Метрика | Порог | Действие |
|---------|-------|----------|
| API latency p95 > 500ms | 5 мин | +1 backend instance |
| Celery queue depth > 100 | 5 мин | +1 worker |
| DB CPU > 80% | 15 мин | +1 read replica / вертикальное |
| Memory usage > 85% | 5 мин | Вертикальное |
| Disk I/O wait > 20ms | 15 мин | SSD upgrade / IOPS increase |

---

## 8. Безопасность

### 8.1. Аутентификация и авторизация

| Механизм | Описание |
|-----------|---------|
| **JWT** (access + refresh) | Access: 15 мин, RSA256. Refresh: 7 дней, httpOnly cookie |
| **RBAC** | Роли (`admin`, `manager`, `sales`, `finance`, `executor`) + гранулярные права |
| **2FA** (опц.) | TOTP (Google Authenticator) для админов |
| **Session management** | Redis-backed, одновременные сессии лимитированы |

### 8.2. Защита данных

| Мера | Реализация |
|------|-----------|
| TLS 1.2+ | Nginx (A+ rating на SSL Labs) |
| Шифрование at-rest | LUKS на дисках + pgcrypto для PII полей |
| Audit Log | Все действия над чувствительными данными (create/read/update/delete) |
| Backup encryption | GPG-шифрованные бэкапы БД |
| Rate limiting | 100 req/min на пользователя (Redis sliding window) |
| CORS | Whitelist доменов |
| CSP / XSS / CSRF | Security headers via Nginx + Django-style CSRF tokens для форм |
| Input sanitization | Pydantic validation на входе + parameterized queries |

### 8.3. Сегментация сети

```
Internet
  │
  ▼
┌──────────────────┐
│   WAF + Nginx    │     ← Публичный сегмент (DMZ)
│ (TLS, Rate Limit)│
└────────┬─────────┘
         │
    ┌────▼────┐
    │ Firewall│ ← Только 80/443 извне, всё остальное внутреннее
    └────┬────┘
         │
         ▼
┌────────────────────┐
│  Application Tier  │     ← Backend, Workers (внутренняя сеть)
│ (FastAPI, Celery)  │
└────────┬───────────┘
         │
    ┌────▼────┐
    │ Firewall│ ← Только внутренние IP к БД
    └────┬────┘
         │
         ▼
┌────────────────────┐
│   Data Tier        │     ← PostgreSQL, Redis, MinIO (изолированы)
└────────────────────┘
```

---

## 9. CI/CD

```
Developer ──▶ Git Push ──▶ GitHub Actions
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
            Lint & Test   Docker Build  Security Scan
            (ruff, pytest) (multi-stage) (trivy, bandit)
                 │            │            │
                 └────────────┼────────────┘
                              ▼
                    ┌─────────────────┐
                    │  Push to        │
                    │  Registry       │
                    └────────┬────────┘
                             ▼
                    ┌─────────────────┐
                    │  Deploy         │
                    │ (Docker Compose │
                    │  / K8s)         │
                    └─────────────────┘
```

| Этап | Инструмент | Триггер |
|------|-----------|---------|
| Lint | ruff, mypy | PR + push to main |
| Tests | pytest (unit + integration) | PR + push to main |
| Security | bandit, pip-audit, trivy (Docker) | PR + push to main |
| Build | Docker multi-stage build | merge to main |
| Deploy staging | Docker Compose / K8s | merge to main |
| Deploy production | Manual approval + K8s | tag v*.*.* |

---

## 10. Мониторинг и логирование

| Слой | Инструмент | Метрики |
|------|-----------|---------|
| Infrastructure | **Prometheus + Node Exporter** | CPU, RAM, disk, network |
| Application | **Prometheus + custom metrics** | Request rate, latency, error rate |
| Logs | **Loki** (or ELK) | Structured JSON logs (JSONL) |
| Tracing | **OpenTelemetry + Jaeger** (post-MVP) | Distributed tracing |
| Uptime | **Uptime Kuma** / Blackbox Exporter | HTTP, DB, Redis health |
| Alerts | **Alertmanager → Telegram/email** | Threshold-based alerts |
| Dashboards | **Grafana** | Real-time system + business dashboards |
