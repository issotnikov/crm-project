# 03. Модули системы (детальное описание)

> Каждый модуль описан по структуре: **Функции → Сущности данных → Бизнес-логика → Связи с другими модулями**.

---

## Модуль 1: CRM (Ядро)

> Центральный модуль системы. Управляет клиентами, контактами, лидами и сделками.

### 1.1. Функции

| Функция | Описание |
|---------|----------|
| Управление клиентами | Создание, редактирование, поиск, слияние дубликатов |
| Управление контактами | Несколько контактных лиц на одного клиента |
| Управление лидами | Приём, квалификация, распределение, конвертация в сделку |
| Воронка продаж | Настраиваемые стадии, канбан-доска, drag-and-drop |
| Управление сделками | Ведение сделки от создания до закрытия (выиграна/проиграна) |
| История взаимодействий | Единый timeline всех касаний клиента |
| Дедупликация | Автоматический поиск дублей по телефону/email/телеграм |
| Кастомные поля | Настраиваемые поля для клиентов и сделок |
| Экспорт | Выгрузка списков в CSV/Excel |

### 1.2. Сущности данных

#### `customers` (Клиенты)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | Уникальный ID |
| `type` | ENUM | `individual` (физлицо) / `company` (юрлицо) |
| `name` | VARCHAR(500) | Наименование / ФИО |
| `full_legal_name` | VARCHAR(500) | Полное юр. наименование (для компаний) |
| `inn` | VARCHAR(12) | ИНН (для дедупликации юрлиц) |
| `industry` | VARCHAR(200) | Отрасль |
| `status` | ENUM | `active`, `inactive`, `vip`, `blacklist` |
| `source` | ENUM | `telegram`, `email`, `phone`, `web_form`, `manual` |
| `responsible_manager_id` | FK → users.id | Ответственный менеджер |
| `metadata` | JSONB | Кастомные поля |
| `tags` | VARCHAR[] | Теги для сегментации |
| `created_at` / `updated_at` | TIMESTAMPTZ | Метки времени |
| `created_by` | FK → users.id | Кто создал |
| `deleted_at` | TIMESTAMPTZ NULL | Soft delete |

#### `contacts` (Контактные лица)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `customer_id` | FK → customers.id | Принадлежность клиенту |
| `first_name` | VARCHAR(200) | Имя |
| `last_name` | VARCHAR(200) | Фамилия |
| `position` | VARCHAR(200) | Должность |
| `phone` | VARCHAR(20) | Телефон (E.164) |
| `email` | VARCHAR(255) | Email |
| `telegram_id` | VARCHAR(50) | Telegram ID/username |
| `is_primary` | BOOLEAN | Основной контакт |
| `metadata` | JSONB | Доп. поля |

#### `contact_channels` (Каналы связи — для дедупликации)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `contact_id` | FK → contacts.id | |
| `channel_type` | ENUM | `phone`, `email`, `telegram` |
| `channel_value` | VARCHAR | Нормализованное значение (E.164 для phone) |
| `verified` | BOOLEAN | Подтверждён |
| *(Уникальный индекс на channel_type + channel_value)* | | |

#### `leads` (Лиды / Заявки)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `customer_id` | FK → customers.id | Клиент |
| `contact_id` | FK → contacts.id | Контакт (опц.) |
| `title` | VARCHAR(500) | Заголовок заявки |
| `description` | TEXT | Описание (текст заявки) |
| `source` | ENUM | `telegram`, `email`, `phone`, `web_form` |
| `source_details` | JSONB | Детали источника (UTM, referrer, bot username) |
| `status` | ENUM | `new`, `in_progress`, `qualified`, `converted`, `rejected`, `duplicate` |
| `priority` | ENUM | `low`, `medium`, `high`, `urgent` |
| `assigned_to` | FK → users.id | Ответственный |
| `deal_id` | FK → deals.id NULL | Связанная сделка (после конвертации) |
| `rejection_reason` | ENUM NULL | Причина отказа (спам, нецелевой, дубль и т.д.) |
| `utm` | JSONB | UTM-метки |
| `score` | INTEGER | Лид-скоринг (0–100) |
| `sla_deadline` | TIMESTAMPTZ | Дедлайн реакции |
| `responded_at` | TIMESTAMPTZ NULL | Время первой реакции |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

#### `deals` (Сделки)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `customer_id` | FK → customers.id | |
| `lead_id` | FK → leads.id NULL | Из какого лида создана |
| `title` | VARCHAR(500) | |
| `description` | TEXT | |
| `amount` | DECIMAL(12,2) | Сумма сделки (₽) |
| `currency` | VARCHAR(3) | `RUB` (по умолчанию) |
| `stage` | FK → deal_stages.id | Стадия воронки |
| `status` | ENUM | `open`, `won`, `lost` |
| `expected_close_date` | DATE | Ожидаемая дата закрытия |
| `actual_close_date` | DATE NULL | Фактическая дата |
| `probability` | INTEGER | Вероятность (0–100%) |
| `assigned_to` | FK → users.id | Ответственный менеджер |
| `lost_reason` | ENUM NULL | Причина проигрыша |
| `project_id` | FK → projects.id NULL | Связанный проект (после won) |
| `metadata` | JSONB | Кастомные поля |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

