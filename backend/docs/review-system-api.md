# API документация: Система отзывов и оценок

## Обзор

Система отзывов позволяет пользователям оставлять отзывы и оценки (1-5 звезд) для компаний на основе завершенных бронирований и заказов. Компании могут отвечать на отзывы, а администраторы могут модерировать контент.

## Endpoints

### 1. Создание отзыва

**POST** `/api/v1/reviews/`

Создает новый отзыв. Пользователь должен иметь завершенное бронирование или заказ в данной компании.

**Аутентификация**: Требуется (Pet Owner)

**Request Body**:
```json
{
  "company_id": "uuid",
  "service_id": "uuid",          // optional
  "booking_id": "uuid",          // optional (либо booking_id, либо order_id)
  "order_id": "uuid",            // optional
  "rating": 5,                   // 1-5 звезд, обязательно
  "comment": "Отличный сервис!", // min 10, max 1000 символов
  "photos": ["url1", "url2"],    // optional, массив URL фотографий
  "is_anonymous": false          // optional, анонимный отзыв
}
```

**Response** (201):
```json
{
  "success": true,
  "review": {
    "id": "uuid",
    "user_id": "uuid",
    "company_id": "uuid",
    "service_id": "uuid",
    "booking_id": "uuid",
    "rating": 5,
    "comment": "Отличный сервис!",
    "photos": ["url1", "url2"],
    "is_anonymous": false,
    "status": "approved",
    "created_at": "2024-01-01T00:00:00Z",
    "customer_info": {
      "first_name": "Иван",
      "last_name": "Петров",
      "email": "ivan@example.com"
    },
    "service_name": "Стрижка собак",
    "company_name": "Зоосалон Люкс"
  }
}
```

### 2. Получить отзыв по ID

**GET** `/api/v1/reviews/{reviewId}`

**Аутентификация**: Не требуется

**Response** (200):
```json
{
  "success": true,
  "review": {
    "id": "uuid",
    "rating": 5,
    "comment": "Отличный сервис!",
    "photos": ["url1"],
    "is_anonymous": false,
    "status": "approved",
    "response": "Спасибо за отзыв!",
    "responded_at": "2024-01-02T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "customer_info": {
      "first_name": "Иван",
      "last_name": "Петров"
    },
    "service_name": "Стрижка собак",
    "company_name": "Зоосалон Люкс"
  }
}
```

### 3. Получить отзывы компании

**GET** `/api/v1/reviews/company/{companyId}`

**Аутентификация**: Не требуется

**Query Parameters**:
- `limit` (int): Количество отзывов (по умолчанию 20)
- `offset` (int): Смещение (по умолчанию 0)
- `status` (string): Статус отзыва (approved/pending/rejected, по умолчанию approved)
- `rating` (int): Фильтр по оценке (1-5)
- `service_id` (uuid): Фильтр по услуге

