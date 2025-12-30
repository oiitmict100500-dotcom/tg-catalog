# Настройка для Production на Vercel

## Проблема
Frontend развернут на Vercel, но backend должен быть развернут отдельно. Для работы авторизации через Telegram нужно:

## Вариант 1: Backend развернут отдельно (рекомендуется)

### 1. Разверните backend на отдельном хостинге
- Railway: https://railway.app
- Render: https://render.com
- Heroku: https://heroku.com
- Или любой другой хостинг с поддержкой Node.js

### 2. Настройте переменную окружения на Vercel

1. Откройте Vercel Dashboard → Ваш проект → Settings → Environment Variables
2. Добавьте переменную:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://ваш-backend-url.com` (без слеша в конце!)
   - **Environment**: Production, Preview, Development

Пример:
```
VITE_API_URL=https://tg-catalog-backend.railway.app
```

### 3. Пересоберите проект на Vercel
После добавления переменной окружения пересоберите проект (или сделайте новый commit).

## Вариант 2: Использовать Vercel Serverless Functions (если backend небольшой)

Если backend можно переделать под serverless функции, можно использовать Vercel Functions.

## Важные переменные окружения для Backend

Убедитесь, что на backend хостинге установлены:

1. **TELEGRAM_BOT_TOKEN** - токен бота из BotFather
2. **FRONTEND_URL** - URL вашего frontend на Vercel (например: `https://oiitmict100500-dotcom-tg-catalog.vercel.app`)
3. **DATABASE_URL** - строка подключения к PostgreSQL
4. **PORT** - порт (обычно автоматически определяется хостингом)

## Настройка домена в BotFather

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/setdomain`
3. Выберите вашего бота (`tg_catalog_bot`)
4. Введите домен **БЕЗ** `https://` и **БЕЗ** слеша в конце:
   ```
   oiitmict100500-dotcom-tg-catalog.vercel.app
   ```

## Проверка

После настройки:
1. Откройте сайт на Vercel
2. Откройте консоль браузера (F12)
3. Попробуйте авторизоваться через Telegram
4. Проверьте логи в консоли - должны быть запросы к правильному API URL

## Диагностика

Если не работает:
1. Проверьте консоль браузера (F12) - там будут ошибки
2. Проверьте, что backend доступен по указанному URL
3. Проверьте CORS настройки в backend (должен разрешать запросы с Vercel домена)
4. Проверьте переменную окружения `VITE_API_URL` в Vercel
5. Проверьте, что домен настроен в BotFather

