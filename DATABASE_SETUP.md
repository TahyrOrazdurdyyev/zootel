# 🗄️ Database Setup Guide for Zootel VPS

This guide helps you set up the MySQL database on your VPS server (31.187.72.39) for the Zootel application.

## 📋 Prerequisites

Your VPS should have:
- MySQL Server 8.0+ installed
- Port 3306 accessible
- Root access or database user privileges

## 🚀 Quick Setup Steps

### Step 1: Connect to MySQL
```bash
# On your VPS, connect to MySQL
mysql -u root -p
```

### Step 2: Create Database and User
```sql
-- Create the database
CREATE DATABASE IF NOT EXISTS zootel;

-- Create a dedicated user (recommended)
CREATE USER IF NOT EXISTS 'zootel_user'@'%' IDENTIFIED BY 'zootel123456';

-- Grant privileges
GRANT ALL PRIVILEGES ON zootel.* TO 'zootel_user'@'%';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### Step 3: Update Environment Variables
Copy `env.production` to `.env` on your VPS and update:
```bash
# On your VPS
cp env.production .env

# Edit the .env file with your actual Firebase credentials
nano .env
```

### Step 4: Start the Application
```bash
# Install dependencies
npm install

# Start with PM2
pm2 start backend/src/server.js --name "zootel-backend"
pm2 save
```

## 🎯 Database Schema

The application will automatically create these tables:

### Core Tables
- **companies** - Pet service provider companies
- **services** - Services offered by companies  
- **employees** - Company staff members
- **pet_owners** - Pet owner accounts
- **pets** - Pet profiles
- **bookings** - Service appointments
- **reviews** - Customer reviews

### Relationships
- Companies → Services (1:many)
- Companies → Employees (1:many)
- Pet Owners → Pets (1:many)
- Companies/Services → Bookings (many:many)
- Bookings → Reviews (1:1)

## 🔧 Troubleshooting

### Connection Issues
```bash
# Check MySQL status
systemctl status mysql

# Check if port is open
netstat -tlnp | grep 3306

# Test connection
mysql -h 31.187.72.39 -u root -p
```

### Permission Issues
```sql
-- Check user privileges
SHOW GRANTS FOR 'zootel_user'@'%';

-- Allow remote connections
UPDATE mysql.user SET host='%' WHERE user='root';
FLUSH PRIVILEGES;
```

### Firewall Issues
```bash
# Open MySQL port
ufw allow 3306/tcp

# Or for specific IP
ufw allow from YOUR_IP to any port 3306
```

## 📊 Database Monitoring

### Check Tables
```sql
USE zootel;
SHOW TABLES;
DESCRIBE companies;
```

### Check Data
```sql
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM services;
SELECT COUNT(*) FROM bookings;
```

## 🔒 Security Notes

1. **Change default passwords** in production
2. **Use dedicated database user** instead of root
3. **Enable SSL** for database connections
4. **Regular backups** - set up automated backups
5. **Firewall rules** - restrict MySQL access to application server only

## 🚨 Important

- The application includes **automatic table creation**
- **One demo company** will be seeded automatically
- **Empty data state** for new companies (no mock data)
- **Firebase authentication** required for user management

Your database is now ready for production use! 🎉 