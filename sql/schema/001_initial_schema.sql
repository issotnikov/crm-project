-- ============================================================================
-- CRM SYSTEM — DATABASE SCHEMA (PostgreSQL 16)
-- DDL for all tables
-- Version: 1.0
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- fuzzy search for dedup
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE customer_type AS ENUM ('individual', 'company');
CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'vip', 'blacklist');
CREATE TYPE lead_source AS ENUM ('telegram', 'email', 'phone', 'web_form', 'manual', 'referral');
CREATE TYPE lead_status AS ENUM ('new', 'in_progress', 'qualified', 'converted', 'rejected', 'duplicate');
CREATE TYPE lead_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE lead_rejection_reason AS ENUM ('spam', 'invalid', 'duplicate', 'not_target', 'other');

CREATE TYPE deal_status AS ENUM ('open', 'won', 'lost');
CREATE TYPE deal_lost_reason AS ENUM ('price', 'competitor', 'no_decision', 'no_response', 'other');

CREATE TYPE channel_type AS ENUM ('phone', 'email', 'telegram');

CREATE TYPE interaction_type AS ENUM ('message', 'call', 'email', 'note', 'task_result', 'status_change');
CREATE TYPE comm_channel AS ENUM ('telegram', 'email', 'phone', 'internal', 'web_form');
CREATE TYPE interaction_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE interaction_status AS ENUM ('delivered', 'read', 'failed', 'missed', 'completed');

CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'review', 'done', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_type AS ENUM ('call', 'email', 'meeting', 'document', 'follow_up', 'custom');

CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE project_member_role AS ENUM ('manager', 'executor', 'watcher');
CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'done');

CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'card', 'cash');
CREATE TYPE payment_status AS ENUM ('confirmed', 'pending', 'rejected');

CREATE TYPE document_type AS ENUM ('quote', 'contract', 'invoice_doc', 'act', 'specification', 'other');
CREATE TYPE document_status AS ENUM ('draft', 'generated', 'sent', 'signed', 'expired', 'archived');

CREATE TYPE calendar_event_type AS ENUM ('meeting', 'call', 'demo', 'reminder', 'other');
CREATE TYPE event_attendance_status AS ENUM ('invited', 'accepted', 'declined', 'tentative');

CREATE TYPE audit_action AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout', 'export');

CREATE TYPE department_role AS ENUM ('head', 'deputy', 'employee');

-- ============================================================================
-- ADMIN: users, roles, permissions, departments, audit_log
-- ============================================================================

CREATE TABLE departments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(200) NOT NULL,
    parent_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_id  UUID,  -- FK to users added later
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code        VARCHAR(100) NOT NULL UNIQUE,
    module      VARCHAR(50) NOT NULL,
    action      VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id       UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    phone_e164      VARCHAR(20),
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100),
    position        VARCHAR(200),
    department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
    role_id         UUID REFERENCES roles(id),
    avatar_key      VARCHAR(500),
    is_active       BOOLEAN DEFAULT TRUE,
    is_superuser    BOOLEAN DEFAULT FALSE,
    telegram_id     VARCHAR(50),
    password_hash   VARCHAR(255),
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Back-reference: departments.manager_id
ALTER TABLE departments ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- AUDIT LOG (partitioned by month)
-- ============================================================================

CREATE TABLE audit_log (
    id          UUID DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      audit_action NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   UUID,
    changes     JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create initial partitions (example for 2026)
CREATE TABLE audit_log_2026_01 PARTITION OF audit_log FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_log_2026_02 PARTITION OF audit_log FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE audit_log_2026_03 PARTITION OF audit_log FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE audit_log_2026_04 PARTITION OF audit_log FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE audit_log_2026_05 PARTITION OF audit_log FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE audit_log_2026_06 PARTITION OF audit_log FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE audit_log_2026_07 PARTITION OF audit_log FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE audit_log_2026_08 PARTITION OF audit_log FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE audit_log_2026_09 PARTITION OF audit_log FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE audit_log_2026_10 PARTITION OF audit_log FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE audit_log_2026_11 PARTITION OF audit_log FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE audit_log_2026_12 PARTITION OF audit_log FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);

