# Prerequisites and application setup
Node version 21 or higher.

### Simple steps to run in dev mode:
1. Development PostgreSQL instance setup:
Run in terminal:

```bash
docker compose up -d
``` 
it'll fetch postgres image and start the container with volume persistence.

2. Run DB migration, Server start, Reminder worker with one command:

```bash
cd be
npm run dev:all
```

3. To run frontend in dev mode:

```bash
cd fe
npm run dev
```

### PORTS:
backend will start on port 5000
```url
http://localhost:5000
```

frontend will start on port 5173
```url
http://localhost:5173
```

## To run tests:
```bash
cd bd
npm run test
```

### Future enhancement:
Will add single command of "docker compose up -d" to run all services.

## Short architecture overview:
<img width="1672" height="487" alt="image" src="https://github.com/user-attachments/assets/43288142-993c-4696-9f00-75936e071b40" />

The application follows a simple three-layer architecture using Node.js, Express, TypeScript, Prisma, and PostgreSQL.

1. Frontend: Members and professionals interact with the application to register, log in, view availability, book sessions, cancel or reschedule sessions, and view notifications.
2. Backend API: Express handles authentication, authorization, business logic, availability calculations, and session management.
3. Database: PostgreSQL stores users, professional working hours, sessions, reminders, and notifications.
4. Reminder Worker: A separate background process periodically checks PostgreSQL for due reminders and creates in-app notifications.

The API server and reminder worker operate independently but share the same PostgreSQL database.
