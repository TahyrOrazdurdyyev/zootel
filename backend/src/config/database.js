import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '31.187.72.39',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'zootel123456',
  database: process.env.DB_NAME || 'zootel',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('🗄️  MySQL connected successfully');
    console.log(`📊 Database: ${process.env.DB_NAME || 'zootel'} @ ${process.env.DB_HOST || '31.187.72.39'}:${process.env.DB_PORT || 3306}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   Database server is not running or not accessible');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Invalid database credentials');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   Database does not exist - will attempt to create');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   Connection timeout - check VPS/firewall settings');
    }
    
    console.warn('⚠️  Continuing without database - using fallback mode');
    return false;
  }
};

// Create database if it doesn't exist
const createDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '31.187.72.39',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'zootel123456'
    });
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'zootel'}`);
    console.log(`✅ Database '${process.env.DB_NAME || 'zootel'}' created/verified`);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    return false;
  }
};

// Create all necessary tables
const createTables = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Companies table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL DEFAULT '',
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        address TEXT,
        city VARCHAR(100) DEFAULT '',
        state VARCHAR(100) DEFAULT '',
        zipCode VARCHAR(20) DEFAULT '',
        description TEXT,
        businessHours JSON,
        logoUrl VARCHAR(500) DEFAULT '',
        verified BOOLEAN DEFAULT FALSE,
        subscriptionPlan VARCHAR(50) DEFAULT 'basic',
        subscriptionStatus VARCHAR(50) DEFAULT 'active',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Services table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        duration INT NOT NULL DEFAULT 60,
        category VARCHAR(100) DEFAULT '',
        imageUrl VARCHAR(500) DEFAULT '',
        active BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Employees table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        position VARCHAR(100) DEFAULT '',
        specialties JSON,
        workingHours JSON,
        active BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
        UNIQUE KEY unique_company_email (companyId, email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Pet owners table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pet_owners (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) DEFAULT '',
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        address TEXT,
        emergencyContactName VARCHAR(255) DEFAULT '',
        emergencyContactPhone VARCHAR(50) DEFAULT '',
        emergencyContactRelationship VARCHAR(100) DEFAULT '',
        preferences JSON,
        lastActiveDate TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Pets table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pets (
        id VARCHAR(255) PRIMARY KEY,
        ownerId VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        breed VARCHAR(100) DEFAULT '',
        age INT DEFAULT 0,
        weight DECIMAL(5, 2) DEFAULT 0.00,
        gender VARCHAR(20) DEFAULT '',
        color VARCHAR(100) DEFAULT '',
        microchipId VARCHAR(100) DEFAULT '',
        photos JSON,
        medicalInfo JSON,
        behaviorNotes TEXT,
        specialNeeds TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ownerId) REFERENCES pet_owners(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Bookings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        serviceId VARCHAR(255) NOT NULL,
        petOwnerId VARCHAR(255) NOT NULL,
        petId VARCHAR(255) NOT NULL,
        employeeId VARCHAR(255) DEFAULT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        totalAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE,
        FOREIGN KEY (petOwnerId) REFERENCES pet_owners(id) ON DELETE CASCADE,
        FOREIGN KEY (petId) REFERENCES pets(id) ON DELETE CASCADE,
        FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Reviews table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(255) PRIMARY KEY,
        companyId VARCHAR(255) NOT NULL,
        petOwnerId VARCHAR(255) NOT NULL,
        bookingId VARCHAR(255) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (petOwnerId) REFERENCES pet_owners(id) ON DELETE CASCADE,
        FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    connection.release();
    console.log('✅ Database tables created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    console.warn('⚠️  Continuing without database tables');
    return false;
  }
};

// Insert demo company data (only for company_1)
const seedDemoData = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Check if demo company already exists
    const [rows] = await connection.execute(
      'SELECT id FROM companies WHERE id = ?',
      ['company_1']
    );
    
    if (rows.length === 0) {
      // Insert demo company
      await connection.execute(`
        INSERT INTO companies (
          id, name, email, phone, address, city, state, zipCode,
          description, businessHours, verified, subscriptionPlan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'company_1',
        'Pawsome Pet Services',
        'demo@pawsome.com',
        '(555) 123-4567',
        '123 Pet Street',
        'Pet City',
        'PC',
        '12345',
        'Professional pet grooming and care services',
        JSON.stringify({
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '10:00', close: '16:00' },
          sunday: { closed: true }
        }),
        true,
        'premium'
      ]);
      
      console.log('✅ Demo company data inserted');
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error seeding demo data:', error.message);
    console.warn('⚠️  Continuing without demo data');
    return false;
  }
};

// Migrate employees table to new schema
const migrateEmployeesTable = async () => {
  try {
    const connection = await pool.getConnection();
    
    try {
      // Check if firebaseUid column exists and drop it
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'employees' AND COLUMN_NAME = 'firebaseUid'
      `, ['zootel']);

      if (columns.length > 0) {
        console.log('🔄 Migrating employees table: removing firebaseUid column...');
        await connection.execute('ALTER TABLE employees DROP COLUMN firebaseUid');
        console.log('✅ Removed firebaseUid column from employees table');
      }

      // Check if role column exists and rename to position
      const [roleColumns] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'employees' AND COLUMN_NAME = 'role'
      `, ['zootel']);

      if (roleColumns.length > 0) {
        console.log('🔄 Migrating employees table: renaming role to position...');
        await connection.execute('ALTER TABLE employees CHANGE COLUMN role position VARCHAR(100) DEFAULT ""');
        console.log('✅ Renamed role column to position in employees table');
      }

      // Add unique constraint for company-email combination if it doesn't exist
      const [constraints] = await connection.execute(`
        SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'employees' AND CONSTRAINT_NAME = 'unique_company_email'
      `, ['zootel']);

      if (constraints.length === 0) {
        console.log('🔄 Adding unique constraint for company-email combination...');
        await connection.execute('ALTER TABLE employees ADD UNIQUE KEY unique_company_email (companyId, email)');
        console.log('✅ Added unique constraint for company-email combination');
      }

      connection.release();
      console.log('✅ Employees table migration completed successfully');
      return true;
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('❌ Error migrating employees table:', error.message);
    console.warn('⚠️  Continuing without migration');
    return false;
  }
};

export { pool, testConnection, createDatabase, createTables, seedDemoData, migrateEmployeesTable };
export default pool; 