#### `deal_stages` (Стадии воронки)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `name` | VARCHAR(100) | Название (например: «Квалификация», «КП отправлено», «Переговоры») |
| `pipeline_id` | FK → pipelines.id | Воронка |
| `order` | INTEGER | Порядок в воронке |
| `probability` | INTEGER | Базовая вероятность для стадии |
| `is_won_stage` | BOOLEAN | Финальная стадия «Успех» |
| `is_lost_stage` | BOOLEAN | Финальная стадия «Отказ» |

#### `pipelines` (Воронки)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `name` | VARCHAR(100) | Название воронки |
| `is_default` | BOOLEAN | Воронка по умолчанию |
| `settings` | JSONB | Настройки (цвета стадий, правила) |

### 1.3. Бизнес-логика

#### Воронка продаж по умолчанию

```
Новый → Квалификация → Встреча/Презентация → КП отправлено → Переговоры → Договор → Оплата → ✅ Выиграна
                                                                                      ↘ ❌ Проиграна
```

#### Правила дедупликации

```
Входящие данные: {phone, email, telegram_id, inn}
    │
    ├─ Поиск customer по INN (если есть) → точное совпадение
    ├─ Поиск contact_channels по phone (нормализованный E.164)
    ├─ Поиск contact_channels по email (lowercase, trimmed)
    ├─ Поиск contact_channels по telegram_id
    │
    ├─ Найден → Привязать к существующему customer
    └─ Не найден → Создать новый customer + contacts + contact_channels
```

#### Авто-распределение лидов

| Стратегия | Описание |
|-----------|----------|
| **Round-robin** | По очереди между активными менеджерами отдела |
| **Load-balanced** | Менеджеру с наименьшим числом открытых лидов |
| **Rule-based** | По правилам: регион, отрасль, источник, тег → конкретный менеджер/группа |
| **Manual** | Все лиды — в нераспределённый пул, распределение вручную |

#### Лид-скоринг (scoring)

| Параметр | Баллы |
|----------|-------|
| Заполнил форму на сайте | +10 |
| Указал телефон + email | +15 |
| Пришёл по рефералу | +20 |
| Открыл КП / перешёл по ссылке | +15 |
| Возвратный клиент (уже покупал) | +30 |
| Крупная компания (ИНН, > 100 сотрудников) | +20 |
| Ответил на письмо/звонок | +10 |

**Пороги:** ≥ 70 — Hot, 40–69 — Warm, < 40 — Cold.

### 1.4. Связи с другими модулями

| Связь | Направление | Описание |
|-------|-------------|----------|
| CRM ← Comms | Comms создаёт Lead через сервис CRM | Входящие сообщения → лиды |
| CRM → Tasks | При конвертации лида создаётся набор задач | Follow-up, звонок, КП |
| CRM → Finance | При won — создаётся счёт; сделка ссылается на финансы | |
| CRM → Documents | Из сделки генерируется КП / договор | |
| CRM → Projects | При won — создаётся проект | |
| CRM → Analytics | CRM публикует события для аналитики | |
| CRM ← Admin | Роли/права определяют доступ к операциям | |

---

## Модуль 2: Коммуникации (Comms)

> Омниканальный сбор и отображение всех коммуникаций с клиентом.

### 2.1. Функции

| Функция | Описание |
|---------|----------|
| Сбор входящих | Telegram, Email (IMAP), телефон (webhook), Web-форма (API) |
| Отправка исходящих | Прямо из карточки клиента/сделки: Telegram, Email, звонок |
| Единая история | Все сообщения, звонки, письма — в едином timeline |
| Привязка к сущностям | Каждое сообщение привязано к клиенту/лиду/сделке |
| Вложений | Получение и отправка файлов |
| Автоответчики | Шаблоны автоответов по каждому каналу |
| Поиск | Поиск по истории коммуникаций |
| Статусы доставки | Доставлено / прочитано / не доставлено |
| Внутренние заметки | Личные заметки менеджера (не видны клиенту) |

### 2.2. Сущности данных

#### `interactions` (Все взаимодействия — единая таблица)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `interaction_type` | ENUM | `message`, `call`, `email`, `note`, `task_result`, `status_change` |
| `channel` | ENUM | `telegram`, `email`, `phone`, `internal`, `web_form` |
| `direction` | ENUM | `inbound`, `outbound` |
| `customer_id` | FK → customers.id | |
| `contact_id` | FK → contacts.id NULL | |
| `lead_id` | FK → leads.id NULL | |
| `deal_id` | FK → deals.id NULL | |
| `project_id` | FK → projects.id NULL | |
| `subject` | VARCHAR(500) | Тема письма / заголовок звонка |
| `body_text` | TEXT | Текст сообщения (plain) |
| `body_html` | TEXT NULL | HTML версия (для email) |
| `from_address` | VARCHAR(255) | Отправитель |
| `to_address` | VARCHAR(255) | Получатель |
| `external_id` | VARCHAR(255) | ID во внешней системе (message_id, call_id) |
| `external_metadata` | JSONB | Сырые метаданные канала |
| `status` | ENUM | `delivered`, `read`, `failed`, `missed` |
| `duration` | INTEGER NULL | Длительность (для звонков, сек) |
| `recording_url` | VARCHAR(500) NULL | Ссылка на запись (S3/провайдер) |
| `attachments` | JSONB[] | Массив вложений [{filename, s3_key, size, mime}] |
| `created_by` | FK → users.id NULL | Для исходящих/заметок |
| `created_at` | TIMESTAMPTZ | |

