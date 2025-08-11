# API документация: Система разрешений сотрудников

## Обзор

Система разрешений сотрудников обеспечивает детальный контроль доступа к функциям и данным компании. Разные роли сотрудников имеют разные уровни доступа к бронированиям, клиентам, аналитике, финансам и другим ресурсам.

## Предустановленные роли

### 1. Менеджер (manager)
- **Отдел**: management
- **Разрешения**: `all` (полный доступ)
- **Описание**: Полный доступ ко всем функциям компании

### 2. Ветеринар (veterinarian)  
- **Отдел**: medical
- **Разрешения**: `view_bookings`, `edit_bookings`, `view_customers`, `view_customer_data`, `view_services`
- **Описание**: Доступ к медицинским функциям и записям

### 3. Грумер (groomer)
- **Отдел**: grooming
- **Разрешения**: `view_bookings`, `edit_bookings`, `view_customers`
- **Описание**: Доступ к грумингу и своим записям

### 4. Администратор (receptionist)
- **Отдел**: reception
- **Разрешения**: `view_bookings`, `create_bookings`, `edit_bookings`, `view_customers`, `edit_customers`, `process_payments`
- **Описание**: Управление записями и клиентами

### 5. Кассир (cashier)
- **Отдел**: reception
- **Разрешения**: `view_bookings`, `view_customers`, `process_payments`, `view_inventory`
- **Описание**: Обработка платежей и продаж

### 6. Аналитик (analyst)
- **Отдел**: analytics
- **Разрешения**: `view_analytics`, `view_reports`, `export_data`, `view_financials`, `view_bookings`, `view_customers`
- **Описание**: Доступ к аналитике и отчетам

## Список разрешений

### Бронирования
- `view_bookings` - Просмотр записей
- `create_bookings` - Создание записей
- `edit_bookings` - Редактирование записей
- `cancel_bookings` - Отмена записей
- `view_all_bookings` - Просмотр всех записей (не только своих)

### Клиенты
- `view_customers` - Просмотр клиентов
- `edit_customers` - Редактирование клиентов
- `view_customer_data` - Доступ к персональным данным

### Аналитика
- `view_analytics` - Просмотр аналитики
- `view_reports` - Просмотр отчетов
- `export_data` - Экспорт данных

### Финансы
- `view_financials` - Просмотр финансов
- `process_payments` - Обработка платежей
- `issue_refunds` - Возврат средств

### Сотрудники
- `view_employees` - Просмотр сотрудников
- `manage_employees` - Управление сотрудниками
- `view_salaries` - Просмотр зарплат

### Услуги
- `view_services` - Просмотр услуг
- `manage_services` - Управление услугами
- `set_prices` - Установка цен

### Склад
- `view_inventory` - Просмотр товаров
- `manage_inventory` - Управление товарами

### Настройки
- `view_settings` - Просмотр настроек
- `manage_settings` - Управление настройками
- `manage_integrations` - Управление интеграциями

### Отзывы
- `view_reviews` - Просмотр отзывов
- `respond_reviews` - Ответы на отзывы

### Специальные
- `all` - Полный доступ
- `read_only` - Только чтение

## API Endpoints

### Аутентификация сотрудников

#### 1. Вход в систему

**POST** `/api/v1/employees/login`

**Request Body**:
```json
{
  "username": "manager",
  "password": "password123",
  "company_id": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "session": {
    "employee_id": "uuid",
    "company_id": "uuid", 
    "username": "manager",
    "role": "manager",
    "permissions": ["all"],
    "department": "management",
    "login_time": "2024-01-01T00:00:00Z",
    "expires_at": "2024-01-01T08:00:00Z"
  }
}
```

#### 2. Выход из системы

**POST** `/api/v1/employees/logout`

