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

## Шаг 2: Настройка VITE_API_URL в Frontend (Vercel)

### Что такое VITE_API_URL?

`VITE_API_URL` — это адрес вашего **backend сервера** (сервера с API). Frontend (ваш сайт) должен знать, куда отправлять запросы к API.

⚠️ **ВАЖНО:** Это должен быть адрес **BACKEND**, а не frontend!

### Сначала нужно понять: где у вас развернут Backend?

**Backend** — это серверная часть приложения, которая обрабатывает запросы от сайта.

#### Вариант А: Backend уже развернут

Если вы уже развернули backend на каком-то хостинге, найдите его URL:

**На Railway:**
1. Откройте https://railway.app
2. Войдите в свой аккаунт
3. Откройте проект с backend
4. Нажмите на сервис (service)
5. Перейдите в **Settings → Networking**
6. Скопируйте **Public Domain** (например: `tg-catalog-backend.railway.app`)
7. Это и есть ваш backend URL!

**На Render:**
1. Откройте https://render.com
2. Войдите в свой аккаунт
3. Откройте проект с backend
4. Скопируйте URL сервиса (например: `tg-catalog-api.onrender.com`)
5. Это и есть ваш backend URL!

**На Heroku:**
1. Откройте https://heroku.com
2. Войдите в свой аккаунт
3. Откройте приложение с backend
4. Перейдите в **Settings**
5. Скопируйте **Heroku Domain** (например: `tg-catalog-backend.herokuapp.com`)
6. Это и есть ваш backend URL!

**На Vercel (если backend тоже на Vercel):**
1. Откройте https://vercel.com
2. Войдите в свой аккаунт
3. Откройте проект с backend (это должен быть ОТДЕЛЬНЫЙ проект от frontend!)
4. Скопируйте URL проекта (например: `tg-catalog-backend.vercel.app`)
5. Это и есть ваш backend URL!

#### Вариант Б: Backend еще не развернут

Если backend еще не развернут, сначала нужно его развернуть. См. файл `ИСПРАВЛЕНИЕ_ОШИБОК.md` в конце раздела "Если backend еще не развернут".

---

### Теперь настроим VITE_API_URL в Vercel:

1. **Откройте Vercel:**
   - Перейдите на https://vercel.com
   - Войдите в свой аккаунт

2. **Откройте проект frontend:**
   - Найдите проект `tg-catalog` (или как называется ваш frontend проект)
   - Нажмите на него

3. **Откройте настройки:**
   - В верхнем меню нажмите **Settings**
   - В левом меню выберите **Environment Variables**

4. **Найдите или создайте переменную:**
   - Если переменная `VITE_API_URL` уже есть — нажмите на нее для редактирования
   - Если нет — нажмите **Add New**

5. **Установите правильное значение:**
   - **Key (Имя):** `VITE_API_URL`
   - **Value (Значение):** `https://ваш-backend-url.com` 
     - ⚠️ Замените `ваш-backend-url.com` на реальный URL вашего backend!
     - ⚠️ Обязательно добавьте `https://` в начале!
     - ⚠️ БЕЗ слеша `/` в конце!
   - **Environment (Окружение):** Выберите все три:
     - ☑ Production
     - ☑ Preview  
     - ☑ Development

6. **Сохраните:**
   - Нажмите **Save**
   - Vercel автоматически перезапустит deployment

### Примеры правильных значений:

✅ **Правильно:**
```
https://tg-catalog-backend.railway.app
https://tg-catalog-api.onrender.com
https://api.yourdomain.com
https://tg-catalog-backend.vercel.app
```

❌ **Неправильно:**
```
tg-catalog-one.vercel.app          ← это frontend, не backend!
https://tg-catalog-one.vercel.app  ← это frontend, не backend!
https://tg-catalog-backend.railway.app/  ← лишний слеш в конце
```

### Как проверить, что все правильно?

После сохранения:
1. Подождите 1-2 минуты (пока Vercel перезапустит сайт)
2. Откройте сайт: https://tg-catalog-one.vercel.app
3. Откройте консоль браузера (F12)
4. НЕ должно быть ошибки: "VITE_API_URL указывает на frontend домен!"
5. Если ошибка есть — значит вы указали frontend URL вместо backend URL

## Шаг 3: Настройка токена в Backend

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

## Шаг 4: Проверка настройки

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

### Ошибка "VITE_API_URL указывает на frontend домен"

- ⚠️ **Это критическая ошибка!** VITE_API_URL должен указывать на backend, а не на frontend
- Удалите неправильное значение в Vercel Environment Variables
- Установите правильный URL вашего backend сервера
- Перезапустите deployment после изменения

### Ошибка "Telegram bot token не настроен"

- Проверьте, что переменная `TELEGRAM_BOT_TOKEN` установлена в backend
- Убедитесь, что токен правильный (скопирован полностью)
- Перезапустите backend после добавления переменной
- Проверьте, что backend развернут и доступен по URL, указанному в VITE_API_URL

### Ошибка авторизации (401)

- Проверьте, что токен бота правильный
- Убедитесь, что токен установлен в переменных окружения backend
- Проверьте логи backend для деталей ошибки

## Безопасность

⚠️ **Важно:** Никогда не коммитьте токен бота в Git!

- Токен должен быть только в переменных окружения
- Файл `.env` должен быть в `.gitignore`
- Не публикуйте токен в открытом доступе

