-- ============================================================================
-- CRM SYSTEM — SEED DATA
-- Default roles, permissions, pipeline stages, admin user
-- ============================================================================

-- ============================================================================
-- ROLES
-- ============================================================================
INSERT INTO roles (id, name, description, is_system) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Полный доступ ко всем модулям', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'manager', 'Менеджер продаж: клиенты, лиды, сделки, задачи', TRUE),
  ('00000000-0000-0000-0000-000000000003', 'sales', 'Продавец: свои клиенты, лиды, сделки', TRUE),
  ('00000000-0000-0000-0000-000000000004', 'finance', 'Финансовый отдел: счета, оплаты', TRUE),
  ('00000000-0000-0000-0000-000000000005', 'executor', 'Исполнитель: задачи, проекты', TRUE),
  ('00000000-0000-0000-0000-000000000006', 'readonly', 'Только чтение (наблюдатель)', TRUE);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
INSERT INTO permissions (id, code, module, action, description) VALUES
-- CRM: Customers
  ('10000000-0000-0000-0000-000000000001', 'crm.customers.read', 'crm', 'read', 'Просмотр клиентов'),
  ('10000000-0000-0000-0000-000000000002', 'crm.customers.create', 'crm', 'create', 'Создание клиентов'),
  ('10000000-0000-0000-0000-000000000003', 'crm.customers.update', 'crm', 'update', 'Редактирование клиентов'),
  ('10000000-0000-0000-0000-000000000004', 'crm.customers.delete', 'crm', 'delete', 'Удаление клиентов'),
  ('10000000-0000-0000-0000-000000000005', 'crm.customers.export', 'crm', 'export', 'Экспорт клиентов'),
-- CRM: Leads
  ('10000000-0000-0000-0000-000000000010', 'crm.leads.read', 'crm', 'read', 'Просмотр лидов'),
  ('10000000-0000-0000-0000-000000000011', 'crm.leads.create', 'crm', 'create', 'Создание лидов'),
  ('10000000-0000-0000-0000-000000000012', 'crm.leads.update', 'crm', 'update', 'Редактирование лидов'),
  ('10000000-0000-0000-0000-000000000013', 'crm.leads.assign', 'crm', 'assign', 'Назначение лидов'),
  ('10000000-0000-0000-0000-000000000014', 'crm.leads.convert', 'crm', 'update', 'Конвертация лидов в сделки'),
-- CRM: Deals
  ('10000000-0000-0000-0000-000000000020', 'crm.deals.read', 'crm', 'read', 'Просмотр сделок'),
  ('10000000-0000-0000-0000-000000000021', 'crm.deals.create', 'crm', 'create', 'Создание сделок'),
  ('10000000-0000-0000-0000-000000000022', 'crm.deals.update', 'crm', 'update', 'Редактирование сделок'),
  ('10000000-0000-0000-0000-000000000023', 'crm.deals.delete', 'crm', 'delete', 'Удаление сделок'),
  ('10000000-0000-0000-0000-000000000024', 'crm.deals.close', 'crm', 'update', 'Закрытие сделок'),
-- Tasks
  ('20000000-0000-0000-0000-000000000001', 'tasks.read', 'tasks', 'read', 'Просмотр задач'),
  ('20000000-0000-0000-0000-000000000002', 'tasks.create', 'tasks', 'create', 'Создание задач'),
  ('20000000-0000-0000-0000-000000000003', 'tasks.update', 'tasks', 'update', 'Редактирование задач'),
  ('20000000-0000-0000-0000-000000000004', 'tasks.assign', 'tasks', 'assign', 'Назначение задач'),
  ('20000000-0000-0000-0000-000000000005', 'tasks.delete', 'tasks', 'delete', 'Удаление задач'),
-- Finance
  ('30000000-0000-0000-0000-000000000001', 'finance.invoices.read', 'finance', 'read', 'Просмотр счетов'),
  ('30000000-0000-0000-0000-000000000002', 'finance.invoices.create', 'finance', 'create', 'Создание счетов'),
  ('30000000-0000-0000-0000-000000000003', 'finance.invoices.update', 'finance', 'update', 'Редактирование счетов'),
  ('30000000-0000-0000-0000-000000000004', 'finance.payments.register', 'finance', 'create', 'Регистрация оплат'),
-- Documents
  ('40000000-0000-0000-0000-000000000001', 'documents.read', 'documents', 'read', 'Просмотр документов'),
  ('40000000-0000-0000-0000-000000000002', 'documents.generate', 'documents', 'create', 'Генерация документов'),
  ('40000000-0000-0000-0000-000000000003', 'documents.templates.manage', 'documents', 'update', 'Управление шаблонами'),
-- Calendar
  ('50000000-0000-0000-0000-000000000001', 'calendar.read', 'calendar', 'read', 'Просмотр календаря'),
  ('50000000-0000-0000-0000-000000000002', 'calendar.create', 'calendar', 'create', 'Создание событий'),
  ('50000000-0000-0000-0000-000000000003', 'calendar.update', 'calendar', 'update', 'Редактирование событий'),
-- Projects
  ('60000000-0000-0000-0000-000000000001', 'projects.read', 'projects', 'read', 'Просмотр проектов'),
  ('60000000-0000-0000-0000-000000000002', 'projects.create', 'projects', 'create', 'Создание проектов'),
  ('60000000-0000-0000-0000-000000000003', 'projects.update', 'projects', 'update', 'Редактирование проектов'),
-- Analytics
  ('70000000-0000-0000-0000-000000000001', 'analytics.read', 'analytics', 'read', 'Просмотр аналитики'),
  ('70000000-0000-0000-0000-000000000002', 'analytics.export', 'analytics', 'export', 'Экспорт отчётов'),
