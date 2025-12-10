# TLG Backend

## Требования
- **Node.js** версии 18 или выше
- **npm** или **yarn** (менеджер пакетов)
- **PostgreSQL** версии 12 или выше
- **Git**

## Установка

```bash
git clone https://github.com/guedda/tlg-backend.git
cd tlg-backend
```

```bash
npm install
```

или

```bash
yarn install
```

Создайте файл `.env` в корне проекта на основе `.env.sample`:

```bash
cp .env.sample .env
```

Откройте файл `.env` и заполните следующие переменные:
- `DATABASE_URL` - строка подключения к PostgreSQL.
- `JWT_SECRET` - случайный ключ для JWT (рекомендуется минимум 32 символа) для безопасности.
- `FRONTEND_URL` - URL вашего фронтенд приложения для настройки CORS.
- `NODE_ENV` - `development` | `production`.

Создайте базу данных

Сгенерируйте Prisma Client
```bash
npm run prisma:generate
```
или
```bash
npx prisma generate
```

Примените миграции
```bash
npm run prisma:migrate
```
или
```bash
npx prisma migrate dev
```

## Запуск приложения

### Режим разработки

Для запуска в режиме разработки с автоматической перезагрузкой при изменении файлов:

```bash
npm run start:dev
```

Приложение будет доступно по адресу: `http://localhost:3000`

### Режим продакшена

1. Сначала соберите проект:

```bash
npm run build
```

2. Затем запустите:

```bash
npm run start:prod
```

или

```bash
npm start
```