> **Партицирование:** таблица `interactions` партицируется по месяцам (`created_at`) для производительности.

#### `incoming_requests` (Входящие заявки — до нормализации)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `source_type` | ENUM | `telegram`, `email`, `phone`, `web_form` |
| `raw_payload` | JSONB | Полный сырой payload из канала |
| `normalized_data` | JSONB | Нормализованные данные {name, phone, email, message} |
| `contact_hash` | VARCHAR(64) | SHA256 для идемпотентности |
| `lead_id` | FK → leads.id NULL | Созданный лид |
| `status` | ENUM | `pending`, `processing`, `processed`, `error` |
| `error_message` | TEXT NULL | |
| `created_at` | TIMESTAMPTZ | |

### 2.3. Бизнес-логика

#### Flow обработки входящего сообщения

```
[Канал] ──▶ incoming_requests (raw_payload)
                │
                ▼
        Нормализация:
          - Извлечь name, phone, email, message
          - Нормализовать phone → E.164
          - Сформировать contact_hash
                │
                ▼
        Идемпотентность:
          - Проверить: есть ли incoming_request с таким contact_hash?
          - Если да → игнорировать (уже обработан)
                │
                ▼
        Создание interaction:
          - type=message/call/email
          - Привязка к customer (через дедупликацию)
                │
                ▼
        Создание Lead (если ещё нет открытого лида по этому клиенту):
          - status=new, source=source_type
          - Авто-распределение
          - Уведомление менеджера
                │
                ▼
        Создание interaction (type=note):
          - "Создан лид из [канал]"
```

#### Правила привязки к существующему лиду

Если от клиента уже есть открытый лид (`status in [new, in_progress]`):
1. Сообщение привязывается к этому лиду (как interaction)
2. Новый лид НЕ создаётся
3. Менеджеру отправляется уведомление «Новое сообщение по лиду #X»
4. Обновляется `lead.updated_at`

### 2.4. Каналы приёма

#### Telegram

| Параметр | Значение |
|----------|----------|
| Метод | Bot API, long polling (getUpdates) |
| Частота опроса | Каждые 2 сек |
| Типы сообщений | text, contact (phone sharing), location, file/photo |
| Команды бота | `/start`, `/help`, `/manager` (запрос на связь с менеджером) |
| Автоответ | Приветствие + запрос контактов (если не передан phone) |
| Исходящие | sendMessage, sendDocument (из карточки клиента) |

**Flow Telegram-заявки:**
```
User → Bot: "Здравствуйте, мне нужно..."
    │
    ├─ Bot: Автоответ "Спасибо! Укажите телефон для связи"
    ├─ User: отправляет contact (phone)
    │
    ├─ Система:
    │   - Дедупликация по telegram_id → phone
    │   - Создание/привязка Customer + Contact
    │   - Создание Lead (source=telegram)
    │   - Создание Interaction (message, inbound)
    │   - Уведомление менеджера
    │
    └─ Менеджер видит новую заявку в CRM с полным текстом
```

#### Email (IMAP/SMTP)

| Параметр | Значение |
|----------|----------|
| Сбор | IMAP polling каждые 30 сек (общие ящики: sales@, info@) |
| Парсинг | email-parser library (извлечение text, html, attachments) |
| Дедупликация | По Message-ID + UID + папка |
| Отправка | SMTP (через корпоративный SMTP relay) |
| Шаблоны | HTML-шаблоны с переменными ({name}, {deal_amount}) |

#### Телефон (IP-телефония)

| Параметр | Значение |
|----------|----------|
| Провайдер | Mango Office / UIS / Megaplan (REST API + webhooks) |
| Входящие | Webhook от провайдера: incoming call → создание Interaction |
| Запись | Ссылка на запись сохраняется в interaction.recording_url |
| Исходящий | Click-to-call из карточки (API call к провайдеру) |
| Call tracking | Несколько подменных номеров → источник (UTM) |

**Webhook events (телефония):**
```
incoming call start  → Interaction(call, inbound, status=in_progress)
incoming call end    → Update: duration, recording_url, status=completed
incoming call missed → Interaction(call, inbound, status=missed) → Lead(urgent)
outgoing call start  → Interaction(call, outbound, status=in_progress)
```

#### Web-форма сайта

