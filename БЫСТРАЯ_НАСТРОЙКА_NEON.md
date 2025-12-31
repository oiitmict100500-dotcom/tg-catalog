# Быстрая настройка Neon для хранения заявок

## Способ 1: Через Vercel Marketplace (если видите Neon)

1. **Откройте Marketplace:**
   - Перейдите на https://vercel.com/marketplace
   - Или в проекте: **Settings** → **Integrations** → **Browse Marketplace**

2. **Найдите Neon:**
   - В разделе **Native Storage Integrations** найдите карточку **Neon**
   - Нажмите на карточку

3. **Установите:**
   - Нажмите **Install** или **Add Integration**
   - Выберите ваш проект
   - Следуйте инструкциям

## Способ 2: Прямо на Neon (рекомендуется, если Marketplace не работает)

1. **Создайте проект на Neon:**
   - Откройте https://neon.tech
   - Войдите через GitHub (или создайте аккаунт)
   - Нажмите **Create Project**
   - Выберите регион (ближайший к вам)
   - Выберите план **Free** (для начала)
   - Нажмите **Create Project**

2. **Получите connection string:**
   - В проекте Neon перейдите в **Dashboard**
   - Найдите раздел **Connection Details** или **Connection string**
   - Скопируйте строку подключения (начинается с `postgresql://`)

3. **Добавьте в Vercel:**
   - В вашем проекте Vercel перейдите в **Settings** → **Environment Variables**
   - Нажмите **Add New**
   - **Name:** `DATABASE_URL`
   - **Value:** вставьте скопированную строку подключения
   - Выберите окружения: **Production**, **Preview**, **Development**
   - Нажмите **Save**

4. **Перезапустите деплой:**
   - Перейдите в **Deployments**
   - Найдите последний деплой
   - Нажмите **...** → **Redeploy**

## Проверка работы

1. **Отправьте тестовую заявку:**
   - Заполните форму добавления ресурса
   - Отправьте на модерацию

2. **Проверьте логи:**
   - В Vercel: **Functions** → `/api/resources/submit`
   - Должны быть логи:
     - `✅ Connected to PostgreSQL via pg`
     - `✅ Database tables initialized`
     - `✅ Submission saved to PostgreSQL`

3. **Проверьте панель модерации:**
   - Войдите как админ
   - Перейдите в **Модерация заявок**
   - Заявка должна появиться в списке

## Если что-то не работает

- **Ошибка "No database connection string found":**
  - Проверьте, что переменная `DATABASE_URL` добавлена в Vercel
  - Убедитесь, что выбраны все окружения (Production, Preview, Development)
  - Перезапустите деплой

- **Ошибка "Connection refused":**
  - Проверьте, что connection string правильный
  - Убедитесь, что проект Neon активен
  - Попробуйте скопировать connection string заново

- **Таблица не создается:**
  - Проверьте логи в `/api/resources/submit`
  - Убедитесь, что база данных доступна
  - Попробуйте отправить заявку еще раз

