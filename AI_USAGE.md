# Prerequisites and application setup
Node version 21 or higher.

### Simple steps
1. Development PostgreSQL instance setup:
Run in terminal:
```bash
docker compose up -d
``` 
it'll fetch postgres image and start the container with volume persistence.

2. DB migration:
```bash

```

2. To run backend and reminder worker in dev mode:
```bash
cd be
npm run dev
npm run dev:worker
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

### Future enhancement:
Will add single command of "docker compose up -d" to run all services.