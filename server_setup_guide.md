# Руководство по настройке сервера для Zootel Backend

## 1. Установка PostgreSQL

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### CentOS/RHEL:
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 2. Настройка базы данных

```bash
# Переключиться на пользователя postgres
sudo -u postgres psql

# В psql консоли:
CREATE DATABASE zootel;
CREATE USER zootel_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE zootel TO zootel_user;
ALTER USER zootel_user CREATEDB;
\q
```

## 3. Создать .env файл

В папке `/var/www/zootel/backend/` создайте файл `.env`:

```env
# Database Configuration
DB_CONNECTION=postgres://zootel_user:your_secure_password@localhost:5432/zootel?sslmode=disable

# Server Configuration
API_HOST=0.0.0.0
API_PORT=4000
ENVIRONMENT=production

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000

# JWT Configuration
JWT_SECRET=your-very-secure-jwt-secret-key-change-this

# Firebase Configuration (если используете)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CREDENTIALS_PATH=./config/serviceAccountKey.json

# Stripe Configuration (если используете)
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=your_sendgrid_api_key
EMAIL_FROM_EMAIL=noreply@yourdomain.com
EMAIL_FROM_NAME=Zootel

# SMS Configuration
SMS_PROVIDER=twilio
SMS_API_KEY=your_twilio_api_key

# OpenAI Configuration (если используете AI функции)
OPENAI_API_KEY=your_openai_api_key
```

## 4. Установить Go (если не установлен)

```bash
# Скачать и установить Go
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz

# Добавить в PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

## 5. Настройка проекта

```bash
# Перейти в папку backend
cd /var/www/zootel/backend

# Установить зависимости
go mod tidy

# Запустить миграции базы данных
go run scripts/setup-database/main.go

# Создать суперадмина (опционально)
go run scripts/createSuperAdmin/main.go
```

## 6. Создать systemd сервис

Создайте файл `/etc/systemd/system/zootel-backend.service`:

```ini
[Unit]
Description=Zootel Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/zootel/backend
ExecStart=/usr/local/go/bin/go run cmd/main.go
Restart=always
RestartSec=5
Environment=PATH=/usr/local/go/bin:/usr/bin:/bin
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

## 7. Запуск сервиса

```bash
# Перезагрузить systemd
sudo systemctl daemon-reload

# Запустить сервис
sudo systemctl start zootel-backend

# Включить автозапуск
sudo systemctl enable zootel-backend

# Проверить статус
sudo systemctl status zootel-backend
```

## 8. Настройка файрвола

```bash
# Разрешить порт 4000
sudo ufw allow 4000

# Или если используете iptables:
sudo iptables -A INPUT -p tcp --dport 4000 -j ACCEPT
```

## 9. Настройка Nginx (рекомендуется)

Создайте файл `/etc/nginx/sites-available/zootel-backend`:

```nginx
server {
    listen 80;
    server_name your-api-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Активировать конфигурацию
sudo ln -s /etc/nginx/sites-available/zootel-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 10. SSL сертификат (рекомендуется)

```bash
# Установить certbot
sudo apt install certbot python3-certbot-nginx

# Получить SSL сертификат
sudo certbot --nginx -d your-api-domain.com
```

## Проверка работы

После выполнения всех шагов проверьте:

```bash
# Проверить статус сервиса
sudo systemctl status zootel-backend

# Проверить логи
sudo journalctl -u zootel-backend -f

# Проверить подключение
curl http://localhost:4000/health
curl http://localhost:4000/api/v1/ping
```

## Устранение проблем

### Если сервис не запускается:
```bash
# Проверить логи
sudo journalctl -u zootel-backend -n 50

# Проверить права доступа
sudo chown -R www-data:www-data /var/www/zootel/backend

# Проверить подключение к базе данных
sudo -u postgres psql -d zootel -c "SELECT 1;"
```

### Если база данных недоступна:
```bash
# Проверить статус PostgreSQL
sudo systemctl status postgresql

# Проверить подключение
sudo -u postgres psql -l

# Перезапустить PostgreSQL
sudo systemctl restart postgresql
``` 