| Параметр | Значение |
|----------|----------|
| Метод | POST на `/api/v1/public/leads` (public endpoint, rate-limited) |
| Аутентификация | API key (per-site) + CSRF token + reCAPTCHA v3 |
| Поля | name, phone, email, message, utm_* (hidden) |
| Валидация | Server-side: phone format, email format, honeypot check |
| Webhook | Дублирование на email менеджера (опционально) |

### 2.5. Связи с другими модулями

| Связь | Описание |
|-------|----------|
| Comms → CRM | Создание лидов, привязка к клиентам |
| Comms ← CRM | Из карточки клиента/сделки — отправка сообщений |
| Comms → Notifications | Новые сообщения → уведомления менеджерам |
| Comms → Analytics | Метрики: время ответа, канал-источник |

---

## Модуль 3: Задачи и контроль сотрудников (Tasks)

### 3.1. Функции

| Функция | Описание |
|---------|----------|
| Постановка задач | Создание задач с описанием, дедлайном, приоритетом |
| Назначение | Назначение исполнителю (или группе) |
| Контроль | Статусы, прогресс, напоминания о дедлайне |
| Подзадачи | Декомпозиция: задача → подзадачи (checklist) |
| Связь с сущностями | Задача привязана к клиенту/лиду/сделке/проекту |
| Комментарии | Обсуждение задачи внутри |
| Повторяющиеся задачи | Шаблоны: ежедневные, еженедельные |
| Отчёты по исполнению | Просроченные, выполненные, в работе |
| Делегирование | Передача задачи другому сотруднику |

### 3.2. Сущности данных

#### `tasks`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `title` | VARCHAR(500) | |
| `description` | TEXT | |
| `status` | ENUM | `pending`, `in_progress`, `review`, `done`, `cancelled` |
| `priority` | ENUM | `low`, `medium`, `high`, `urgent` |
| `type` | ENUM | `call`, `email`, `meeting`, `document`, `follow_up`, `custom` |
| `assignee_id` | FK → users.id | Исполнитель |
| `created_by` | FK → users.id | Постановщик |
| `reviewer_id` | FK → users.id NULL | Контролёр (опц.) |
| `due_date` | TIMESTAMPTZ | Дедлайн |
| `remind_at` | TIMESTAMPTZ NULL | Когда напомнить |
| `completed_at` | TIMESTAMPTZ NULL | Фактическое выполнение |
| `customer_id` | FK NULL | Привязка к сущности |
| `lead_id` | FK NULL | |
| `deal_id` | FK NULL | |
| `project_id` | FK NULL | |
| `parent_task_id` | FK → tasks.id NULL | Родительская задача |
| `checklist` | JSONB | [{id, text, done}] |
| `tags` | VARCHAR[] | |
| `time_spent` | INTEGER NULL | Затраченное время (мин) |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

#### `task_comments`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `task_id` | FK → tasks.id | |
| `author_id` | FK → users.id | |
| `body` | TEXT | |
| `attachments` | JSONB[] | |
| `created_at` | TIMESTAMPTZ | |

#### `task_history` (история изменений)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `task_id` | FK → tasks.id | |
| `changed_by` | FK → users.id | |
| `field` | VARCHAR(50) | Изменённое поле |
| `old_value` | TEXT | |
| `new_value` | TEXT | |
| `changed_at` | TIMESTAMPTZ | |

### 3.3. Бизнес-логика

#### SLA-контроль

| Событие | Действие |
|---------|----------|
| Задача просрочена (`due_date < now() AND status != done`) | Уведомление исполнителю + руководителю |
| Осталось 1 час до дедлайна | Напоминание исполнителю |
| Статус → `review` | Уведомление контролёру |
| Статус → `done` | Уведомление постановщику |

#### Автозадачи (создаются при событиях)

| Триггер | Создаваемая задача |
|---------|---------------------|
| `LeadCreated` | «Связаться с клиентом #X» (due_date = +2 часа) |
| `LeadConverted` | «Подготовить КП для сделки #X» (due_date = +1 день) |
| `DealStageChanged` → «КП отправлено» | «Перезвонить через 2 дня» |
| `DealWon` | «Подготовить договор» (due_date = +1 день) |
| `DealWon` | «Создать проект» (due_date = +2 дня) |

### 3.4. Связи

| Связь | Описание |
|-------|----------|
| Tasks ← CRM | Автозадачи при создании лидов/сделок |
| Tasks ← Projects | Задачи внутри проектов |
| Tasks → Notifications | Напоминания, просрочки |
| Tasks → Analytics | Эффективность сотрудников (выполнено/просрочено) |

---

## Мodule 4: Проекты (Projects)

> Управление процессом исполнения после успешного закрытия сделки.

### 4.1. Функции

| Функция | Описание |
|---------|----------|
| Создание проекта | Автоматически из выигранной сделки или вручную |
| Этапы проекта | Настраиваемые этапы (milestones) |
| Роли в проекте | Руководитель, исполнители, наблюдатели |
| Задачи проекта | Задачи привязаны к проекту и этапу |
| Бюджет | Плановый и фактический бюджет проекта |
| Тайм-трекинг | Учёт затраченного времени |
| Контроль прогресса | Процент выполнения по этапам |
| Документы проекта | Договор, ТЗ, акты, отчёты |
| Статусы | `planning`, `active`, `on_hold`, `completed`, `cancelled` |
| Диаграмма Ганта | Визуализация этапов и сроков |

