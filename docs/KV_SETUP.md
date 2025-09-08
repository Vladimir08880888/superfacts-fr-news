# Настройка Vercel KV хранилища

## 🎯 Цель

Этот гайд поможет вам настроить Vercel KV (Redis) хранилище для проекта SuperFacts.fr, что позволит заменить временное хранение в памяти на надежное облачное хранилище.

## 📋 Предварительные требования

- Аккаунт в Vercel
- Проект уже развернут в Vercel
- Локальная среда разработки настроена

## 🚀 Шаги настройки

### 1. Создание KV хранилища в Vercel Dashboard

1. **Откройте Vercel Dashboard**
   - Перейдите на [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Войдите в свой аккаунт

2. **Найдите ваш проект**
   - Найдите проект `superfacts-fr-news` в списке проектов
   - Кликните на него

3. **Перейдите в раздел Storage**
   - В навигационном меню проекта найдите вкладку **Storage**
   - Кликните на неё

4. **Создайте новую базу данных**
   - Нажмите кнопку **Create Database** или **Connect Store**
   - Выберите **KV (Key-Value)**

5. **Настройте параметры базы данных**
   - **Database Name**: `news-cache`
   - **Region**: выберите тот же регион, где развернуто ваше приложение (обычно `iad1` для Washington, D.C.)
   - Нажмите **Create**

### 2. Получение переменных окружения

После создания KV хранилища:

1. **Перейдите в настройки базы данных**
   - В разделе Storage найдите созданную базу `news-cache`
   - Кликните на неё

2. **Скопируйте переменные окружения**
   - Найдите раздел **Environment Variables** или **Connection Details**
   - Скопируйте следующие переменные:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_URL` (если доступна)

### 3. Настройка локальной среды

1. **Обновите .env.local файл**
   ```bash
   # Vercel KV Configuration
   KV_REST_API_URL=https://your-kv-database-url.kv.vercel-storage.com
   KV_REST_API_TOKEN=your_kv_rest_api_token_here
   KV_URL=redis://your-kv-url
   ```

2. **Замените значения**
   - Вставьте реальные значения из Vercel Dashboard
   - Убедитесь, что нет пробелов в начале или конце значений

### 4. Настройка переменных в Vercel

1. **Перейдите в настройки проекта**
   - В Vercel Dashboard откройте проект
   - Перейдите в **Settings** → **Environment Variables**

2. **Добавьте переменные**
   - Нажмите **Add Environment Variable**
   - Добавьте по одной каждую переменную:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_URL`
   - Установите среду: **Production**, **Preview**, **Development**

### 5. Тестирование подключения

1. **Запустите тест подключения**
   ```bash
   npm run test-kv
   ```

2. **Ожидаемый результат**
   ```
   🔍 Testing Vercel KV connection...
   ✅ KV environment variables found
   📍 KV URL: https://your-kv-database-url.kv.vercel-storage...
   📝 Testing SET operation...
   ✅ SET operation successful
   📖 Testing GET operation...
   ✅ GET operation successful
   📄 Retrieved value: Test connection at 2024-01-01T12:00:00.000Z
   🗑️  Testing DELETE operation...
   ✅ DELETE operation successful
   🔍 Verifying deletion...
   ✅ Value successfully deleted

   🎉 All KV operations completed successfully!
   ✅ Vercel KV is properly configured and working
   ```

### 6. Запуск приложения с KV

1. **Перезапустите сервер разработки**
   ```bash
   npm run dev
   ```

2. **Проверьте логи**
   - При первом запуске вы должны увидеть сообщение:
   - "✅ Using Vercel KV for data storage"

## 🔧 Troubleshooting

### Ошибка: "KV environment variables not set"
- Проверьте, что переменные добавлены в `.env.local`
- Убедитесь, что нет опечаток в названиях переменных
- Перезапустите сервер разработки

### Ошибка: "Connection failed"
- Проверьте правильность скопированных токенов
- Убедитесь, что KV база данных создана и активна
- Проверьте, что база данных привязана к правильному проекту

### Ошибка: "Insufficient permissions"
- Убедитесь, что используете правильный токен с правами на чтение/запись
- Проверьте, что проект имеет доступ к KV базе данных

## 📊 Проверка работы системы

После настройки KV хранилища система автоматически:

1. **Переключится с памяти на KV** для хранения статей
2. **Будет кешировать переводы** в KV с TTL 24 часа
3. **Хранить метаданные** о последнем обновлении новостей
4. **Обеспечит персистентность данных** между перезапусками

## 🎉 Готово!

После успешной настройки:
- ✅ Данные будут сохраняться между деплоями
- ✅ Переводы будут кешироваться эффективно
- ✅ Производительность приложения улучшится
- ✅ Масштабируемость системы повысится

Теперь ваше приложение SuperFacts.fr использует надежное облачное хранилище Vercel KV!
