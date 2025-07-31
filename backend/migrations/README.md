# Database Migrations for Zootel

This directory contains database migrations for the Zootel platform.

## Overview

Migrations are executed in numerical order and set up the complete database schema for the platform.

## Files

- `001_initial_schema.sql` - Creates all tables, indexes, and triggers
- `002_seed_data.sql` - Inserts initial data (plans, categories, pet types, etc.)

## Running Migrations

### Prerequisites

1. **PostgreSQL** installed and running
2. **Database created**:
   ```sql
   CREATE DATABASE zootel_dev;
   CREATE DATABASE zootel_prod;
   ```
3. **User with permissions**:
   ```sql
   CREATE USER zootel_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE zootel_dev TO zootel_user;
   GRANT ALL PRIVILEGES ON DATABASE zootel_prod TO zootel_user;
   ```

### Manual Migration

1. **Connect to your database**:
   ```bash
   psql -h localhost -U zootel_user -d zootel_dev
   ```

2. **Run migrations in order**:
   ```sql
   \i 001_initial_schema.sql
   \i 002_seed_data.sql
   ```

### Using Environment Variables

Make sure your environment variables are set:

```env
DB_CONNECTION=postgres://zootel_user:your_password@localhost:5432/zootel_dev
```

### Automated Migration Script

Create and run this script:

```bash
#!/bin/bash
# setup-database.sh

# Load environment variables
source .env

# Extract database connection details
DB_URL=$DB_CONNECTION

echo "Setting up Zootel database..."

# Run migrations
psql $DB_URL -f migrations/001_initial_schema.sql
if [ $? -eq 0 ]; then
    echo "✅ Schema migration completed"
else
    echo "❌ Schema migration failed"
    exit 1
fi

psql $DB_URL -f migrations/002_seed_data.sql
if [ $? -eq 0 ]; then
    echo "✅ Seed data migration completed"
else
    echo "❌ Seed data migration failed"
    exit 1
fi

echo "🎉 Database setup completed successfully!"
```

Make it executable and run:

```bash
chmod +x setup-database.sh
./setup-database.sh
```

## Schema Overview

### Core Tables

1. **users** - Platform users (pet owners, company owners)
2. **companies** - Pet care businesses
3. **employees** - Company staff members
4. **pets** - User's pets with medical records
5. **bookings** - Service appointments
6. **orders** - Product purchases
7. **chats** - Customer support conversations
8. **messages** - Chat messages
9. **ai_agents** - AI assistant configurations

### Reference Tables

1. **plans** - Subscription plans
2. **payment_settings** - Global payment configuration
3. **pet_types** - Species (Dog, Cat, etc.)
4. **breeds** - Pet breeds by species
5. **service_categories** - Service classifications
6. **services** - Company services
7. **products** - Company products

### System Tables

1. **notification_schedule** - Scheduled notifications
2. **messages** - Chat and AI messages

## Initial Data

The seed migration includes:

### Plans
- **Starter** ($29.99/month) - Basic CRM, 5 employees
- **Professional** ($79.99/month) - Advanced CRM, 20 employees, AI agents
- **Enterprise** ($199.99/month) - Full suite, unlimited employees

### Pet Types & Breeds
- **Dogs**: 13 popular breeds including mixed breeds
- **Cats**: 12 popular breeds including mixed breeds
- **Other**: Birds, Fish, Rabbits, etc.

### Service Categories
- Veterinary Services
- Pet Grooming
- Pet Boarding
- Pet Training
- Pet Walking
- Pet Sitting
- Emergency Care
- Pet Supplies
- Pet Food

## Verification

After running migrations, verify the setup:

```sql
-- Check table count
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return 18 tables

-- Check sample data
SELECT name, price FROM plans;
SELECT name FROM pet_types;
SELECT name FROM service_categories;

-- Check indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public';
```

## Rollback

To rollback migrations (⚠️ **This will delete all data!**):

```sql
-- Drop all tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## Common Issues

### 1. Permission Denied
```
ERROR: permission denied for schema public
```
**Solution**: Grant proper permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE zootel_dev TO zootel_user;
GRANT ALL ON SCHEMA public TO zootel_user;
```

### 2. UUID Extension Error
```
ERROR: extension "uuid-ossp" does not exist
```
**Solution**: Install the extension:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 3. Connection Refused
```
could not connect to server: Connection refused
```
**Solution**: 
- Check if PostgreSQL is running
- Verify connection string
- Check firewall settings

### 4. Database Does Not Exist
```
FATAL: database "zootel_dev" does not exist
```
**Solution**: Create the database first:
```sql
CREATE DATABASE zootel_dev;
```

## Migration Best Practices

1. **Always backup** before running migrations in production
2. **Test migrations** in development environment first
3. **Run migrations** during maintenance windows
4. **Monitor** migration execution for errors
5. **Verify data integrity** after migrations
6. **Document** any manual steps required

## Production Considerations

For production deployments:

1. **Create database backup**:
   ```bash
   pg_dump -U postgres -d zootel_prod > backup_$(date +%Y%m%d).sql
   ```

2. **Run migrations in transaction**:
   ```sql
   BEGIN;
   \i 001_initial_schema.sql
   \i 002_seed_data.sql
   COMMIT;
   ```

3. **Monitor performance**:
   - Index creation may take time on large datasets
   - Consider running during low-traffic periods

4. **Verify application connectivity** after migration

## Future Migrations

When adding new migrations:

1. **Use sequential numbering**: `003_add_new_feature.sql`
2. **Include rollback scripts**: `003_add_new_feature_rollback.sql`
3. **Test thoroughly** in development
4. **Document breaking changes**
5. **Consider data migration** for existing records

## Support

For database-related issues:
- Check PostgreSQL logs: `/var/log/postgresql/`
- Verify environment variables
- Test database connectivity
- Review migration output for errors 