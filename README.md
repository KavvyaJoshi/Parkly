# Parkly

[![CI](https://github.com/KavvyaJoshi/Parkly/actions/workflows/ci.yml/badge.svg)](https://github.com/KavvyaJoshi/Parkly/actions/workflows/ci.yml)

**Hourly parking in private spaces.** Parkly is a parking marketplace where people list their unused 4-wheeler parking spaces for hourly paid parking, and drivers discover and book them. Launching first in Pune.

> Status: early MVP in active development. Listings shown in the app are demo data, not real or verified spaces.

## Tech stack

| Layer    | Tools                                                       |
| -------- | ----------------------------------------------------------- |
| Frontend | React, Vite, Tailwind CSS, React Router, Lucide icons       |
| Backend  | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt            |
| Testing  | Vitest, React Testing Library, Supertest                    |
| CI       | GitHub Actions (lint, test and build on every push and PR)  |

## Project structure

```
Parkly/
├── .github/workflows/ci.yml   # CI pipeline
├── client/                    # React single-page app (Vite)
│   └── src/
└── server/                    # Express REST API
    └── src/
        ├── config/            # env + database connection
        ├── middleware/        # error handling, 404
        ├── routes/            # API routes
        └── tests/
```

## Getting started

**Prerequisites:** Node.js 20+ and npm. MongoDB (local or [Atlas](https://www.mongodb.com/atlas)) is needed from the auth phase onward.

### 1. API server

```bash
cd server
cp .env.example .env    # then edit values
npm install
npm run dev             # http://localhost:5000/api/health
```

### 2. Web client

```bash
cd client
cp .env.example .env.local
npm install
npm run dev             # http://localhost:5173
```

## Scripts

| Command         | client                  | server                     |
| --------------- | ----------------------- | -------------------------- |
| `npm run dev`   | Vite dev server         | API with auto-reload       |
| `npm run build` | Production build        | —                          |
| `npm start`     | —                       | Start API (production)     |
| `npm run lint`  | ESLint                  | ESLint                     |
| `npm test`      | Vitest + Testing Library | Vitest + Supertest        |

## Environment variables

**server/.env**

| Variable      | Description                                   |
| ------------- | --------------------------------------------- |
| `PORT`        | API port (default `5000`)                     |
| `MONGODB_URI` | MongoDB connection string                     |
| `CLIENT_URL`  | Allowed frontend origin(s), comma-separated   |

**client/.env.local**

| Variable       | Description                                   |
| -------------- | --------------------------------------------- |
| `VITE_API_URL` | Base URL of the API, e.g. `http://localhost:5000/api` |

## Continuous integration

Every push and pull request to `main` runs the [CI workflow](.github/workflows/ci.yml), with two parallel jobs:

- **Client:** install → lint → test → production build
- **Server:** install → lint → test

A failure in any step fails the pipeline.