### 4.2. Сущности данных

#### `projects`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `name` | VARCHAR(500) | |
| `description` | TEXT | |
| `deal_id` | FK → deals.id NULL | Из какой сделки создан |
| `customer_id` | FK → customers.id | |
| `status` | ENUM | `planning`, `active`, `on_hold`, `completed`, `cancelled` |
| `manager_id` | FK → users.id | Руководитель проекта |
| `start_date` | DATE | |
| `end_date` | DATE NULL | Планируемая дата завершения |
| `actual_end_date` | DATE NULL | |
| `budget_planned` | DECIMAL(12,2) | Плановый бюджет |
| `budget_actual` | DECIMAL(12,2) | Фактические затраты |
| `progress` | INTEGER | % выполнения (0–100) |
| `metadata` | JSONB | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

#### `project_members` (N-N: проект ↔ сотрудники)

| Поле | Тип | Описание |
|------|-----|----------|
| `project_id` | FK → projects.id | |
| `user_id` | FK → users.id | |
| `role` | ENUM | `manager`, `executor`, `watcher` |
| `PK (project_id, user_id)` | | |

#### `project_milestones` (Этапы)

| Поле | Тип | Описание |
|------|-----|----------| 
| `id` | UUID PK | |
| `project_id` | FK → projects.id | |
| `name` | VARCHAR(200) | |
| `description` | TEXT | |
| `order` | INTEGER | Порядок |
| `due_date` | DATE | Дедлайн этапа |
| `status` | ENUM | `pending`, `in_progress`, `done` |
| `progress` | INTEGER | % выполнения этапа |

### 4.3. Бизнес-логика

#### Создание проекта из сделки

```
Deal.status = 'won'
    │
    ├─ Создание Project (name = deal.title, customer_id, deal_id, budget = deal.amount)
    ├─ Назначение manager = deal.assigned_to
    ├─ Создание этапов по шаблону (настраиваемые шаблоны по типу услуги)
    ├─ Создание начальных задач
    ├─ Уведомление участников
    └─ Обновление deal.project_id
```

### 4.4. Связи

| Связь | Описание |
|-------|----------|
| Projects ← CRM | Создание из сделки (DealWon event) |
| Projects → Tasks | Задачи внутри проекта |
| Projects → Finance | Бюджет, акты, финансовое закрытие |
| Projects → Documents | Договор, ТЗ, акты |

---

## Модуль 5: Финансы (Finance)

### 5.1. Функции

| Функция | Описание |
|---------|----------|
| Выставление счетов | Из сделки/проекта, с генерацией PDF |
| Учёт оплат | Регистрация поступивших оплат, связка со счётом |
| Контроль задолженности | Просроченные счета, суммы долга |
| Статусы платежей | Ожидается, частично оплачено, оплачено, просрочено |
| Интеграция с 1С | Экспорт счетов/оплат в 1С (REST API) |
| Финансовая аналитика | Выручка, дебиторка, маржинальность |
| Несколько счетов по сделке | Поэтапная оплата (аванс + основная часть) |
| Кассовые символы | КВЭД/назначение платежа |

### 5.2. Сущности данных

#### `invoices` (Счета)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `number` | VARCHAR(50) | Номер счёта (сквозная нумерация) |
| `customer_id` | FK → customers.id | |
| `deal_id` | FK → deals.id NULL | |
| `project_id` | FK → projects.id NULL | |
| `issue_date` | DATE | Дата выставления |
| `due_date` | DATE | Срок оплаты |
| `subtotal` | DECIMAL(12,2) | Сумма без НДС |
| `vat_amount` | DECIMAL(12,2) | НДС |
| `total` | DECIMAL(12,2) | Итого с НДС |
| `paid_amount` | DECIMAL(12,2) | Оплаченная сумма |
| `status` | ENUM | `draft`, `sent`, `partially_paid`, `paid`, `overdue`, `cancelled` |
| `payment_method` | ENUM NULL | `bank_transfer`, `card`, `cash` |
| `items` | JSONB | [{name, qty, unit_price, vat_rate, total}] |
| `notes` | TEXT NULL | Назначение платежа |
| `pdf_file_key` | VARCHAR(500) NULL | S3 ключ сгенерированного PDF |
| `created_by` | FK → users.id | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

#### `payments` (Оплаты)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `invoice_id` | FK → invoices.id | |
| `customer_id` | FK → customers.id | |
| `amount` | DECIMAL(12,2) | |
| `payment_date` | DATE | |
| `method` | ENUM | `bank_transfer`, `card`, `cash` |
| `reference` | VARCHAR(200) | Назначение/номер платёжного документа |
| `status` | ENUM | `confirmed`, `pending`, `rejected` |
| `external_id` | VARCHAR(100) NULL | ID из 1С/банка |
| `created_at` | TIMESTAMPTZ | |

### 5.3. Бизнес-логика

