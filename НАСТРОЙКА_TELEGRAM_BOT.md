# Настройка Telegram авторизации

## Данные для настройки

- **Имя бота:** `tg_cataIog_bot` (без символа @)
- **Домен сайта:** `tg-catalog-one.vercel.app`
- **Токен бота:** `8527710832:AAHZdTNESfu2ZAMSTD0YEb9BhTTfQb0mCfM`

## Шаг 1: Настройка домена в BotFather

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/setdomain`
3. Выберите вашего бота `tg_cataIog_bot`
4. Введите домен: `tg-catalog-one.vercel.app`
   - ⚠️ **Важно:** Вводите домен БЕЗ `https://` и БЕЗ слеша в конце!
   - ✅ Правильно: `tg-catalog-one.vercel.app`
   - ❌ Неправильно: `https://tg-catalog-one.vercel.app` или `tg-catalog-one.vercel.app/`

5. BotFather подтвердит настройку

## Шаг 2: Настройка токена в Backend

### Для локальной разработки:

Создайте файл `backend/.env` и добавьте:

```env
TELEGRAM_BOT_TOKEN=8527710832:AAHZdTNESfu2ZAMSTD0YEb9BhTTfQb0mCfM
```

### Для production (Railway/Render/Heroku):

Добавьте переменную окружения:

- **Имя:** `TELEGRAM_BOT_TOKEN`
- **Значение:** `8527710832:AAHZdTNESfu2ZAMSTD0YEb9BhTTfQb0mCfM`

### Для Vercel (если backend на Vercel):

1. Откройте проект в Vercel
2. Перейдите в **Settings → Environment Variables**
3. Добавьте переменную:
   - **Name:** `TELEGRAM_BOT_TOKEN`
   - **Value:** `8527710832:AAHZdTNESfu2ZAMSTD0YEb9BhTTfQb0mCfM`
   - **Environment:** Production, Preview, Development (выберите все)
4. Сохраните и перезапустите deployment

## Шаг 3: Проверка настройки

1. Откройте сайт: https://tg-catalog-one.vercel.app
2. Нажмите на кнопку "Войти через Telegram"
3. Должен появиться виджет Telegram с вашим ботом
4. После авторизации вы должны быть перенаправлены на главную страницу

## Устранение проблем

### Виджет не появляется

- Проверьте, что домен правильно настроен в BotFather
- Убедитесь, что домен введен БЕЗ `https://` и слеша
- Проверьте консоль браузера (F12) на наличие ошибок

### Ошибка "Bot domain invalid"

- Убедитесь, что домен в BotFather точно совпадает с доменом сайта
- Проверьте, что домен не содержит `https://` или слеш в конце
- Перезапустите сайт после настройки домена

### Ошибка "Telegram bot token не настроен"

- Проверьте, что переменная `TELEGRAM_BOT_TOKEN` установлена в backend
- Убедитесь, что токен правильный (скопирован полностью)
- Перезапустите backend после добавления переменной

### Ошибка авторизации (401)

- Проверьте, что токен бота правильный
- Убедитесь, что токен установлен в переменных окружения backend
- Проверьте логи backend для деталей ошибки

## Безопасность

⚠️ **Важно:** Никогда не коммитьте токен бота в Git!

- Токен должен быть только в переменных окружения
- Файл `.env` должен быть в `.gitignore`
- Не публикуйте токен в открытом доступе

