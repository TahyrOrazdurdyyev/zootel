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
('view_bookings', 'View Bookings', 'View client bookings', 'bookings'),
('create_bookings', 'Create Bookings', 'Create new bookings', 'bookings'),
('edit_bookings', 'Edit Bookings', 'Modify existing bookings', 'bookings'),
('cancel_bookings', 'Cancel Bookings', 'Cancel client bookings', 'bookings'),
('view_all_bookings', 'View All Bookings', 'View all employees bookings', 'bookings'),

-- Customer permissions
('view_customers', 'View Customers', 'View customer list', 'customers'),
('edit_customers', 'Edit Customers', 'Modify customer data', 'customers'),
('view_customer_data', 'Access Customer Data', 'Access customer personal data', 'customers'),

-- Analytics permissions
('view_analytics', 'View Analytics', 'Access to analytical data', 'analytics'),
('view_reports', 'View Reports', 'Generate and view reports', 'analytics'),
('export_data', 'Export Data', 'Export data to files', 'analytics'),

-- Financial permissions
('view_financials', 'View Financials', 'Access to financial information', 'financials'),
('process_payments', 'Process Payments', 'Process payment operations', 'financials'),
('issue_refunds', 'Issue Refunds', 'Process customer refunds', 'financials'),

-- Employee management
('view_employees', 'View Employees', 'View employee list', 'employees'),
('manage_employees', 'Manage Employees', 'Add and edit employees', 'employees'),
('view_salaries', 'View Salaries', 'Access to salary information', 'employees'),

-- Service management
('view_services', 'View Services', 'View service list', 'services'),
('manage_services', 'Manage Services', 'Add and edit services', 'services'),
('set_prices', 'Set Prices', 'Change service prices', 'services'),

-- Inventory management
('view_inventory', 'View Inventory', 'View inventory stock', 'inventory'),
('manage_inventory', 'Manage Inventory', 'Manage inventory stock', 'inventory'),

-- System settings
('view_settings', 'View Settings', 'View system settings', 'settings'),
('manage_settings', 'Manage Settings', 'Modify system settings', 'settings'),
('manage_integrations', 'Manage Integrations', 'Configure external integrations', 'settings'),

-- Reviews
('view_reviews', 'View Reviews', 'View customer reviews', 'reviews'),
('respond_reviews', 'Respond to Reviews', 'Respond to customer reviews', 'reviews'),

-- Special permissions
('all', 'Full Access', 'Access to all functions', 'special'),
('read_only', 'Read Only', 'Read-only access', 'special')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category;

-- Insert predefined roles
INSERT INTO employee_roles (id, name, description, department, permissions) VALUES
('manager', 'Manager', 'Full access to company management', 'management', ARRAY['all']),
('veterinarian', 'Veterinarian', 'Access to medical functions and records', 'medical', ARRAY[
    'view_bookings', 'edit_bookings', 'view_customers', 'view_customer_data', 'view_services'
]),
('groomer', 'Groomer', 'Access to grooming and own records', 'grooming', ARRAY[
    'view_bookings', 'edit_bookings', 'view_customers'
]),
('receptionist', 'Administrator', 'Management of records and customers', 'reception', ARRAY[
    'view_bookings', 'create_bookings', 'edit_bookings', 'view_customers', 'edit_customers', 'process_payments'
]),
('cashier', 'Cashier', 'Processing payments and sales', 'reception', ARRAY[
    'view_bookings', 'view_customers', 'process_payments', 'view_inventory'
]),
('analyst', 'Analyst', 'Access to analytics and reports', 'analytics', ARRAY[
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