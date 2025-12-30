# Настройка Backend для работы с Vercel

## Проблема
Backend блокирует запросы с Vercel из-за CORS политики.

## Решение

### 1. Обновите переменную окружения FRONTEND_URL на backend

Добавьте в `.env` файл backend или в переменные окружения хостинга:

```env
FRONTEND_URL=https://oiitmict100500-dotcom-tg-catalog.vercel.app
```

Или для поддержки всех Vercel доменов (включая preview):
```env
FRONTEND_URL=https://oiitmict100500-dotcom-tg-catalog.vercel.app
```

### 2. Обновите код backend

Код уже обновлен в `backend/src/main.ts` для поддержки:
- Основного домена Vercel
- Всех preview доменов (*.vercel.app)
- Локального development

### 3. Перезапустите backend

После обновления кода и переменных окружения перезапустите backend.

## Проверка

После настройки:
1. Откройте сайт на Vercel
2. Откройте консоль браузера (F12)
3. Проверьте, что запросы к API проходят успешно
4. Не должно быть ошибок CORS

## Если используете Heroku/Railway/Render:

1. Добавьте переменную окружения `FRONTEND_URL` с вашим Vercel доменом
2. Перезапустите приложение
3. Проверьте логи - не должно быть ошибок CORS