#### Жизненный цикл счёта

```
draft → sent → partially_paid → paid
                 │
                 └─ overdue (если due_date < today AND paid_amount < total)
```

#### Автоматизации

| Событие | Действие |
|---------|----------|
| `DealWon` | Автосоздание счёта (черновик) из суммы сделки |
| `due_date` прошла, `paid_amount < total` | Статус → `overdue`, уведомление менеджеру |
| `payment` зарегистрирована | Пересчёт `invoice.paid_amount`, обновление статуса |
| `invoice.status = paid` | Уведомление, обновление финансовой аналитики |

### 5.4. Связи

| Связь | Описание |
|-------|----------|
| Finance ← CRM | Счёт создаётся из сделки |
| Finance → Documents | Генерация счёта в PDF |
| Finance → Analytics | Финансовая аналитика |
| Finance → 1С | Экспорт данных (post-MVP) |

---

## Модуль 6: Документы (Documents)

### 6.1. Функции

| Функция | Описание |
|---------|----------|
| Генерация КП | Из шаблона + данных сделки |
| Генерация договоров | Из шаблона + данных клиента/сделки |
| Генерация счетов | PDF из данных счёта |
| Шаблоны | DOCX/PDF шаблоны с плейсхолдерами |
| Хранение | Все документы в S3, версионность |
| Привязка к сущностям | Документы привязаны к клиенту/сделке/проекту |
| Отправка | Прямо из системы: email, Telegram |
| Электронные подписи | Хранение скан-копий с подписями (post-MVP: криптоПро) |
| История версий | Каждое изменение документа создаёт новую версию |

### 6.2. Сущности данных

#### `documents`

| Поле | Тип | Oписание |
|------|-----|----------|
| `id` | UUID PK | |
| `type` | ENUM | `quote` (КП), `contract`, `invoice`, `act`, `specification`, `other` |
| `name` | VARCHAR(500) | |
| `customer_id` | FK NULL | |
| `deal_id` | FK NULL | |
| `project_id` | FK NULL | |
| `invoice_id` | FK NULL | |
| `template_id` | FK → document_templates.id NULL | |
| `version` | INTEGER | Версия (1, 2, 3...) |
| `status` | ENUM | `draft`, `generated`, `sent`, `signed`, `expired`, `archived` |
| `file_key` | VARCHAR(500) | S3 ключ |
| `file_name` | VARCHAR(255) | Имя файла |
| `file_size` | BIGINT | Размер (байт) |
| `mime_type` | VARCHAR(100) | |
| `created_by` | FK → users.id | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

#### `document_templates` (Шаблоны)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `name` | VARCHAR(200) | |
| `type` | ENUM | `quote`, `contract`, `invoice`, `act` |
| `template_body` | TEXT | DOCX/PDF шаблон (base64 или S3 key) |
| `variables_schema` | JSONB | Описание переменных {name, type, required} |
| `is_active` | BOOLEAN | |

#### `document_versions`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `document_id` | FK → documents.id | |
| `version` | INTEGER | |
| `file_key` | VARCHAR(500) | |
| `changed_by` | FK → users.id | |
| `change_note` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

### 6.3. Бизнес-логика

#### Генерация документа

```
Менеджер выбирает: Сделка → "Создать КП" → выбор шаблона
    │
    ├─ Загрузка шаблона (DOCX)
    ├─ Заполнение плейсхолдеров данными:
    │   {customer_name}, {deal_amount}, {date}, {items[]}, {manager_name}
    ├─ Конвертация DOCX → PDF (LibreOffice headless)
    ├─ Загрузка в S3
    ├─ Создание записи document (status=generated)
    ├─ Привязка к deal/customer
    └─ Готов к отправке / скачиванию
```

#### Плейсхолдеры в шаблонах

| Плейсхолдер | Значение |
|-------------|----------|
| `{{customer.name}}` | Наименование клиента |
| `{{customer.inn}}` | ИНН |
| `{{deal.title}}` | Название сделки |
| `{{deal.amount_formatted}}` | Сумма прописью |
| `{{date}}` | Текущая дата |
| `{{manager.name}}` | Менеджер |
| `{{items}}` | Таблица позиций (cycle/foreach) |

### 6.4. Связи

| Связь | Описание |
|-------|----------|
| Documents ← CRM | КП из сделки, договор из сделки |
| Documents ← Finance | Счёт-документ из финансов |
| Documents → Comms | Отправка документа по email/Telegram |

---

## Модуль 7: Маркетинг (Marketing)

> **Приоритет: Post-MVP.** Базовая сегментация доступна в MVP.

### 7.1. Функции

| Функция | Описание |
|---------|----------|
| Сегментация клиентов | По тегам, отрасли, статусу, источнику, сумме сделок |
| CAMPAIGNS | Учёт маркетинговых кампаний и UTM-меток |
| Источники лидов | Аналитика по источникам (ROI по каналу) |
| Рассылки (post-MVP) | Email/Telegram-рассылки по сегментам |
| Лендинги/формы | Учёт конверсии веб-форм |
| Промокоды | Учёт и валидация промокодов |

