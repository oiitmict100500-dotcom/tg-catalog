// Модуль для подключения к PostgreSQL
// Поддерживает Vercel Postgres и внешние PostgreSQL базы данных

let isVercelPostgres = false;
let pgPool = null;

// Инициализация подключения к базе данных
export async function getPool() {
  // Определяем тип подключения один раз
  if (isVercelPostgres === false && !pgPool) {
    if (process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
      // Vercel Postgres - не используем pool, используем прямой sql
      isVercelPostgres = true;
      console.log('✅ Using Vercel Postgres');
      return null; // Для Vercel Postgres не нужен pool
    } else if (process.env.DATABASE_URL) {
      // Внешний PostgreSQL (Supabase, Neon, и т.д.)
      const { Pool } = await import('pg');
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      });
      console.log('✅ Connected to external PostgreSQL');
      
      // Проверяем подключение
      await pgPool.query('SELECT 1');
      console.log('✅ Database connection verified');
    } else {
      throw new Error('No database connection string found. Set POSTGRES_URL (for Vercel Postgres) or DATABASE_URL (for external PostgreSQL) environment variable.');
    }
  }

  return pgPool;
}

// Выполнение SQL запроса
export async function query(text, params) {
  try {
    // Для Vercel Postgres используется другой API
    if (isVercelPostgres || (process.env.POSTGRES_URL && !process.env.DATABASE_URL)) {
      // Vercel Postgres использует sql из @vercel/postgres
      const { sql } = await import('@vercel/postgres');
      
      // Vercel Postgres поддерживает параметризованные запросы через template literals
      // Но для совместимости преобразуем параметры
      if (params && params.length > 0) {
        // Используем sql template для параметризованных запросов
        // Для простоты преобразуем в обычный запрос с экранированием
        let queryText = text;
        params.forEach((param, index) => {
          const placeholder = `$${index + 1}`;
          const value = param === null ? 'NULL' : 
                       typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` :
                       typeof param === 'boolean' ? (param ? 'TRUE' : 'FALSE') :
                       String(param);
          queryText = queryText.replace(placeholder, value);
        });
        const result = await sql.query(queryText);
        return { rows: result.rows || result };
      } else {
        const result = await sql.query(text);
        return { rows: result.rows || result };
      }
    } else {
      // Обычный PostgreSQL (pg)
      const db = await getPool();
      if (!db) {
        throw new Error('Database pool not initialized');
      }
      return await db.query(text, params);
    }
  } catch (error) {
    console.error('❌ Query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
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
      
      CREATE INDEX IF NOT EXISTS idx_status ON moderation_submissions(status);
      CREATE INDEX IF NOT EXISTS idx_created_at ON moderation_submissions(created_at);
      CREATE INDEX IF NOT EXISTS idx_author_id ON moderation_submissions(author_id);
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
  if (pool) {
    if (typeof pool.end === 'function') {
      await pool.end();
    }
    pool = null;
    console.log('✅ Database connection closed');
  }
}

