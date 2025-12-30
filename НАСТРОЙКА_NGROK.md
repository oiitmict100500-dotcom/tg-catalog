# Быстрая настройка ngrok для Telegram Login Widget

## Шаг 1: Регистрация в ngrok

1. Перейдите на https://dashboard.ngrok.com/signup
2. Зарегистрируйтесь (можно через Google/GitHub для быстроты)
3. Войдите в аккаунт

## Шаг 2: Получить authtoken

1. Перейдите на https://dashboard.ngrok.com/get-started/your-authtoken
2. Скопируйте ваш authtoken (длинная строка типа `2abc123def456ghi789jkl012mno345pq_6rStUvWxYzAbCdEfGhIjKl`)

## Шаг 3: Установить токен в ngrok

Откройте командную строку и выполните:
```
ngrok config add-authtoken ВАШ_TOKEN_ЗДЕСЬ
```

Замените `ВАШ_TOKEN_ЗДЕСЬ` на токен, который скопировали.

## Шаг 4: Запустить ngrok

Убедитесь, что фронтенд работает на порту 3001, затем выполните:
```
ngrok http 3001
```

## Шаг 5: Скопировать домен

В выводе ngrok вы увидите что-то вроде:
```
Forwarding   https://abc123-def456.ngrok-free.app -> http://localhost:3001
```

Скопируйте домен: `abc123-def456.ngrok-free.app` (без `https://`)

## Шаг 6: Настроить в BotFather

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/setdomain`
3. Выберите вашего бота (`tgcatalog_bot`)
4. Вставьте домен от ngrok: `abc123-def456.ngrok-free.app`

Готово! Telegram Login Widget должен работать.