### 7.2. Сущности данных

#### `marketing_campaigns`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `name` | VARCHAR(200) | |
| `channel` | ENUM | `google_ads`, `yandex_direct`, `social`, `email`, `offline` |
| `start_date` / `end_date` | DATE | |
| `budget` | DECIMAL(12,2) | |
| `utm_source` / `utm_medium` / `utm_campaign` | VARCHAR | UTM-метки |
| `status` | ENUM | `planned`, `active`, `paused`, `completed` |
| `leads_count` | INTEGER | (вычисляемое) |
| `deals_won_count` | INTEGER | (вычисляемое) |
| `revenue` | DECIMAL(12,2) | (вычисляемое) |

#### `customer_segments` (сегменты клиентов)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `name` | VARCHAR(200) | |
| `filter_criteria` | JSONB | Правила фильтрации (DSL) |
| `members_count` | INTEGER | (вычисляемое, кэшируется) |
| `updated_at` | TIMESTAMPTZ | |

### 7.3. Связи

| Связь | Описание |
|-------|----------|
| Marketing ← CRM | Источник данных: клиенты, лиды, сделки |
| Marketing → Analytics | ROI, CAC, LTV |

---

## Модуль 8: Календарь (Calendar)

### 8.1. Функции

| Функция | Описание |
| synced с задачами | Задачи с due_date отображаются в календаре |
| События | Встречи, звонки, демо, напоминания |
| Напоминания | Push/email/Telegram за X мин до события |
| Несколько календарей | Личный, командный, по проектам |
| iCal экспорт | Подписка на внешний календарь |
| Связь с сущностями | Событие привязано к клиенту/сделке/проекту |
| Проверка занятости | Free/busy для команды (кто свободен) |
| Повторяющиеся события | daily, weekly, monthly |
| Участники | Приглашение сотрудников на событие |

### 8.2. Сущности данных

#### `calendar_events`

| Поле | Тип | Oписание |
|------|-----|----------|
| `id` | UUID PK | |
| `title` | VARCHAR(500) | |
| `description` | TEXT | |
| `type` | ENUM | `meeting`, `call`, `demo`, `reminder`, `other` |
| `start_at` | TIMESTAMPTZ | |
| `end_at` | TIMESTAMPTZ | |
| `all_day` | BOOLEAN | |
| `location` | VARCHAR(500) NULL | Адрес / ссылка на видеовстречу |
| `organizer_id` | FK → users.id | |
| `customer_id` | FK NULL | |
| `deal_id` | FK NULL | |
| `project_id` | FK NULL | |
| `task_id` | FK → tasks.id NULL | |
| `status` | ENUM | `scheduled`, `completed`, `cancelled`, `no_show` |
| `recurrence_rule` | VARCHAR(200) NULL | RRULE (RFC 5545) |
| `metadata` | JSONB | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

#### `event_participants`

| Поле | Тип | Описание |
|------|-----|----------|
| `event_id` | FK → calendar_events.id | |
| `user_id` | FK → users.id | |
| `status` | ENUM | `invited`, `accepted`, `declined`, `tentative` |
| `PK (event_id, user_id)` | | |

### 8.3. Бизнес-логика

- При создании задачи типа `meeting` или `call` → автоматически создаётся calendar_event
- При изменении статуса события → обновление связанной задачи
- iCal экспорт: `/api/v1/calendar/ical/{user_id}/{token}` (публичная ссылка с токеном)
- Напоминания: Celery Beat проверяет каждые 5 мин события, до начала которых < 15 мин

### 8.4. Связи

| Связь | Описание |
|-------|----------|
| Calendar ← Tasks | Задачи-события |
| Calendar ← CRM | Встречи в рамках сделки |
| Calendar → Notifications | Напоминания |

---

## Модуль 9: Администрирование (Admin)

### 9.1. Функции

| Функция | Описание |
|---------|----------|
| Управление пользователями | Создание, блокировка, сброс пароля |
| Роли и права | RBAC: роли + гранулярные разрешения |
| Настройки системы | Воронки, этапы, шаблоны документов, SLA |
| Пользовательские поля | Кастомные поля для клиентов/сделок |
| Журнал аудита | Логирование всех действий с чувствительными данными |
| Управление интеграциями | Telegram-бот токены, email-ящики, телефония |
| Бэкапы и восстановление | Настройка расписания бэкапов |
| Системные журналы | Просмотр системных логов, ошибок |
| Импорт/экспорт | Массовая загрузка данных (CSV) |

### 9.2. Сущности данных

#### `users` (Сотрудники)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `email` | VARCHAR(255) UNIQUE | Логин |
| `phone` | VARCHAR(20) | |
| `first_name` / `last_name` | VARCHAR(100) | |
| `position` | VARCHAR(200) | Должность |
| `department_id` | FK → departments.id NULL | Отдел |
| `role_id` | FK → roles.id | Роль |
| `avatar_key` | VARCHAR(500) NULL | S3 |
| `is_active` | BOOLEAN | |
| `is_superuser` | BOOLEAN | |
| `telegram_id` | VARCHAR(50) NULL | Для уведомлений |
| `phone_e164` | VARCHAR(20) | Для click-to-call |
| `last_login_at` | TIMESTAMPTZ NULL | |
| `created_at` / `updated_at` | TIMESTPAMPZ | |

