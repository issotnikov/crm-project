# 📧 Email модуль — приём и отправка почты

Модуль email является **опциональным** и включается через переменные окружения.
Когда модуль отключён (по умолчанию), CRM работает в демо-режиме с мок-данными.

---

## Быстрый старт

### Шаг 1. Добавьте переменные в `.env`

```bash
# Включение email модуля
EMAIL_ENABLED=true

# IMAP (приём почты)
EMAIL_IMAP_HOST=imap.yandex.ru
EMAIL_IMAP_PORT=993

# SMTP (отправка почты)
EMAIL_SMTP_HOST=smtp.yandex.ru
EMAIL_SMTP_PORT=465

# Учётные данные
EMAIL_USER=sales@your-domain.ru
EMAIL_PASSWORD=your_app_password

# Отображаемое имя
EMAIL_FROM_NAME=CRM System
```

### Шаг 2. Перезапустите CRM

```bash
docker compose down
docker compose up -d
```

### Шаг 3. Проверьте

Откройте CRM → раздел **✉️ Почта**. В заголовке должно быть:
> ✅ Подключено: sales@your-domain.ru

---

## Готовые пресеты для провайдеров

### Яндекс 360 (почта для бизнеса)

```bash
EMAIL_ENABLED=true
EMAIL_IMAP_HOST=imap.yandex.ru
EMAIL_IMAP_PORT=993
EMAIL_SMTP_HOST=smtp.yandex.ru
EMAIL_SMTP_PORT=465
EMAIL_USER=you@yandex.ru
EMAIL_PASSWORD=app_password
EMAIL_FROM_NAME=CRM System
```

> ⚠️ **Важно:** Используйте **пароль приложения** (App Password), а не основной пароль.
> Создать: Яндекс → Настройки → Безопасность → Пароли приложений.

Также включите IMAP: **Настройки → Все настройки → Почтовые программы → IMAP**.

### Google Workspace (Gmail)

```bash
EMAIL_ENABLED=true
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_IMAP_PORT=993
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=465
EMAIL_USER=you@gmail.com
EMAIL_PASSWORD=xxxx_xxxx_xxxx_xxxx
EMAIL_FROM_NAME=CRM System
```

> ⚠️ **Обязательно:** 16-значный App Password (Google Account → Security → App passwords).
> Включите IMAP: Gmail Settings → Forwarding and POP/IMAP → Enable IMAP.

### Mail.ru для бизнеса

```bash
EMAIL_ENABLED=true
EMAIL_IMAP_HOST=imap.mail.ru
EMAIL_IMAP_PORT=993
EMAIL_SMTP_HOST=smtp.mail.ru
EMAIL_SMTP_PORT=465
EMAIL_USER=you@domain.ru
EMAIL_PASSWORD=your_password
EMAIL_FROM_NAME=CRM System
```

### Microsoft Exchange / Office 365

```bash
EMAIL_ENABLED=true
EMAIL_IMAP_HOST=outlook.office365.com
EMAIL_IMAP_PORT=993
EMAIL_SMTP_HOST=smtp.office365.com
EMAIL_SMTP_PORT=587
EMAIL_USER=you@company.com
EMAIL_PASSWORD=your_password
EMAIL_FROM_NAME=CRM System
```

> Порт 587 использует STARTTLS (автоопределяется системой).

### Свой почтовый сервер (Postfix, Dovecot, и т.д.)

```bash
EMAIL_ENABLED=true
EMAIL_IMAP_HOST=mail.your-domain.ru
EMAIL_IMAP_PORT=993
EMAIL_SMTP_HOST=mail.your-domain.ru
EMAIL_SMTP_PORT=465
EMAIL_USER=crm@your-domain.ru
EMAIL_PASSWORD=strong_password
EMAIL_FROM_NAME=CRM System
```

---

## Справочник по портам

| Порт | Протокол | Назначение |
|------|----------|------------|
| **993** | IMAPS | Приём почты (SSL/TLS) — рекомендуется |
| 143 | IMAP | Приём почты (plain, без шифрования) |
| **465** | SMTPS | Отправка почты (SSL/TLS) — рекомендуется |
| 587 | SMTP | Отправка почты (STARTTLS) |