-- ============================================================================
-- CRM: CUSTOMERS, CONTACTS, CHANNELS
-- ============================================================================

CREATE TABLE customers (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type                    customer_type NOT NULL DEFAULT 'company',
    name                    VARCHAR(500) NOT NULL,
    full_legal_name         VARCHAR(500),
    inn                     VARCHAR(12) UNIQUE,
    kpp                     VARCHAR(9),
    ogrn                    VARCHAR(15),
    industry                VARCHAR(200),
    website                 VARCHAR(500),
    description             TEXT,
    status                  customer_status DEFAULT 'active',
    source                  lead_source DEFAULT 'manual',
    responsible_manager_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    merged_into_id          UUID REFERENCES customers(id) ON DELETE SET NULL,
    metadata                JSONB DEFAULT '{}',
    tags                    VARCHAR[] DEFAULT '{}',
    total_revenue           DECIMAL(12,2) DEFAULT 0,
    deals_count             INTEGER DEFAULT 0,
    created_by              UUID REFERENCES users(id),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ
);

CREATE INDEX idx_customers_status ON customers(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_manager ON customers(responsible_manager_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_inn ON customers(inn) WHERE inn IS NOT NULL;
CREATE INDEX idx_customers_name_trgm ON customers USING GIN (name gin_trgm_ops);
CREATE INDEX idx_customers_tags ON customers USING GIN (tags);

CREATE TABLE contacts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    first_name  VARCHAR(200),
    last_name   VARCHAR(200),
    position    VARCHAR(200),
    phone       VARCHAR(20),
    email       VARCHAR(255),
    telegram_id VARCHAR(50),
    is_primary  BOOLEAN DEFAULT FALSE,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_customer ON contacts(customer_id);

CREATE TABLE contact_channels (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id    UUID REFERENCES contacts(id) ON DELETE CASCADE,
    customer_id   UUID REFERENCES customers(id) ON DELETE CASCADE,
    channel_type  channel_type NOT NULL,
    channel_value VARCHAR(255) NOT NULL,
    verified      BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (channel_type, channel_value)
);

CREATE INDEX idx_channels_contact ON contact_channels(contact_id);
CREATE INDEX idx_channels_lookup ON contact_channels(channel_type, channel_value);

-- ============================================================================
-- CRM: PIPELINES, STAGES
-- ============================================================================

CREATE TABLE pipelines (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    is_default  BOOLEAN DEFAULT FALSE,
    settings    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deal_stages (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id   UUID REFERENCES pipelines(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    "order"       INTEGER NOT NULL,
    probability   INTEGER DEFAULT 0,
    is_won_stage  BOOLEAN DEFAULT FALSE,
    is_lost_stage BOOLEAN DEFAULT FALSE,
    color         VARCHAR(7) DEFAULT '#6366f1',
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stages_pipeline ON deal_stages(pipeline_id, "order");

-- ============================================================================
-- CRM: LEADS, DEALS
-- ============================================================================

CREATE TABLE leads (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id       UUID REFERENCES customers(id) ON DELETE CASCADE,
    contact_id        UUID REFERENCES contacts(id) ON DELETE SET NULL,
    title             VARCHAR(500) NOT NULL,
    description       TEXT,
    source            lead_source NOT NULL,
    source_details    JSONB DEFAULT '{}',
    status            lead_status DEFAULT 'new',
    priority          lead_priority DEFAULT 'medium',
    assigned_to       UUID REFERENCES users(id) ON DELETE SET NULL,
    deal_id           UUID,  -- FK added after deals table
    rejection_reason  lead_rejection_reason,
    utm               JSONB DEFAULT '{}',
    score             INTEGER DEFAULT 0,
    sla_deadline      TIMESTAMPTZ,
    responded_at      TIMESTAMPTZ,
    converted_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assignee ON leads(assigned_to, status);
CREATE INDEX idx_leads_priority ON leads(status, priority, created_at);
CREATE INDEX idx_leads_customer ON leads(customer_id);

CREATE TABLE deals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id         UUID REFERENCES customers(id) ON DELETE CASCADE,
    lead_id             UUID REFERENCES leads(id) ON DELETE SET NULL,
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    amount              DECIMAL(12,2) DEFAULT 0,
    currency            VARCHAR(3) DEFAULT 'RUB',
    stage_id            UUID REFERENCES deal_stages(id),
    status              deal_status DEFAULT 'open',
    expected_close_date DATE,
    actual_close_date   DATE,
    probability         INTEGER DEFAULT 0,
    assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
    lost_reason         deal_lost_reason,
    lost_reason_note    TEXT,
    project_id          UUID,  -- FK added after projects table
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Back-reference: leads.deal_id
ALTER TABLE leads ADD CONSTRAINT fk_leads_deal
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

CREATE INDEX idx_deals_stage ON deals(stage_id, status);
CREATE INDEX idx_deals_assignee ON deals(assigned_to, status);
CREATE INDEX idx_deals_customer ON deals(customer_id);
CREATE INDEX idx_deals_status ON deals(status);

-- ============================================================================
-- INTERACTIONS (partitioned by month)
-- ============================================================================

CREATE TABLE interactions (
    id                UUID DEFAULT uuid_generate_v4(),
    interaction_type  interaction_type NOT NULL,
    channel           comm_channel NOT NULL,
    direction         interaction_direction NOT NULL,
    customer_id       UUID REFERENCES customers(id) ON DELETE CASCADE,
    contact_id        UUID REFERENCES contacts(id) ON DELETE SET NULL,
    lead_id           UUID REFERENCES leads(id) ON DELETE SET NULL,
    deal_id           UUID REFERENCES deals(id) ON DELETE SET NULL,
    project_id        UUID,  -- FK added after projects
    subject           VARCHAR(500),
    body_text         TEXT,
    body_html         TEXT,
    from_address      VARCHAR(255),
    to_address        VARCHAR(255),
    external_id       VARCHAR(255),
    external_metadata JSONB DEFAULT '{}',
    status            interaction_status,
    duration          INTEGER,
    recording_url     VARCHAR(500),
    attachments       JSONB DEFAULT '[]',
    created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, created_at),
    UNIQUE (channel, external_id, created_at)
) PARTITION BY RANGE (created_at);

-- Partitions for 2026
CREATE TABLE interactions_2026_01 PARTITION OF interactions FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE interactions_2026_02 PARTITION OF interactions FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE interactions_2026_03 PARTITION OF interactions FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE interactions_2026_04 PARTITION OF interactions FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE interactions_2026_05 PARTITION OF interactions FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE interactions_2026_06 PARTITION OF interactions FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE interactions_2026_07 PARTITION OF interactions FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE interactions_2026_08 PARTITION OF interactions FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE interactions_2026_09 PARTITION OF interactions FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE interactions_2026_10 PARTITION OF interactions FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE interactions_2026_11 PARTITION OF interactions FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE interactions_2026_12 PARTITION OF interactions FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE INDEX idx_interactions_customer ON interactions(customer_id, created_at DESC);
CREATE INDEX idx_interactions_lead ON interactions(lead_id, created_at DESC);
CREATE INDEX idx_interactions_deal ON interactions(deal_id, created_at DESC);

-- ============================================================================
-- INCOMING REQUESTS (raw payloads, partitioned)
-- ============================================================================

CREATE TABLE incoming_requests (
    id             UUID DEFAULT uuid_generate_v4(),
    source_type    lead_source NOT NULL,
    raw_payload    JSONB NOT NULL,
    normalized_data JSONB,
    contact_hash   VARCHAR(64),
    lead_id        UUID REFERENCES leads(id) ON DELETE SET NULL,
    status         VARCHAR(20) DEFAULT 'pending',
    error_message  TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    processed_at   TIMESTAMPTZ,
    PRIMARY KEY (id, created_at),
    UNIQUE (contact_hash, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE incoming_requests_2026_06 PARTITION OF incoming_requests FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE incoming_requests_2026_07 PARTITION OF incoming_requests FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE incoming_requests_2026_08 PARTITION OF incoming_requests FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE INDEX idx_incoming_hash ON incoming_requests(contact_hash);
CREATE INDEX idx_incoming_status ON incoming_requests(status, created_at);

-- ============================================================================
-- TASKS
-- ============================================================================

CREATE TABLE tasks (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title         VARCHAR(500) NOT NULL,
    description   TEXT,
    status        task_status DEFAULT 'pending',
    priority      task_priority DEFAULT 'medium',
    type          task_type DEFAULT 'custom',
    assignee_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewer_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date      TIMESTAMPTZ,
    remind_at     TIMESTAMPTZ,
    completed_at  TIMESTAMPTZ,
    customer_id   UUID REFERENCES customers(id) ON DELETE SET NULL,
    lead_id       UUID REFERENCES leads(id) ON DELETE SET NULL,
    deal_id       UUID REFERENCES deals(id) ON DELETE SET NULL,
    project_id    UUID,  -- FK added after projects
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    checklist     JSONB DEFAULT '[]',
    tags          VARCHAR[] DEFAULT '{}',
    time_spent    INTEGER,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_assignee ON tasks(assignee_id, status, due_date);
CREATE INDEX idx_tasks_status ON tasks(status, due_date);
CREATE INDEX idx_tasks_deal ON tasks(deal_id);
CREATE INDEX idx_tasks_lead ON tasks(lead_id);
CREATE INDEX idx_tasks_overdue ON tasks(due_date) WHERE status NOT IN ('done', 'cancelled');

CREATE TABLE task_comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id     UUID REFERENCES tasks(id) ON DELETE CASCADE,
    author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    body        TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_comments_task ON task_comments(task_id, created_at);

CREATE TABLE task_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id     UUID REFERENCES tasks(id) ON DELETE CASCADE,
    changed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    field       VARCHAR(50) NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    changed_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_history_task ON task_history(task_id, changed_at);

-- ============================================================================
-- PROJECTS
-- ============================================================================

CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,
    customer_id     UUID REFERENCES customers(id) ON DELETE CASCADE,
    status          project_status DEFAULT 'planning',
    manager_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    start_date      DATE,
    end_date        DATE,
    actual_end_date DATE,
    budget_planned  DECIMAL(12,2) DEFAULT 0,
    budget_actual   DECIMAL(12,2) DEFAULT 0,
    progress        INTEGER DEFAULT 0,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Back-references
ALTER TABLE deals ADD CONSTRAINT fk_deals_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE interactions ADD CONSTRAINT fk_interactions_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_manager ON projects(manager_id);
CREATE INDEX idx_projects_customer ON projects(customer_id);

CREATE TABLE project_members (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    role       project_member_role DEFAULT 'executor',
    joined_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE project_milestones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    "order"     INTEGER NOT NULL,
    due_date    DATE,
    status      milestone_status DEFAULT 'pending',
    progress    INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestones_project ON project_milestones(project_id, "order");

-- ============================================================================
-- FINANCE: INVOICES, PAYMENTS
-- ============================================================================

CREATE TABLE invoices (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number         VARCHAR(50) NOT NULL UNIQUE,
    customer_id    UUID REFERENCES customers(id) ON DELETE CASCADE,
    deal_id        UUID REFERENCES deals(id) ON DELETE SET NULL,
    project_id     UUID REFERENCES projects(id) ON DELETE SET NULL,
    issue_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date       DATE NOT NULL,
    subtotal       DECIMAL(12,2) DEFAULT 0,
    vat_amount     DECIMAL(12,2) DEFAULT 0,
    total          DECIMAL(12,2) DEFAULT 0,
    paid_amount    DECIMAL(12,2) DEFAULT 0,
    status         invoice_status DEFAULT 'draft',
    payment_method payment_method,
    items          JSONB DEFAULT '[]',
    notes          TEXT,
    pdf_file_key   VARCHAR(500),
    created_by     UUID REFERENCES users(id),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id, status);
CREATE INDEX idx_invoices_deal ON invoices(deal_id);
CREATE INDEX idx_invoices_status ON invoices(status, due_date);

CREATE TABLE payments (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id   UUID REFERENCES invoices(id) ON DELETE CASCADE,
    customer_id  UUID REFERENCES customers(id) ON DELETE CASCADE,
    amount       DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    method       payment_method DEFAULT 'bank_transfer',
    reference    VARCHAR(200),
    status       payment_status DEFAULT 'confirmed',
    external_id  VARCHAR(100),
    created_by   UUID REFERENCES users(id),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_customer ON payments(customer_id, payment_date);

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

CREATE TABLE document_templates (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             VARCHAR(200) NOT NULL,
    type             document_type NOT NULL,
    template_file_key VARCHAR(500),
    variables_schema JSONB DEFAULT '{}',
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type        document_type NOT NULL,
    name        VARCHAR(500) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    deal_id     UUID REFERENCES deals(id) ON DELETE SET NULL,
    project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
    invoice_id  UUID REFERENCES invoices(id) ON DELETE SET NULL,
    template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
    version     INTEGER DEFAULT 1,
    status      document_status DEFAULT 'draft',
    file_key    VARCHAR(500),
    file_name   VARCHAR(255),
    file_size   BIGINT,
    mime_type   VARCHAR(100),
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_deal ON documents(deal_id);
CREATE INDEX idx_documents_customer ON documents(customer_id);
CREATE INDEX idx_documents_type ON documents(type, status);

CREATE TABLE document_versions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version     INTEGER NOT NULL,
    file_key    VARCHAR(500) NOT NULL,
    changed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    change_note TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_versions_doc ON document_versions(document_id, version);

-- ============================================================================
-- CALENDAR
-- ============================================================================

CREATE TABLE calendar_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    type            calendar_event_type DEFAULT 'other',
    start_at        TIMESTAMPTZ NOT NULL,
    end_at          TIMESTAMPTZ NOT NULL,
    all_day         BOOLEAN DEFAULT FALSE,
    location        VARCHAR(500),
    organizer_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
    deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,
    project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
    status          VARCHAR(20) DEFAULT 'scheduled',
    recurrence_rule VARCHAR(200),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_organizer ON calendar_events(organizer_id, start_at);
CREATE INDEX idx_events_time_range ON calendar_events(start_at, end_at);

CREATE TABLE event_participants (
    event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
    user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
    status   event_attendance_status DEFAULT 'invited',
    PRIMARY KEY (event_id, user_id)
);

-- ============================================================================
-- MARKETING (Post-MVP)
-- ============================================================================

CREATE TABLE marketing_campaigns (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(200) NOT NULL,
    channel      VARCHAR(50),
    start_date   DATE,
    end_date     DATE,
    budget       DECIMAL(12,2),
    utm_source   VARCHAR(100),
    utm_medium   VARCHAR(100),
    utm_campaign VARCHAR(100),
    status       VARCHAR(20) DEFAULT 'planned',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_segments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    filter_criteria JSONB DEFAULT '{}',
    members_count   INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS: auto updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE t TEXT;
BEGIN
    FOR t IN
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
        AND table_name NOT IN ('audit_log','interactions','incoming_requests')
    LOOP
        EXECUTE format('
            CREATE TRIGGER set_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at();
        ', t);
    END LOOP;
END;
$$;

-- ============================================================================
-- SEED DATA: Default pipeline, stages, roles, permissions
-- (See sql/seeds/seed_data.sql)
-- ============================================================================