-- Admin
  ('80000000-0000-0000-0000-000000000001', 'admin.users.manage', 'admin', 'update', 'Управление пользователями'),
  ('80000000-0000-0000-0000-000000000002', 'admin.roles.manage', 'admin', 'update', 'Управление ролями'),
  ('80000000-0000-0000-0000-000000000003', 'admin.settings.manage', 'admin', 'update', 'Системные настройки'),
  ('80000000-0000-0000-0000-000000000004', 'admin.audit.read', 'admin', 'read', 'Просмотр журнала аудита');

-- ============================================================================
-- ROLE PERMISSIONS
-- ============================================================================
-- Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions;

-- Manager: CRM + tasks + documents + calendar + analytics + projects
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM permissions
WHERE module IN ('crm', 'tasks', 'documents', 'calendar', 'analytics', 'projects');

-- Sales: limited CRM + own tasks + documents
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000003', id FROM permissions
WHERE code IN (
  'crm.customers.read', 'crm.customers.create', 'crm.customers.update', 'crm.customers.export',
  'crm.leads.read', 'crm.leads.create', 'crm.leads.update', 'crm.leads.convert',
  'crm.deals.read', 'crm.deals.create', 'crm.deals.update', 'crm.deals.close',
  'tasks.read', 'tasks.create', 'tasks.update',
  'documents.read', 'documents.generate',
  'calendar.read', 'calendar.create', 'calendar.update'
);

-- Finance: invoices + payments + documents + analytics
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000004', id FROM permissions
WHERE code IN (
  'crm.customers.read',
  'crm.deals.read',
  'finance.invoices.read', 'finance.invoices.create', 'finance.invoices.update',
  'finance.payments.register',
  'documents.read', 'documents.generate',
  'analytics.read', 'analytics.export'
);

-- Executor: tasks + projects + calendar
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000005', id FROM permissions
WHERE code IN (
  'tasks.read', 'tasks.create', 'tasks.update',
  'projects.read', 'projects.update',
  'calendar.read', 'calendar.create', 'calendar.update',
  'crm.customers.read', 'crm.deals.read',
  'documents.read'
);

-- Readonly: read everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000006', id FROM permissions
WHERE action = 'read';

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================
INSERT INTO departments (id, name) VALUES
  ('90000000-0000-0000-0000-000000000001', 'Руководство'),
  ('90000000-0000-0000-0000-000000000002', 'Отдел продаж'),
  ('90000000-0000-0000-0000-000000000003', 'Финансовый отдел'),
  ('90000000-0000-0000-0000-000000000004', 'Исполнение (Проекты)');

-- ============================================================================
-- ADMIN USER
-- ============================================================================
-- Default password: Admin@12345 (bcrypt hash)
INSERT INTO users (
  id, email, phone, phone_e164, first_name, last_name, position,
  department_id, role_id, is_active, is_superuser, password_hash
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@crm.local',
  '+7 (495) 000-00-00',
  '+74950000000',
  'Администратор',
  'Системный',
  'Системный администратор',
  '90000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  TRUE,
  TRUE,
  '$2b$12$LJ3m4ys3Lz9Xp5nEjxk2n.KqYBgP8SVxZo3eAy6cJ0x8q9q2yMnO.'  -- Admin@12345
);

-- ============================================================================
-- DEFAULT PIPELINE + STAGES
-- ============================================================================
INSERT INTO pipelines (id, name, is_default) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Основная воронка', TRUE);

INSERT INTO deal_stages (id, pipeline_id, name, "order", probability, is_won_stage, is_lost_stage, color) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Новый',         1,  10, FALSE, FALSE, '#3B82F6'),
  ('b1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Квалификация',  2,  20, FALSE, FALSE, '#8B5CF6'),
  ('b1000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Встреча',       3,  35, FALSE, FALSE, '#06B6D4'),
  ('b1000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'КП отправлено', 4,  50, FALSE, FALSE, '#F59E0B'),
  ('b1000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Переговоры',    5,  65, FALSE, FALSE, '#EC4899'),
  ('b1000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Договор',       6,  85, FALSE, FALSE, '#F97316'),
  ('b1000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'Оплата',        7,  95, FALSE, FALSE, '#84CC16'),
  ('b1000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'Выиграно',      8, 100, TRUE,  FALSE, '#10B981'),
  ('b1000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'Проиграно',     9,   0, FALSE, TRUE,  '#EF4444');

-- ============================================================================
-- DOCUMENT TEMPLATES (references to S3 keys)
-- ============================================================================
INSERT INTO document_templates (id, name, type, template_file_key, variables_schema, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001',
   'Коммерческое предложение (стандарт)',
   'quote',
   'templates/quote_standard.docx',
   '{"variables": ["customer.name", "customer.inn", "deal.title", "deal.amount", "items", "date", "manager.name", "validity_days"]}'::jsonb,
   TRUE),
  ('c0000000-0000-0000-0000-000000000002',
   'Договор оказания услуг',
   'contract',
   'templates/contract_service.docx',
   '{"variables": ["customer.name", "customer.inn", "customer.kpp", "customer.ogrn", "deal.title", "deal.amount", "payment_terms", "date"]}'::jsonb,
   TRUE),
  ('c0000000-0000-0000-0000-000000000003',
   'Счёт на оплату',
   'invoice_doc',
   'templates/invoice.docx',
   '{"variables": ["customer.name", "customer.inn", "invoice.number", "invoice.items", "invoice.total", "invoice.due_date"]}'::jsonb,
   TRUE),
  ('c0000000-0000-0000-0000-000000000004',
   'Акт выполненных работ',
   'act',
   'templates/act.docx',
   '{"variables": ["customer.name", "customer.inn", "project.name", "project.milestones", "invoice.total", "date"]}'::jsonb,
   TRUE);