---

## Режимы работы

### 🟢 Live режим (EMAIL_ENABLED=true)

Реальная интеграция с почтовым сервером:
- **Приём:** письма загружаются по IMAP из папки Входящие
- **Отправка:** письма отправляются через SMTP
- Парсинг вложений, тем с кодировками, multipart-сообщений

### 🟡 Mock режим (по умолчанию, EMAIL_ENABLED не задан)

Демонстрационные данные:
- 4 входящих письма (от клиентов: Ромашка, ТехноЛогик, Петров, Смирнова)
- 3 отправленных письма
- «Отправка» имитируется (показывается успех, но реальная отправка не выполняется)

Позволяет увидеть интерфейс без настройки почтового сервера.

---

## Возможности модуля

### 📥 Входящие
- Список писем с аватарами отправителей
- Непрочитанные выделяются жирным + синяя точка
- ⭐ Звёздочки для важных писем
- 📎 Индикатор вложений
- Время получения («15 мин», «2 ч», «вчера»)
- Бейдж с количеством непрочитанных в sidebar

### 📤 Отправленные
- История отправленных писем
- Привязка к клиенту/сделке

### ✏️ Написание письма
- Поле «Кому» (email + имя)
- Тема и текст
- Кнопка «📤 Отправить»
- Статус отправки (⏳ → ✅)

### 🔍 Детали письма (клик по письму)
- Полный текст
- Вложения (с размером и кнопкой «Скачать»)
- Метаданные (отправитель, дата, привязка к клиенту)
- Кнопка «↩ Ответить»

---

## Переменные окружения (полный список)

| Переменная | По умолчанию | Описание |
|------------|-------------|----------|
| `EMAIL_ENABLED` | `false` | Включить модуль email |
| `EMAIL_IMAP_HOST` | — | Хост IMAP сервера |
| `EMAIL_IMAP_PORT` | `993` | Порт IMAP (993/143) |
| `EMAIL_SMTP_HOST` | — | Хост SMTP сервера |
| `EMAIL_SMTP_PORT` | `465` | Порт SMTP (465/587) |
| `EMAIL_USER` | — | Логин/ящик |
| `EMAIL_PASSWORD` | — | Пароль (App Password) |
| `EMAIL_FROM_NAME` | `CRM System` | Отображаемое имя |

---

## API Endpoints

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/api/v1/integrations/email/status` | Статус и конфигурация |
| GET | `/api/v1/integrations/email/inbox` | Входящие письма |
| GET | `/api/v1/integrations/email/sent` | Отправленные письма |
| POST | `/api/v1/integrations/email/send` | Отправить письмо |
| GET | `/api/v1/integrations/email/providers/{provider}` | Пресет настроек |

Провайдеры: `yandex`, `gmail`, `mailru`, `exchange`, `custom`

---

## Безопасность

1. **Никогда не коммитьте пароли** в git — используйте `.env`
2. Используйте **App Passwords** вместо основных паролей (особенно для Gmail/Yandex)
3. Файл `.env` должен быть в `.gitignore`
4. Для production используйте отдельный почтовый ящик (например `crm@your-domain.ru`)
5. Регулярно ротируйте пароли приложений

---

## Решение проблем

### Ошибка "Authentication failed"
- Проверьте логин/пароль
- Для Gmail/Yandex: используйте App Password, не основной пароль
- Включите IMAP в настройках провайдера

### Ошибка "Connection refused"
- Проверьте хост и порт
- Убедитесь, что фаервол не блокирует порты 993/465
- Проверьте DNS-резолвинг хоста

### Письма не приходят
- Проверьте, что ящик существует и работает
- Убедитесь, что IMAP включён у провайдера
- Проверьте спам-фильтры

### Отправка не работает (mock режим)
- Убедитесь, что `EMAIL_ENABLED=true` в `.env`
- Проверьте, что API контейнер видит переменные: `docker exec crm-api env | grep EMAIL`
