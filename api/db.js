// Модуль для подключения к PostgreSQL
// Поддерживает Vercel Postgres (@vercel/postgres) и внешние PostgreSQL базы данных (pg)

let dbType = null; // 'vercel' или 'pg'
let pgPool = null;
let vercelSql = null;

// Инициализация подключения к базе данных
async function initDatabase() {
  if (dbType !== null) {
    return; // Уже инициализировано
  }

  try {
    // Проверяем наличие @vercel/postgres (старый Vercel Postgres)
    if (process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
      try {
        const postgres = await import('@vercel/postgres');
        vercelSql = postgres.sql;
        dbType = 'vercel';
        console.log('✅ Using Vercel Postgres (@vercel/postgres)');
        
        // Проверяем подключение
        await vercelSql`SELECT 1`;
        console.log('✅ Vercel Postgres connection verified');
        return;
      } catch (e) {
        console.warn('⚠️ @vercel/postgres not available, trying pg...', e.message);
      }
    }

    // Используем обычный PostgreSQL через pg (Neon, Supabase, и т.д.)
    if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
      const { Pool } = await import('pg');
      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      
      pgPool = new Pool({
        connectionString: connectionString,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : 
             connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } :
             connectionString.includes('neon.tech') || connectionString.includes('supabase.co') ? { rejectUnauthorized: false } :
             false,
      });
      dbType = 'pg';
      console.log('✅ Connected to PostgreSQL via pg');
      
      // Проверяем подключение
      await pgPool.query('SELECT 1');
      console.log('✅ PostgreSQL connection verified');
      return;
    }

    throw new Error('No database connection string found. Set POSTGRES_URL (for Vercel Postgres) or DATABASE_URL (for external PostgreSQL) environment variable.');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Выполнение SQL запроса
export async function query(text, params) {
  await initDatabase();

  try {
    if (dbType === 'vercel' && vercelSql) {
      // Vercel Postgres использует template literals для параметризованных запросов
      // Преобразуем стандартные параметры $1, $2 в безопасный запрос
      if (params && params.length > 0) {
        // Используем sql.unsafe для выполнения запроса с экранированием параметров
        let queryText = text;
        params.forEach((param, index) => {
          const placeholder = `$${index + 1}`;
          let value;
          if (param === null || param === undefined) {
            value = 'NULL';
          } else if (typeof param === 'string') {
            // Экранируем строки для SQL
            value = `'${param.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
          } else if (typeof param === 'boolean') {
            value = param ? 'TRUE' : 'FALSE';
          } else if (param instanceof Date) {
            value = `'${param.toISOString()}'`;
          } else {
            value = String(param);
          }
          // Заменяем только первое вхождение каждого плейсхолдера
          queryText = queryText.replace(placeholder, value);
        });
        
        // Используем sql.unsafe для выполнения запроса
        const result = await vercelSql.unsafe(queryText);
        return { rows: Array.isArray(result) ? result : (result.rows || []) };
      } else {
        const result = await vercelSql.unsafe(text);
        return { rows: Array.isArray(result) ? result : (result.rows || []) };
      }
    } else if (dbType === 'pg' && pgPool) {
      // Обычный PostgreSQL через pg
      return await pgPool.query(text, params);
    } else {
      throw new Error('Database not initialized');
    }
  } catch (error) {
    console.error('❌ Query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    console.error('DB Type:', dbType);
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
        subcategory_id VARCHAR(50) NOT NULL,
        cover_image TEXT NOT NULL,
        is_private BOOLEAN DEFAULT FALSE,
        author_id VARCHAR(255) NOT NULL,
        author_username VARCHAR(255) NOT NULL,
        is_paid BOOLEAN DEFAULT FALSE,
        paid_until TIMESTAMP,
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
      
      CREATE INDEX IF NOT EXISTS idx_purchases_user ON ad_slot_purchases(user_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_category ON ad_slot_purchases(category_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_status ON ad_slot_purchases(status);
      CREATE INDEX IF NOT EXISTS idx_purchases_expires ON ad_slot_purchases(expires_at);
    `;

    await query(createTableQuery);
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
    dbType = null;
    vercelSql = null;
    console.log('✅ Database connection closed');
  }
}