#### `roles`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `name` | VARCHAR(100) | `admin`, `manager`, `sales`, `finance`, `executor`, `readonly` |
| `description` | TEXT | |
| `is_system` | BOOLEAN | Системная роль (нельзя удалить) |

#### `permissions` (Гранулярные права)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `code` | VARCHAR(100) UNIQUE | `crm.customers.read`, `crm.deals.write`, `finance.invoices.delete` |
| `module` | VARCHAR(50) | `crm`, `finance`, `tasks`... |
| `action` | ENUM | `read`, `create`, `update`, `delete`, `export`, `assign` |
| `description` | TEXT | |

#### `role_permissions` (N-N)

| Поле | Тип | Описание |
|------|-----|----------|
| `role_id` | FK → roles.id | |
| `permission_id` | FK → permissions.id | |
| `PK (role_id, permission_id)` | | |

#### `departments`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `name` | VARCHAR(200) | |
| `parent_id` | FK → departments.id NULL | Иерархия |
| `manager_id` | FK → users.id NULL | Руководитель отдела |

#### `audit_log`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID PK | |
| `user_id` | FK → users.id NULL | Кто |
| `action` | ENUM | `create`, `read`, `update`, `delete`, `login`, `logout`, `export` |
| `entity_type` | VARCHAR(50) | `customer`, `lead`, `deal`, `invoice`... |
| `entity_id` | UUID NULL | |
| `changes` | JSONB | {field: {old, new}} |
| `ip_address` | INET | |
| `user_agent` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

> **Партицирование:** `audit_log` партицируется по месяцам.

### 9.3. Матрица ролей и прав

| Разрешение | Admin | Manager | Sales | Finance | Executor | Readonly |
|------------|:-----:|:-------:|:-----:|:-------:|:--------:|:--------:|
| **CRM** | | | | | | |
| customers: read all | ✅ | ✅ | ✅ | ✅ | 🔶 свои | ✅ |
| customers: write | ✅ | ✅ | ✅ | ❌ | 🔶 свои | ❌ |
| leads: read all | ✅ | ✅ | 🔶 свои | ❌ | ❌ | ✅ |
| leads: write | ✅ | ✅ | 🔶 свои | ❌ | ❌ | ❌ |
| deals: read all | ✅ | ✅ | 🔶 свои | ✅ | 🔶 свои | ✅ |
| deals: write | ✅ | ✅ | 🔶 свои | ❌ | ❌ | ❌ |
| **Финансы** | | | | | | |
| invoices: read | ✅ | ✅ | 🔶 свои | ✅ | ❌ | ✅ |
| invoices: write | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| payments: register | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Задачи** | | | | | | |
| tasks: assign | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| tasks: execute | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Администрирование** | | | | | | |
| users: manage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| settings: manage | ✅ | ❌ | │ │ │ ❌ |
| audit: read | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> 🔶 = только записи, назначенные пользователю или его отделу

### 9.4. Связи

| Связь | Описание |
|-------|----------|
| Admin → All modules | Роли и права применяются ко всем модулям |
| Admin ← Audit | Все модули пишут в audit_log |

---

## Сводная таблица связей между модулями

```
                    ┌─────────┐
                    │  Admin  │ (RBAC, audit, settings)
                    └────┬────┘
                         │ applies to all
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
┌────────┐         ┌──────────┐         ┌──────────┐
│ Comms  │────────▶│   CRM    │◀────────│ Finance  │
│(каналы)│ creates │ (ядро)   │ creates │ (счета)  │
└────────┘  leads  └────┬─────┘  deals  └──────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
     ┌──────────┐ ┌──────────┐ ┌──────────┐
     │  Tasks   │ │ Projects │ │Documents │
     │ (контр.) │ │ (исполн.)│ │ (КП/дог.)│
     └──────────┘ └────┬─────┘ └──────────┘
                      │
                      ▼
               ┌──────────┐
               │ Calendar │ (события, встречи)
               └──────────┘
                      │
                      ▼
               ┌──────────┐
               │ Analytics│ (отчёты, дашборды)
               └──────────┘
```

| Источник → Цель | Триггер | Действие |
|-----------------|---------|----------|
| Comms → CRM | Входящее сообщение | Создание Lead + Interaction |
| CRM → Tasks | LeadCreated, DealStageChanged | Авто-создание задач |
| CRM → Finance | DealWon | Создание Invoice (draft) |
| CRM → Documents | Manager action | Генерация КП/договора |
| CRM → Projects | DealWon | Создание Project |
| Finance → Analytics | PaymentReceived | Обновление фин. метрик |
| Tasks → Calendar | Task(meeting/call) | Создание CalendarEvent |
| Tasks → Notifications | TaskOverdue, TaskDone | Уведомления |
| Admin → All | Login, CRUD | Запись в audit_log |