**Response** (200):
```json
{
  "success": true,
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Отличный сервис!",
      "is_anonymous": false,
      "created_at": "2024-01-01T00:00:00Z",
      "customer_info": {
        "first_name": "Иван",
        "last_name": "Петров"
      },
      "service_name": "Стрижка собак"
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

### 4. Получить статистику отзывов компании

**GET** `/api/v1/reviews/company/{companyId}/stats`

**Аутентификация**: Не требуется

**Response** (200):
```json
{
  "success": true,
  "stats": {
    "company_id": "uuid",
    "total_reviews": 25,
    "average_rating": 4.2,
    "rating_breakdown": {
      "5": 10,
      "4": 8,
      "3": 5,
      "2": 2,
      "1": 0
    },
    "recent_reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "comment": "Отличный сервис!",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 5. Получить отзывы пользователя

**GET** `/api/v1/reviews/my`

**Аутентификация**: Требуется (Pet Owner)

**Query Parameters**:
- `limit` (int): Количество отзывов (по умолчанию 20)
- `offset` (int): Смещение (по умолчанию 0)

**Response** (200):
```json
{
  "success": true,
  "reviews": [
    {
      "id": "uuid",
      "company_id": "uuid",
      "rating": 5,
      "comment": "Отличный сервис!",
      "status": "approved",
      "response": "Спасибо!",
      "created_at": "2024-01-01T00:00:00Z",
      "company_name": "Зоосалон Люкс",
      "service_name": "Стрижка собак"
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

### 6. Получить бронирования доступные для отзыва

**GET** `/api/v1/reviews/reviewable-bookings`

**Аутентификация**: Требуется (Pet Owner)

**Response** (200):
```json
{
  "success": true,
  "bookings": [
    {
      "id": "uuid",
      "company_id": "uuid",
      "service_id": "uuid",
      "date_time": "2024-01-01T10:00:00Z",
      "status": "completed",
      "company_name": "Зоосалон Люкс",
      "service_name": "Стрижка собак"
    }
  ]
}
```

### 7. Получить заказы доступные для отзыва

**GET** `/api/v1/reviews/reviewable-orders`

**Аутентификация**: Требуется (Pet Owner)

**Response** (200):
```json
{
  "success": true,
  "orders": [
    {
      "id": "uuid",
      "company_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "status": "completed",
      "total_amount": 1500.00,
      "company_name": "Зоомагазин Питомец"
    }
  ]
}
```

### 8. Ответить на отзыв (для компаний)

**POST** `/api/v1/reviews/respond`

**Аутентификация**: Требуется (Company Owner/Employee)

**Request Body**:
```json
{
  "review_id": "uuid",
  "response": "Спасибо за ваш отзыв! Мы очень ценим обратную связь."
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Response added successfully"
}
```

### 9. Удалить отзыв

**DELETE** `/api/v1/reviews/{reviewId}`

**Аутентификация**: Требуется (автор отзыва)

**Response** (200):
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

### 10. Модерация отзыва (Админ)

**PUT** `/api/v1/admin/reviews/{reviewId}/status`

**Аутентификация**: Требуется (SuperAdmin)

**Request Body**:
```json
{
  "status": "approved"  // approved, rejected, pending
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Review status updated successfully"
}
```

## Валидация и бизнес-правила

### Создание отзыва:
1. **Право на отзыв**: Пользователь может оставить отзыв только если у него есть завершенное бронирование или заказ в данной компании
2. **Один отзыв на бронирование/заказ**: Нельзя оставить несколько отзывов на одно бронирование или заказ
3. **Оценка**: Обязательна, от 1 до 5 звезд
4. **Комментарий**: Обязателен, от 10 до 1000 символов
5. **Фотографии**: Опционально, массив URL

### Ответ компании:
1. **Принадлежность**: Компания может отвечать только на отзывы о себе
2. **Длина ответа**: От 10 до 500 символов
3. **Один ответ**: Можно обновить существующий ответ

### Модерация:
1. **Статусы**: pending (ожидает модерации), approved (одобрен), rejected (отклонен)
2. **По умолчанию**: Новые отзывы получают статус "approved" (автоодобрение)
3. **Публичная видимость**: Только отзывы со статусом "approved" видны публично

## Статусы ошибок

- **400 Bad Request**: Невалидные данные запроса
- **401 Unauthorized**: Требуется аутентификация
- **403 Forbidden**: Нет прав доступа к ресурсу
- **404 Not Found**: Отзыв или ресурс не найден
- **500 Internal Server Error**: Внутренняя ошибка сервера

## Примеры использования

### 1. Создание отзыва после завершения бронирования:

```bash
# 1. Получить доступные для отзыва бронирования
curl -X GET "http://localhost:8080/api/v1/reviews/reviewable-bookings" \
  -H "Authorization: Bearer <token>"

# 2. Создать отзыв
curl -X POST "http://localhost:8080/api/v1/reviews/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "uuid",
    "booking_id": "uuid", 
    "rating": 5,
    "comment": "Отличный сервис, питомец доволен!"
  }'
```

### 2. Получение отзывов компании для отображения на странице:

```bash
curl -X GET "http://localhost:8080/api/v1/reviews/company/uuid?limit=10&offset=0&status=approved"
```

### 3. Ответ компании на отзыв:

```bash
curl -X POST "http://localhost:8080/api/v1/reviews/respond" \
  -H "Authorization: Bearer <company_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": "uuid",
    "response": "Спасибо за ваш отзыв! Мы рады, что вам понравилось."
  }'
```

## База данных

Отзывы хранятся в таблице `reviews` со следующей структурой:

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    service_id UUID REFERENCES services(id),
    booking_id UUID REFERENCES bookings(id),
    order_id UUID REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    is_anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'approved',
    response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Интеграция с аналитикой

Отзывы автоматически учитываются в:
- Средней оценке компании (`companies.rating`)
- Статистике компании (количество отзывов)
- Аналитических отчетах для SuperAdmin
- Рейтингах в marketplace

Система отзывов полностью интегрирована с существующими сервисами бронирований и заказов. 