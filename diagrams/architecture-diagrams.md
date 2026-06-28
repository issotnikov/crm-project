# Архитектурные диаграммы (Mermaid)

> Все диаграммы в формате Mermaid для рендеринга в GitHub/GitLab или любом Markdown-просмотрщике с поддержкой Mermaid.

---

## 1. System Architecture (C4 — Container Level)

```mermaid
graph TB
    subgraph "External Channels"
        TG[Telegram Bot API]
        MAIL[Mail Server<br/>IMAP/SMTP]
        VOIP[VoIP Provider<br/>Mango/UIS]
        WEB[Website<br/>Form]
    end

    subgraph "CRM System"
        subgraph "Frontend"
            UI[React SPA<br/>TypeScript + Vite]
        end

        subgraph "Backend"
            API[FastAPI<br/>REST API + WebSocket]
            WK1[Celery Worker<br/>Ingestion Queue]
            WK2[Celery Worker<br/>Default Queue]
            WK3[Celery Worker<br/>Documents Queue]
            BEAT[Celery Beat<br/>Scheduler]
        end

        subgraph "Data Layer"
            PG[(PostgreSQL 16<br/>Primary + Read Replicas)]
            REDIS[(Redis 7<br/>Broker + Cache)]
            MINIO[(MinIO / S3<br/>File Storage)]
        end

        subgraph "Infrastructure"
            NGINX[Nginx<br/>Reverse Proxy + TLS]
        end
    end

    subgraph "External Integrations"
        ONES[1С: Бухгалтерия<br/>Post-MVP]
        ES[Elasticsearch<br/>Post-MVP]
    end

    TG -->|Long Poll / Webhook| WK1
    MAIL -->|IMAP IDLE| WK1
    VOIP -->|Webhook| API
    WEB -->|POST /public/leads| API

    UI -->|HTTPS / WebSocket| NGINX
    NGINX -->|Proxy| API

    API --> PG
    API --> REDIS
    WK1 --> PG
    WK1 --> REDIS
    WK2 --> PG
    WK2 --> REDIS
    WK3 --> MINIO
    WK3 --> PG
    BEAT --> REDIS

    API --> MINIO
    WK1 --> MINIO

    API -.->|Post-MVP| ONES
    WK2 -.->|Post-MVP| ES

    style TG fill:#30A4DC,color:#fff
    style UI fill:#61DAFB,color:#000
    style API fill:#009688,color:#fff
    style PG fill:#336791,color:#fff
    style REDIS fill:#DC382D,color:#fff
    style MINIO fill:#C72E49,color:#fff
    style NGINX fill:#009639,color:#fff
```

---

## 2. Data Flow: Incoming Request → Lead → Deal → Project

```mermaid
flowchart LR
    subgraph "Channels"
        TG[Telegram]
        EM[Email]
        PH[Phone]
        WF[Web Form]
    end

    subgraph "Ingestion"
        IR[Incoming Request<br/>raw_payload]
        NR[Normalize]
        DD[Deduplicate]
    end

    subgraph "CRM Core"
        CUST[Customer]
        LEAD[Lead]
        DEAL[Deal]
        PROJ[Project]
    end

    subgraph "Connected Modules"
        INTER[Interaction<br/>Timeline]
        TASK[Task]
        INV[Invoice]
        DOC[Document<br/>КП/Договор]
        EVT[Calendar Event]
    end

    TG --> IR
    EM --> IR
    PH --> IR
    WF --> IR

    IR --> NR --> DD
    DD -->|find or create| CUST
    DD -->|create| LEAD
    NR -->|create| INTER

    LEAD -->|convert| DEAL
    LEAD -->|auto-create| TASK

    DEAL -->|stage change| INTER
    DEAL -->|generate| DOC
    DEAL -->|schedule| EVT

    DEAL -->|won| PROJ
    DEAL -->|won| INV

    PROJ -->|milestones| TASK

    CUST --> INTER
    LEAD --> INTER
    DEAL --> INTER

    style TG fill:#30A4DC,color:#fff
    style LEAD fill:#F59E0B,color:#000
    style DEAL fill:#8B5CF6,color:#fff
    style PROJ fill:#10B981,color:#fff
    style INV fill:#84CC16,color:#000
```

