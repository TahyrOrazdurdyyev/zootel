-- Migration: Employee Permissions System
-- Description: Creates comprehensive employee management with role-based access control

-- Create employees table if not exists or update it
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    password TEXT NOT NULL, -- bcrypt hashed
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'receptionist',
    permissions TEXT[] DEFAULT '{}',
    department VARCHAR(50),
    hire_date TIMESTAMP WITH TIME ZONE,
    salary DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_username_per_company UNIQUE(company_id, username),
    CONSTRAINT unique_email_per_company UNIQUE(company_id, email),
    CONSTRAINT valid_role CHECK (role IN ('manager', 'veterinarian', 'groomer', 'receptionist', 'cashier', 'analyst')),
    CONSTRAINT valid_department CHECK (department IN ('management', 'medical', 'grooming', 'reception', 'inventory', 'analytics'))
);

-- Create employee_sessions table for session management
CREATE TABLE IF NOT EXISTS employee_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address INET,
    user_agent TEXT
);

-- Create employee_permissions table for flexible permission management
CREATE TABLE IF NOT EXISTS employee_permissions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_roles table for predefined roles
CREATE TABLE IF NOT EXISTS employee_roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    department VARCHAR(50),
    permissions TEXT[] DEFAULT '{}',
    is_system_role BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_activity_log for audit trail
CREATE TABLE IF NOT EXISTS employee_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(company_id, username);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(company_id, email);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);

CREATE INDEX IF NOT EXISTS idx_employee_sessions_employee_id ON employee_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_sessions_token ON employee_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_employee_sessions_expires ON employee_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_employee_activity_employee_id ON employee_activity_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_activity_created_at ON employee_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_employee_activity_action ON employee_activity_log(action);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_employees_updated_at();

-- Insert predefined permissions
INSERT INTO employee_permissions (id, name, description, category) VALUES
-- Booking permissions
('view_bookings', 'Просмотр записей', 'Просмотр записей клиентов', 'bookings'),
('create_bookings', 'Создание записей', 'Создание новых записей', 'bookings'),
('edit_bookings', 'Редактирование записей', 'Изменение существующих записей', 'bookings'),
('cancel_bookings', 'Отмена записей', 'Отмена записей клиентов', 'bookings'),
('view_all_bookings', 'Просмотр всех записей', 'Просмотр записей всех сотрудников', 'bookings'),

-- Customer permissions
('view_customers', 'Просмотр клиентов', 'Просмотр списка клиентов', 'customers'),
('edit_customers', 'Редактирование клиентов', 'Изменение данных клиентов', 'customers'),
('view_customer_data', 'Доступ к данным клиентов', 'Доступ к персональным данным клиентов', 'customers'),

-- Analytics permissions
('view_analytics', 'Просмотр аналитики', 'Доступ к аналитическим данным', 'analytics'),
('view_reports', 'Просмотр отчетов', 'Генерация и просмотр отчетов', 'analytics'),
('export_data', 'Экспорт данных', 'Экспорт данных в файлы', 'analytics'),

-- Financial permissions
('view_financials', 'Просмотр финансов', 'Доступ к финансовой информации', 'financials'),
('process_payments', 'Обработка платежей', 'Проведение платежных операций', 'financials'),
('issue_refunds', 'Возврат средств', 'Оформление возвратов клиентам', 'financials'),

-- Employee management
('view_employees', 'Просмотр сотрудников', 'Просмотр списка сотрудников', 'employees'),
('manage_employees', 'Управление сотрудниками', 'Добавление и редактирование сотрудников', 'employees'),
('view_salaries', 'Просмотр зарплат', 'Доступ к зарплатной информации', 'employees'),

-- Service management
('view_services', 'Просмотр услуг', 'Просмотр списка услуг', 'services'),
('manage_services', 'Управление услугами', 'Добавление и редактирование услуг', 'services'),
('set_prices', 'Установка цен', 'Изменение цен на услуги', 'services'),

-- Inventory management
('view_inventory', 'Просмотр товаров', 'Просмотр складских остатков', 'inventory'),
('manage_inventory', 'Управление товарами', 'Управление складскими остатками', 'inventory'),

