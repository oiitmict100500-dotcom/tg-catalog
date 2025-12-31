# Настройка DATABASE_URL в Vercel

## Критически важно!

Без переменной `DATABASE_URL` база данных PostgreSQL не работает, и ресурсы не сохраняются и не загружаются.

## Быстрая настройка через Neon

### Шаг 1: Создайте проект на Neon

1. Откройте https://neon.tech
2. Войдите через GitHub (или создайте аккаунт)
3. Нажмите **Create Project**
4. Выберите:
   - **Region**: ближайший к вам (например, EU (Frankfurt))
   - **PostgreSQL version**: 15 или 16
   - **Plan**: Free (для начала)
5. Нажмите **Create Project**

### Шаг 2: Получите Connection String

1. В проекте Neon перейдите в **Dashboard**
2. Найдите раздел **Connection Details** или **Connection string**
3. Нажмите на кнопку **Copy** рядом с connection string
4. Строка должна выглядеть так:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### Шаг 3: Добавьте DATABASE_URL в Vercel

1. Откройте ваш проект на Vercel: https://vercel.com
2. Перейдите в **Settings** → **Environment Variables**
3. Нажмите **Add New**
4. Заполните:
   - **Name**: `DATABASE_URL`
   - **Value**: вставьте скопированную строку подключения из Neon
   - **Environment**: выберите все три:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
5. Нажмите **Save**

### Шаг 4: Перезапустите деплой

1. Перейдите в **Deployments**
2. Найдите последний деплой
3. Нажмите **...** (три точки) → **Redeploy**
4. Или сделайте новый коммит в GitHub

## Проверка работы

После настройки:

1. **Проверьте логи:**
   - Functions → `/api/resources/submit`
   - Должны быть логи: `✅ Connected to PostgreSQL via pg`
   - Должны быть логи: `✅ Database tables initialized`

2. **Отправьте тестовую заявку:**
   - Заполните форму добавления ресурса
   - Отправьте на модерацию
   - Проверьте логи в `/api/resources/submit`

3. **Проверьте тестовый endpoint:**
   - `https://tg-catalog-one.vercel.app/api/resources/test`
   - Должны быть видны все ресурсы в базе данных

## Альтернатива: Supabase

Если Neon не работает, используйте Supabase:

1. Откройте https://supabase.com
2. Создайте проект
3. В **Settings** → **Database** найдите **Connection string**
4. Скопируйте строку (URI format)
5. Добавьте в Vercel как `DATABASE_URL`

## Важно!

- **Не делитесь** connection string публично
- **Не коммитьте** connection string в Git
- Храните его только в Environment Variables в Vercel
- После добавления переменной **обязательно перезапустите деплой**

## Устранение проблем

### Ошибка: "No database connection string found"
- Проверьте, что переменная `DATABASE_URL` добавлена в Vercel
- Убедитесь, что переменная добавлена для всех окружений
- Перезапустите деплой после добавления

### Ошибка: "Connection refused"
- Проверьте, что connection string правильный
- Убедитесь, что проект Neon активен
- Проверьте, что IP не заблокирован (для Neon обычно разрешены все IP)

### Ошибка: "relation 'resources' does not exist"
- Таблица должна создаваться автоматически
- Попробуйте отправить заявку еще раз
- Проверьте логи на наличие ошибок создания таблицы