---

## 3. Domain Events Flow

```mermaid
flowchart TD
    subgraph "Producers"
        COMMS[Comms Module]
        CRM[CRM Module]
        FIN[Finance Module]
        TASKS[Tasks Module]
    end

    subgraph "Event Bus (Redis Pub/Sub + Celery)"
        EB((Event Bus))
    end

    subgraph "Consumers"
        N1[Notification Service]
        N2[Analytics Service]
        N3[Auto-Task Engine]
        N4[WebSocket Gateway]
        N5[Audit Logger]
    end

    COMMS -->|IncomingRequestReceived| EB
    CRM -->|LeadCreated| EB
    CRM -->|LeadQualified| EB
    CRM -->|DealStageChanged| EB
    CRM -->|DealWon| EB
    CRM -->|DealLost| EB
    FIN -->|PaymentReceived| EB
    FIN -->|InvoiceOverdue| EB
    TASKS -->|TaskOverdue| EB
    TASKS -->|TaskCompleted| EB

    EB --> N1
    EB --> N2
    EB --> N3
    EB --> N4
    EB --> N5

    style EB fill:#DC382D,color:#fff
    style COMMS fill:#3B82F6,color:#fff
    style CRM fill:#8B5CF6,color:#fff
    style FIN fill:#84CC16,color:#000
```

---

## 4. Deployment Architecture

```mermaid
graph TB
    subgraph "Internet"
        USERS[Users]
        EXT_CH[External Channels<br/>TG, Mail, VoIP]
    end

    subgraph "DMZ (Public Network)"
        FW[Firewall]
        WAF[WAF + Nginx<br/>TLS termination<br/>Rate limiting]
    end

    subgraph "Application Network"
        LB[Load Balancer<br/>optional]

        subgraph "App Tier"
            APP1[FastAPI Instance 1]
            APP2[FastAPI Instance 2]
            APPN[FastAPI Instance N]
        end

        subgraph "Worker Tier"
            WKR1[Celery Workers<br/>ingestion queue]
            WKR2[Celery Workers<br/>default queue]
            WKR3[Celery Workers<br/>documents queue]
            BEAT[Celery Beat]
        end
    end

    subgraph "Data Network (Isolated)"
        PG_M[(PostgreSQL<br/>Master)]
        PG_R1[(PostgreSQL<br/>Read Replica 1)]
        PG_RN[(PostgreSQL<br/>Read Replica N)]
        REDIS_M[(Redis<br/>Master)]
        REDIS_S[(Redis<br/>Sentinel/Replica)]
        MINIO_S[(MinIO<br/>Cluster)]
    end

    subgraph "Monitoring"
        PROM[Prometheus]
        GRAF[Grafana]
        LOKI[Loki]
        ALERT[Alertmanager]
    end

    USERS -->|HTTPS| FW
    EXT_CH -->|Webhooks| FW
    FW --> WAF
    WAF --> LB
    LB --> APP1
    LB --> APP2
    LB --> APPN

    APP1 --> PG_M
    APP1 --> REDIS_M
    APP2 --> PG_R1
    APPN --> MINIO_S

    WKR1 --> PG_M
    WKR1 --> REDIS_M
    WKR2 --> PG_M
    WKR3 --> MINIO_S
    BEAT --> REDIS_M

    PG_M --> PG_R1
    PG_M --> PG_RN
    REDIS_M --> REDIS_S

    PROM --> APP1
    PROM --> PG_M
    PROM --> REDIS_M
    PROM --> GRAF
    PROM --> ALERT

    style WAF fill:#009639,color:#fff
    style PG_M fill:#336791,color:#fff
    style REDIS_M fill:#DC382D,color:#fff
    style MINIO_S fill:#C72E49,color:#fff
```

---