-- System settings
('view_settings', 'Просмотр настроек', 'Просмотр настроек системы', 'settings'),
('manage_settings', 'Управление настройками', 'Изменение настроек системы', 'settings'),
('manage_integrations', 'Управление интеграциями', 'Настройка внешних интеграций', 'settings'),

-- Reviews
('view_reviews', 'Просмотр отзывов', 'Просмотр отзывов клиентов', 'reviews'),
('respond_reviews', 'Ответы на отзывы', 'Ответы на отзывы клиентов', 'reviews'),

-- Special permissions
('all', 'Полный доступ', 'Доступ ко всем функциям', 'special'),
('read_only', 'Только чтение', 'Доступ только для чтения', 'special')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category;

-- Insert predefined roles
INSERT INTO employee_roles (id, name, description, department, permissions) VALUES
('manager', 'Менеджер', 'Полный доступ к управлению компанией', 'management', ARRAY['all']),
('veterinarian', 'Ветеринар', 'Доступ к медицинским функциям и записям', 'medical', ARRAY[
    'view_bookings', 'edit_bookings', 'view_customers', 'view_customer_data', 'view_services'
]),
('groomer', 'Грумер', 'Доступ к грумингу и своим записям', 'grooming', ARRAY[
    'view_bookings', 'edit_bookings', 'view_customers'
]),
('receptionist', 'Администратор', 'Управление записями и клиентами', 'reception', ARRAY[
    'view_bookings', 'create_bookings', 'edit_bookings', 'view_customers', 'edit_customers', 'process_payments'
]),
('cashier', 'Кассир', 'Обработка платежей и продаж', 'reception', ARRAY[
    'view_bookings', 'view_customers', 'process_payments', 'view_inventory'
]),
('analyst', 'Аналитик', 'Доступ к аналитике и отчетам', 'analytics', ARRAY[
    'view_analytics', 'view_reports', 'export_data', 'view_financials', 'view_bookings', 'view_customers'
])

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    department = EXCLUDED.department,
    permissions = EXCLUDED.permissions;

-- Insert sample employees for testing (optional)
DO $$
DECLARE
    company_record RECORD;
    employee_id UUID;
BEGIN
    -- Get first active company
    SELECT id INTO company_record FROM companies WHERE is_active = true LIMIT 1;
    
    IF company_record.id IS NOT NULL THEN
        -- Insert manager
        INSERT INTO employees (
            company_id, username, password, first_name, last_name, email, role, 
            permissions, department, hire_date, is_active
        ) VALUES (
            company_record.id, 'manager', '$2b$10$example_hash_for_password123', 
            'Анна', 'Менеджерова', 'manager@company.com', 'manager',
            ARRAY['all'], 'management', NOW() - INTERVAL '1 year', true
        ) ON CONFLICT (company_id, username) DO NOTHING;
        
        -- Insert receptionist
        INSERT INTO employees (
            company_id, username, password, first_name, last_name, email, role,
            permissions, department, hire_date, is_active
        ) VALUES (
            company_record.id, 'reception', '$2b$10$example_hash_for_password123',
            'Мария', 'Администраторова', 'reception@company.com', 'receptionist',
            ARRAY['view_bookings', 'create_bookings', 'edit_bookings', 'view_customers', 'edit_customers', 'process_payments'],
            'reception', NOW() - INTERVAL '6 months', true
        ) ON CONFLICT (company_id, username) DO NOTHING;
        
        -- Insert veterinarian
        INSERT INTO employees (
            company_id, username, password, first_name, last_name, email, role,
            permissions, department, hire_date, is_active
        ) VALUES (
            company_record.id, 'vet', '$2b$10$example_hash_for_password123',
            'Иван', 'Ветеринаров', 'vet@company.com', 'veterinarian',
            ARRAY['view_bookings', 'edit_bookings', 'view_customers', 'view_customer_data', 'view_services'],
            'medical', NOW() - INTERVAL '3 months', true
        ) ON CONFLICT (company_id, username) DO NOTHING;
    END IF;
END $$;

-- Clean up old employee sessions (older than 30 days)
DELETE FROM employee_sessions WHERE expires_at < NOW() - INTERVAL '30 days'; 