**Headers**: `Authorization: Bearer <session_token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Профиль сотрудника

#### 3. Получить профиль

**GET** `/api/v1/employees/profile`

**Headers**: `Authorization: Bearer <session_token>`

**Response** (200):
```json
{
  "success": true,
  "employee": {
    "id": "uuid",
    "company_id": "uuid",
    "username": "manager",
    "first_name": "Анна",
    "last_name": "Менеджерова", 
    "email": "manager@company.com",
    "phone": "+1234567890",
    "role": "manager",
    "permissions": ["all"],
    "department": "management",
    "hire_date": "2023-01-01T00:00:00Z",
    "is_active": true,
    "last_login": "2024-01-01T00:00:00Z",
    "company_name": "Зоосалон Люкс"
  }
}
```

#### 4. Получить дашборд сотрудника

**GET** `/api/v1/employees/dashboard`

**Headers**: `Authorization: Bearer <session_token>`

**Response** (200):
```json
{
  "success": true,
  "dashboard": {
    "employee": {
      "id": "uuid",
      "first_name": "Анна",
      "role": "manager",
      "department": "management"
    },
    "can_view_bookings": true,
    "can_view_customers": true,
    "can_view_analytics": true,
    "can_view_financials": true,
    "can_manage_employees": true,
    "permissions": ["all"],
    "company_id": "uuid"
  }
}
```

#### 5. Проверить разрешение

**GET** `/api/v1/employees/check-permission/{permission}`

**Headers**: `Authorization: Bearer <session_token>`

**Response** (200):
```json
{
  "success": true,
  "has_permission": true,
  "permission": "view_analytics"
}
```

### Управление сотрудниками

**Требует разрешение**: `manage_employees`

#### 6. Создать сотрудника

**POST** `/api/v1/employees/manage/`

**Headers**: `Authorization: Bearer <session_token>`

**Request Body**:
```json
{
  "username": "newemployee",
  "password": "securepass123",
  "first_name": "Иван",
  "last_name": "Петров",
  "email": "ivan@company.com",
  "phone": "+1234567891",
  "role": "receptionist",
  "permissions": ["view_bookings", "create_bookings", "edit_bookings"],
  "department": "reception",
  "hire_date": "2024-01-01T00:00:00Z",
  "salary": 50000.00
}
```

**Response** (201):
```json
{
  "success": true,
  "employee": {
    "id": "uuid",
    "username": "newemployee",
    "first_name": "Иван",
    "last_name": "Петров",
    "email": "ivan@company.com",
    "role": "receptionist",
    "permissions": ["view_bookings", "create_bookings", "edit_bookings"],
    "department": "reception",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 7. Получить список сотрудников

**GET** `/api/v1/employees/manage/`

**Headers**: `Authorization: Bearer <session_token>`

**Query Parameters**:
- `include_inactive` (boolean): Включить неактивных сотрудников

**Response** (200):
```json
{
  "success": true,
  "employees": [
    {
      "id": "uuid",
      "username": "manager",
      "first_name": "Анна",
      "last_name": "Менеджерова",
      "email": "manager@company.com",
      "role": "manager",
      "permissions": ["all"],
      "department": "management",
      "is_active": true,
      "last_login": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 8. Получить сотрудника по ID

**GET** `/api/v1/employees/manage/{employeeId}`

**Headers**: `Authorization: Bearer <session_token>`

**Response** (200):
```json
{
  "success": true,
  "employee": {
    "id": "uuid",
    "username": "receptionist",
    "first_name": "Мария",
    "last_name": "Администраторова",
    "email": "reception@company.com",
    "role": "receptionist",
    "permissions": ["view_bookings", "create_bookings"],
    "department": "reception",
    "hire_date": "2023-06-01T00:00:00Z",
    "salary": 45000.00,
    "is_active": true
  }
}
```

#### 9. Обновить сотрудника

**PUT** `/api/v1/employees/manage/{employeeId}`

**Headers**: `Authorization: Bearer <session_token>`

**Request Body**:
```json
{
  "first_name": "Мария",
  "last_name": "Новая-Фамилия",
  "email": "maria.new@company.com",
  "role": "manager",
  "permissions": ["all"],
  "department": "management",
  "salary": 60000.00
}
```

**Response** (200):
```json
{
  "success": true,
  "employee": {
    "id": "uuid",
    "first_name": "Мария",
    "last_name": "Новая-Фамилия",
    "role": "manager",
    "permissions": ["all"],
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 10. Обновить разрешения сотрудника

**PUT** `/api/v1/employees/manage/{employeeId}/permissions`

**Headers**: `Authorization: Bearer <session_token>`

**Request Body**:
```json
{
  "permissions": ["view_bookings", "edit_bookings", "view_customers", "process_payments"]
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Permissions updated successfully"
}
```

#### 11. Деактивировать сотрудника

**DELETE** `/api/v1/employees/manage/{employeeId}`

**Headers**: `Authorization: Bearer <session_token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Employee deactivated successfully"
}
```

### Справочная информация

#### 12. Получить доступные разрешения

**GET** `/api/v1/employees/reference/permissions`

**Headers**: `Authorization: Bearer <session_token>`

**Response** (200):
```json
{
  "success": true,
  "permissions": [
    {
      "id": "view_bookings",
      "name": "Просмотр записей",
      "description": "Просмотр записей клиентов",
      "category": "bookings"
    },
    {
      "id": "view_analytics",
      "name": "Просмотр аналитики", 
      "description": "Доступ к аналитическим данным",
      "category": "analytics"
    }
  ]
}
```

#### 13. Получить доступные роли

**GET** `/api/v1/employees/reference/roles`

**Headers**: `Authorization: Bearer <session_token>`

**Response** (200):
```json
{
  "success": true,
  "roles": [
    {
      "id": "manager",
      "name": "Менеджер",
      "description": "Полный доступ к управлению компанией",
      "department": "management",
      "permissions": ["all"]
    },
    {
      "id": "receptionist",
      "name": "Администратор",
      "description": "Управление записями и клиентами",
      "department": "reception", 
      "permissions": ["view_bookings", "create_bookings", "edit_bookings"]
    }
  ]
}
```

## Middleware и защита роутов

### Типы middleware

1. **EmployeeAuthMiddleware** - Проверка аутентификации сотрудника
2. **RequirePermission** - Проверка конкретного разрешения
3. **RequireAnyPermission** - Проверка любого из указанных разрешений
4. **RequireEmployeeRole** - Проверка роли сотрудника
5. **RequireDepartment** - Проверка отдела
6. **DataAccessMiddleware** - Проверка доступа к данным
7. **FlexibleAuthMiddleware** - Поддержка и пользователей, и сотрудников

### Примеры использования в роутах

```go
// Только аутентифицированные сотрудники
employees.GET("/profile", 
    middleware.EmployeeAuthMiddleware(employeeService), 
    employeeHandler.GetEmployeeProfile)

// Требует конкретное разрешение
bookings.POST("/", 
    middleware.RequirePermission("create_bookings"), 
    bookingHandler.CreateBooking)

// Требует любое из разрешений
bookings.GET("/", 
    middleware.RequireAnyPermission("view_bookings", "view_all_bookings"), 
    bookingHandler.GetUserBookings)

// Требует конкретную роль
management.GET("/salaries", 
    middleware.RequireEmployeeRole("manager", "analyst"), 
    employeeHandler.GetSalaries)

// Проверка доступа к данным
bookings.PUT("/:bookingId", 
    middleware.DataAccessMiddleware(employeeService, "booking"),
    bookingHandler.UpdateBooking)
```

## Логирование активности

Все действия сотрудников логируются в таблицу `employee_activity_log`:

```json
{
  "employee_id": "uuid",
  "action": "employee_created",
  "resource": "employee", 
  "resource_id": "uuid",
  "details": {
    "role": "receptionist",
    "department": "reception",
    "permissions": ["view_bookings", "create_bookings"]
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Контроль доступа к данным

### Принципы разграничения:

1. **Бронирования**:
   - Сотрудники с `view_bookings` видят только свои записи
   - Сотрудники с `view_all_bookings` видят все записи компании

2. **Клиенты**:
   - `view_customers` - базовый доступ к клиентам
   - `view_customer_data` - доступ к персональным данным всех клиентов
   - Без `view_customer_data` - только клиенты, которых обслуживал

3. **Финансы**:
   - `view_financials` - доступ к финансовой отчетности
   - `view_salaries` - доступ к зарплатной информации

4. **Аналитика**:
   - `view_analytics` - базовая аналитика
   - `view_reports` - детальные отчеты
   - `export_data` - экспорт данных

## Безопасность

### Хранение паролей
- Пароли хешируются с помощью bcrypt
- Минимальная длина пароля: 8 символов

### Сессии
- JWT токены с истечением через 8 часов
- Автоматическая очистка истекших сессий
- Хранение IP-адреса и User-Agent

### Аудит
- Логирование всех изменений разрешений
- Отслеживание входов/выходов
- Запись действий с чувствительными данными

## Примеры интеграции

### 1. Создание нового сотрудника-грумера:

```bash
curl -X POST "http://localhost:8080/api/v1/employees/manage/" \
  -H "Authorization: Bearer <manager_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "groomer1",
    "password": "securepass123",
    "first_name": "Елена",
    "last_name": "Грумер",
    "email": "groomer@company.com",
    "role": "groomer",
    "department": "grooming"
  }'
```

### 2. Вход грумера в систему:

```bash
curl -X POST "http://localhost:8080/api/v1/employees/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "groomer1",
    "password": "securepass123",
    "company_id": "company-uuid"
  }'
```

### 3. Проверка доступа к аналитике:

```bash
curl -X GET "http://localhost:8080/api/v1/employees/check-permission/view_analytics" \
  -H "Authorization: Bearer <groomer_token>"

# Ответ: {"success": true, "has_permission": false, "permission": "view_analytics"}
```

### 4. Добавление разрешения на аналитику:

```bash
curl -X PUT "http://localhost:8080/api/v1/employees/manage/groomer-uuid/permissions" \
  -H "Authorization: Bearer <manager_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": ["view_bookings", "edit_bookings", "view_customers", "view_analytics"]
  }'
```

Система разрешений полностью интегрирована со всеми существующими API endpoints и обеспечивает гибкий контроль доступа на уровне компании. 