## 5. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant N as Nginx
    participant A as API (FastAPI)
    participant R as Redis
    participant D as PostgreSQL

    U->>N: POST /auth/login {email, password}
    N->>A: Proxy request
    A->>D: SELECT user WHERE email=?
    D-->>A: User record (with password_hash)
    A->>A: bcrypt.verify(password, hash)
    
    alt Valid credentials
        A->>A: Generate JWT access (15min) + refresh (7d)
        A->>R: Store session {user_id, refresh_token, expires}
        A-->>N: 200 {access_token, refresh_token}
        N-->>U: Set httpOnly cookie (refresh) + JSON body (access)
    else Invalid
        A-->>N: 401 Unauthorized
        N-->>U: 401 {error: "Invalid credentials"}
    end

    Note over U,D: Subsequent requests with access_token

    U->>N: GET /customers (Authorization: Bearer <access>)
    N->>A: Proxy + verify JWT
    A->>A: Verify JWT signature + expiry
    A->>A: Check RBAC permissions
    A->>D: Query customers
    D-->>A: Results
    A-->>N: 200 {data: [...]}
    N-->>U: Response

    Note over U,D: Token refresh flow

    U->>N: POST /auth/refresh {refresh_token}
    N->>A: Proxy
    A->>R: Check refresh_token validity
    R-->>A: Valid
    A->>A: Generate new access_token
    A-->>N: 200 {access_token}
    N-->>U: New token
```

---

## 6. Module Dependencies

```mermaid
graph TD
    ADMIN[Admin<br/>RBAC, Audit, Settings]

    COMMS[Comms<br/>TG, Email, Phone, Web]
    CRM[CRM Core<br/>Customers, Leads, Deals]
    TASKS[Tasks<br/>Management, SLA]
    PROJECTS[Projects<br/>Post-sale]
    FIN[Finance<br/>Invoices, Payments]
    DOCS[Documents<br/>КП, Contracts]
    CAL[Calendar<br/>Events, Reminders]
    MKT[Marketing<br/>Segments, Campaigns]
    AN[Analytics<br/>Dashboards, Reports]

    COMMS -->|creates leads| CRM
    CRM -->|auto-creates| TASKS
    CRM -->|on won → creates| PROJECTS
    CRM -->|on won → creates| FIN
    CRM -->|generates from deal| DOCS
    TASKS -->|meeting/call → creates| CAL
    PROJECTS -->|milestones → tasks| TASKS
    FIN -->|invoices → generates| DOCS
    MKT -->|reads data from| CRM
    AN -->|aggregates from all| CRM
    AN -->|aggregates from| FIN
    AN -->|aggregates from| TASKS

    ADMIN -.->|applies RBAC to| CRM
    ADMIN -.->|applies RBAC to| COMMS
    ADMIN -.->|applies RBAC to| TASKS
    ADMIN -.->|applies RBAC to| FIN

    style CRM fill:#8B5CF6,color:#fff,stroke:#7C3AED,stroke-width:3px
    style COMMS fill:#3B82F6,color:#fff
    style ADMIN fill:#6B7280,color:#fff
```

---

## 7. Lead Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> New: Создан из канала

    New --> InProgress: Менеджер взял в работу
    New --> AutoAssigned: Round-robin назначение

    AutoAssigned --> InProgress: Менеджер реагирует
    AutoAssigned --> Rejected: SLA нарушен / нецелевой

    InProgress --> Qualified: Квалифицирован (валидный)
    InProgress --> Rejected: Спам / дубль / нецелевой

    Qualified --> Converted: Конвертация в сделку
    Rejected --> [*]: Закрыт с причиной

    Converted --> [*]: Сделка создана
```

---

## 8. Deal Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Created: Из лида / вручную

    Created --> Qualification: Стадия: Квалификация

    Qualification --> Meeting: Стадия: Встреча
    Meeting --> QuoteSent: Стадия: КП отправлено
    QuoteSent --> Meeting: Доработка КП
    QuoteSent --> Negotiation: Стадия: Переговоры

    Negotiation --> QuoteSent: Новое КП
    Negotiation --> Contract: Стадия: Договор

    Contract --> Payment: Стадия: Оплата
    Contract --> Lost: Отказ

    Payment --> Won: Оплата получена
    Payment --> Lost: Отказ

    Qualification --> Lost: Отказ
    Meeting --> Lost: Отказ
    Negotiation --> Lost: Отказ

    Won --> [*]: Проект + Счёт созданы
    Lost --> [*]: Закрыт с причиной
```
