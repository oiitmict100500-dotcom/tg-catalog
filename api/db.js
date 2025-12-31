// Модуль для подключения к PostgreSQL
// Поддерживает Vercel Postgres (@vercel/postgres) и внешние PostgreSQL базы данных (pg)

// Подавляем предупреждение url.parse() из библиотеки pg (не критично, но мешает в логах)
if (typeof process !== 'undefined' && process.on) {
  process.on('warning', (warning) => {
    if (warning.name === 'DeprecationWarning' && warning.message && warning.message.includes('url.parse()')) {
      return; // Игнорируем это предупреждение (это внутренняя проблема библиотеки pg)
    }
    // Другие предупреждения оставляем как есть
  });
}

let pgPool = null;

// Инициализация подключения к базе данных
let dbInitialized = false;
async function initDatabase() {
  if (dbInitialized && pgPool) {
    return; // Уже инициализировано
  }
  
  if (pgPool) {
    dbInitialized = true;
    return;
  }

  console.log('🔧 Initializing database connection...');
  console.log('🔍 Environment check:', {
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    postgresUrlLength: process.env.POSTGRES_URL?.length || 0,
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
  });

  try {
    // Приоритет: DATABASE_URL > POSTGRES_URL
    // DATABASE_URL обычно используется для внешних баз (Neon, Supabase)
    // POSTGRES_URL может быть для Vercel Postgres
    
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error('No database connection string found. Set DATABASE_URL or POSTGRES_URL environment variable.');
    }

    // Используем pg библиотеку для всех PostgreSQL подключений
    // Это работает одинаково для Vercel Postgres, Neon, Supabase и любых других PostgreSQL баз
    console.log('🔍 Using PostgreSQL via pg...');
    console.log('🔍 Connection string source:', process.env.DATABASE_URL ? 'DATABASE_URL' : 'POSTGRES_URL');
    console.log('🔍 Connection string preview:', connectionString ? connectionString.substring(0, 30) + '...' : 'MISSING');
    
    const { Pool } = await import('pg');
    
    // Определяем SSL настройки
    const needsSSL = connectionString.includes('sslmode=require') || 
                     connectionString.includes('neon.tech') || 
                     connectionString.includes('supabase.co') ||
                     connectionString.includes('sslmode=require');
    
    pgPool = new Pool({
      connectionString: connectionString,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : 
           needsSSL ? { rejectUnauthorized: false } :
           false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    dbInitialized = true;
    console.log('✅ Created PostgreSQL pool (SSL:', needsSSL ? 'enabled' : 'disabled', ')');
    
    // Проверяем подключение
    console.log('🔍 Testing connection...');
    await pgPool.query('SELECT 1');
    console.log('✅ PostgreSQL connection verified');
    return;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  }
}

// Выполнение SQL запроса
// Использует только pg библиотеку для всех PostgreSQL подключений
export async function query(text, params) {
  await initDatabase();

  if (!pgPool) {
    throw new Error('Database pool not initialized');
  }

  try {
    return await pgPool.query(text, params);
  } catch (error) {
    console.error('❌ Query error:', error);
    console.error('Query:', text.substring(0, 200));
    console.error('Params:', params);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    throw error;
  }
}

// Инициализация таблиц (создание, если не существуют)
export async function initTables() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS moderation_submissions (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        telegram_link VARCHAR(500),
        telegram_username VARCHAR(255),
        category_id VARCHAR(50) NOT NULL,
        subcategory_id VARCHAR(50) NOT NULL,
        cover_image TEXT NOT NULL,
        is_private BOOLEAN DEFAULT FALSE,
        author_id VARCHAR(255) NOT NULL,
        author_username VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        moderated_by_id VARCHAR(255),
        moderated_by VARCHAR(255),
        moderated_at TIMESTAMP,
        rejection_reason TEXT
      );
      
      CREATE TABLE IF NOT EXISTS resources (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        telegram_link VARCHAR(500),
        telegram_username VARCHAR(255),
        category_id VARCHAR(50) NOT NULL,
        subcategory_id VARCHAR(50),
        cover_image TEXT,
        is_private BOOLEAN DEFAULT FALSE,
        author_id VARCHAR(255) NOT NULL,
        author_username VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        is_paid BOOLEAN DEFAULT FALSE,
        paid_until TIMESTAMP,
        moderated_by_id VARCHAR(255),
        moderated_by VARCHAR(255),
        moderated_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS ad_slot_purchases (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        resource_id VARCHAR(255),
        category_id VARCHAR(50) NOT NULL,
        duration_days INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_id VARCHAR(255),
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_status ON moderation_submissions(status);
      CREATE INDEX IF NOT EXISTS idx_created_at ON moderation_submissions(created_at);
      CREATE INDEX IF NOT EXISTS idx_author_id ON moderation_submissions(author_id);
      
      CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category_id);
      CREATE INDEX IF NOT EXISTS idx_resources_paid ON resources(is_paid, paid_until);
      CREATE INDEX IF NOT EXISTS idx_resources_author ON resources(author_id);
      CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
      CREATE INDEX IF NOT EXISTS idx_resources_status_category ON resources(status, category_id);
      
      CREATE INDEX IF NOT EXISTS idx_purchases_user ON ad_slot_purchases(user_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_category ON ad_slot_purchases(category_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_status ON ad_slot_purchases(status);
      CREATE INDEX IF NOT EXISTS idx_purchases_expires ON ad_slot_purchases(expires_at);
    `;

    await query(createTableQuery);
    
    // Обновляем существующую таблицу resources (добавляем новые поля, если их нет)
    try {
      await query(`ALTER TABLE resources ALTER COLUMN subcategory_id DROP NOT NULL`);
    } catch (e) {
      // Игнорируем ошибку
    }
    
    try {
      await query(`ALTER TABLE resources ALTER COLUMN cover_image DROP NOT NULL`);
    } catch (e) {
      // Игнорируем ошибку
    }
    
    try {
      await query(`ALTER TABLE resources ALTER COLUMN author_username DROP NOT NULL`);
    } catch (e) {
      // Игнорируем ошибку
    }
    
    // Добавляем поле status, если его нет (PostgreSQL не поддерживает IF NOT EXISTS для ALTER TABLE)
    try {
      // Проверяем, существует ли колонка
      const checkColumn = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'resources' AND column_name = 'status'
      `);
      
      if (!checkColumn.rows || checkColumn.rows.length === 0) {
        // Колонки нет, добавляем
        await query(`ALTER TABLE resources ADD COLUMN status VARCHAR(50) DEFAULT 'pending'`);
        console.log('✅ Added status column to resources table');
        // Обновляем существующие записи без статуса
        await query(`UPDATE resources SET status = 'approved' WHERE status IS NULL`);
        console.log('✅ Updated existing resources to approved status');
      } else {
        console.log('✅ Status column already exists');
      }
    } catch (e) {
      console.warn('⚠️ Could not add status column (may already exist):', e.message);
      // Игнорируем ошибку, колонка может уже существовать
    }
    
    // Добавляем поля модерации, если их нет
    const moderationColumns = [
      { name: 'moderated_by_id', type: 'VARCHAR(255)' },
      { name: 'moderated_by', type: 'VARCHAR(255)' },
      { name: 'moderated_at', type: 'TIMESTAMP' },
      { name: 'rejection_reason', type: 'TEXT' },
    ];
    
    for (const col of moderationColumns) {
      try {
        const checkColumn = await query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'resources' AND column_name = $1
        `, [col.name]);
        
        if (!checkColumn.rows || checkColumn.rows.length === 0) {
          await query(`ALTER TABLE resources ADD COLUMN ${col.name} ${col.type}`);
          console.log(`✅ Added ${col.name} column to resources table`);
        }
      } catch (e) {
        console.warn(`⚠️ Could not add ${col.name} column:`, e.message);
      }
    }
    
    // Создаем индексы, если их нет
    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_resources_status_category ON resources(status, category_id)`);
    } catch (e) {
      // Игнорируем ошибку
    }
    
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Error initializing tables:', error);
    throw error;
  }
}

// Закрытие подключения (для тестирования)
export async function closePool() {
  if (pgPool) {
    if (typeof pgPool.end === 'function') {
      await pgPool.end();
    }
    pgPool = null;
    dbInitialized = false;
    console.log('✅ Database connection closed');
  }
}

