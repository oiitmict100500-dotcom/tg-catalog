# Как найти или создать backend на Vercel

## Вариант 1: Если backend УЖЕ развернут на Vercel

### Шаг 1: Откройте Vercel
1. Откройте https://vercel.com
2. Войдите в свой аккаунт
3. Вы увидите список всех ваших проектов

### Шаг 2: Найдите проект backend
1. Посмотрите на список проектов
2. Найдите проект, который называется примерно так:
   - `tg-catalog-backend`
   - `backend`
   - `api`
   - или похожее название
3. ⚠️ **Важно:** Это должен быть ОТДЕЛЬНЫЙ проект от frontend!

### Шаг 3: Скопируйте URL
1. Нажмите на проект backend
2. В верхней части страницы вы увидите URL проекта
3. Он будет выглядеть примерно так: `https://tg-catalog-backend.vercel.app`
4. Скопируйте этот URL

### Шаг 4: Используйте этот URL
1. Откройте проект **frontend** (не backend!)
2. Перейдите в **Settings → Environment Variables**
3. Найдите `VITE_API_URL`
4. Вставьте скопированный URL backend
5. Сохраните

---

## Вариант 2: Если backend НЕТ на Vercel

Если в списке проектов нет отдельного backend проекта, значит его нужно развернуть.

### Вариант 2А: Развернуть backend на Vercel

#### Шаг 1: Подготовьте backend
1. Убедитесь, что у вас есть папка `backend` в проекте
2. Убедитесь, что в ней есть файлы: `package.json`, `src/`, и т.д.

#### Шаг 2: Создайте новый проект на Vercel
1. Откройте https://vercel.com
2. Нажмите **Add New...** → **Project**
3. Импортируйте ваш репозиторий (если еще не импортирован)
4. Выберите репозиторий с вашим проектом

#### Шаг 3: Настройте проект для backend
1. В настройках проекта найдите **Root Directory**
2. Установите: `backend` (чтобы Vercel знал, что это backend, а не frontend)
3. Или создайте отдельный репозиторий только с backend кодом

#### Шаг 4: Разверните
1. Нажмите **Deploy**
2. Подождите 2-3 минуты
3. Vercel развернет backend
4. Скопируйте URL проекта (например: `https://tg-catalog-backend.vercel.app`)

#### Шаг 5: Настройте переменные окружения
1. В проекте backend перейдите в **Settings → Environment Variables**
2. Добавьте:
   - **Name:** `TELEGRAM_BOT_TOKEN`
   - **Value:** `8527710832:AAHZdTNESfu2ZAMSTD0YEb9BhTTfQb0mCfM`
   - Выберите все окружения
3. Сохраните

#### Шаг 6: Используйте URL в frontend
1. Откройте проект **frontend**
2. Перейдите в **Settings → Environment Variables**
3. Найдите `VITE_API_URL`
4. Вставьте URL backend проекта
5. Сохраните

---

### Вариант 2Б: Развернуть backend на Railway (проще!)

Если развертывание на Vercel кажется сложным, используйте Railway - это проще:

#### Шаг 1: Зарегистрируйтесь
1. Откройте https://railway.app
2. Нажмите **Login with GitHub**
3. Авторизуйтесь через GitHub

#### Шаг 2: Создайте проект
1. Нажмите **New Project**
2. Выберите **Deploy from GitHub repo**
3. Выберите ваш репозиторий
4. Railway спросит, какой сервис развернуть
5. Выберите папку `backend`

#### Шаг 3: Настройте переменные
1. Откройте проект на Railway
2. Нажмите на сервис backend
3. Перейдите в **Variables**
4. Нажмите **+ New Variable**
5. Добавьте:
   - **Key:** `TELEGRAM_BOT_TOKEN`
   - **Value:** `8527710832:AAHZdTNESfu2ZAMSTD0YEb9BhTTfQb0mCfM`
6. Сохраните

#### Шаг 4: Получите URL
1. В проекте Railway перейдите в **Settings → Networking**
2. Нажмите **Generate Domain**
3. Скопируйте **Public Domain** (например: `tg-catalog-backend.railway.app`)

#### Шаг 5: Используйте URL в Vercel
1. Откройте Vercel
2. Откройте проект **frontend**
3. Перейдите в **Settings → Environment Variables**
4. Найдите `VITE_API_URL`
5. Вставьте URL с Railway: `https://tg-catalog-backend.railway.app`
6. Сохраните

---

## Как проверить, что все правильно?

1. Откройте сайт: https://tg-catalog-one.vercel.app
2. Откройте консоль (F12)
3. **НЕ должно быть** ошибки: "VITE_API_URL указывает на frontend домен!"
4. Если ошибки нет - значит все правильно настроено!

---

## Важно помнить

- **Frontend** = ваш сайт (`tg-catalog-one.vercel.app`)
- **Backend** = должен быть на ДРУГОМ URL (другой проект Vercel, или Railway, или Render)
- `VITE_API_URL` = должен указывать на **BACKEND**, а не на frontend!

---

## Если ничего не помогает

Если у вас нет backend кода или не получается развернуть:

1. Проверьте, есть ли у вас папка `backend` в проекте
2. Если нет - возможно, backend нужно создать отдельно
3. Или используйте готовый backend API от другого сервиса


