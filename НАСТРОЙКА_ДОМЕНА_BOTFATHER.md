# Настройка домена в BotFather для Telegram Login

## Ваш домен Vercel:
```
oiitmict100500-dotcom-tg-catalog.vercel.app
```

## Инструкция по настройке:

1. Откройте Telegram и найдите бота **@BotFather**

2. Отправьте команду:
   ```
   /setdomain
   ```

3. Выберите вашего бота:
   ```
   tg_catalog_bot
   ```

4. Введите домен **БЕЗ** `https://` и **БЕЗ** слеша в конце:
   ```
   oiitmict100500-dotcom-tg-catalog.vercel.app
   ```

5. BotFather должен ответить:
   ```
   Success! Domain updated.
   ```

## Важно:
- ❌ НЕ используйте: `https://oiitmict100500-dotcom-tg-catalog.vercel.app`
- ❌ НЕ используйте: `oiitmict100500-dotcom-tg-catalog.vercel.app/`
- ✅ Используйте: `oiitmict100500-dotcom-tg-catalog.vercel.app`

## Проверка:
После настройки:
1. Откройте сайт: https://oiitmict100500-dotcom-tg-catalog.vercel.app
2. Откройте консоль браузера (F12)
3. Проверьте логи - должно быть: `✅ Widget iframe found in container`
4. Попробуйте войти через кнопку Telegram

## Если не работает:
- Убедитесь, что домен указан точно как показано выше
- Подождите 1-2 минуты после настройки (Telegram может кэшировать)
- Очистите кэш браузера (Ctrl+Shift+Delete)
- Попробуйте в режиме инкогнито

