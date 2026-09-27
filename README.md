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
        ├── controllers/       # request handlers
        ├── middleware/        # auth, validation, error handling
        ├── models/            # Mongoose models
        ├── routes/            # API routes
        ├── services/          # business logic (e.g. listing search)
        ├── seed/              # Pune demo data + seed script
        ├── validators/        # Zod request schemas
        ├── utils/
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
| `JWT_SECRET`  | Secret for signing login tokens (required in production) |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`)              |
| `CLIENT_URL`  | Allowed frontend origin(s), comma-separated   |

**client/.env.local**

| Variable       | Description                                   |
| -------------- | --------------------------------------------- |
| `VITE_API_URL` | Base URL of the API, e.g. `http://localhost:5000/api` |

## API

| Method | Endpoint             | Auth   | Description                          |
| ------ | -------------------- | ------ | ------------------------------------ |
| GET    | `/api/health`        | —      | Service and database status          |
| POST   | `/api/auth/register` | —      | Create an account, returns a JWT     |
| POST   | `/api/auth/login`    | —      | Log in, returns a JWT                |
| GET    | `/api/auth/me`       | Bearer | Current user's profile               |
| GET    | `/api/listings`      | —      | Search published parking spaces      |
| GET    | `/api/listings/:id`  | Optional | Listing details (owners also see their drafts) |
| GET    | `/api/listings/mine` | Bearer | The current user's own listings      |
| POST   | `/api/listings`      | Bearer | Create a listing                     |
| PATCH  | `/api/listings/:id`  | Bearer | Update / publish / unpublish (owner only) |
| DELETE | `/api/listings/:id`  | Bearer | Delete a listing (owner only; blocked if it has upcoming bookings) |
| POST   | `/api/bookings`      | Bearer | Book a space: `{ spaceId, date, time, duration, vehicleNumber }` |
| GET    | `/api/bookings/mine` | Bearer | My bookings as a driver: `?type=upcoming\|past\|cancelled`, with counts |
| GET    | `/api/bookings/:id`  | Bearer | Booking details (driver or space owner only) |
| PATCH  | `/api/bookings/:id/cancel` | Bearer | Cancel before the start time (driver or space owner) |

Authenticated requests send `Authorization: Bearer <token>`.

**Search parameters** (`GET /api/listings`): `location` (a Pune area such as `Baner` searches nearby; anything else matches address text), `lat`/`lng`/`radius` (km), `minPrice`, `maxPrice`, `amenities` (comma-separated, all required), `vehicleSize` (`hatchback`, `sedan`, `suv`), `spaceType`, `is24x7`, `date` + `time` + `duration` (only spaces open for that slot), `sort` (`relevance`, `price_asc`, `price_desc`, `distance`, `newest`), `page`, `limit`.

**Bookings** use Indian Standard Time and start on the hour or half-hour. Each booking records the 30-minute slots it covers, and a unique MongoDB index on `(space, slot)` for confirmed bookings guarantees a space can never be double-booked — even when two people book at the same moment. Online payment is not implemented yet; bookings show the total but no payment is taken.

## Demo data

```bash
cd server
npm run seed
```

Adds 30 fictional parking listings across 10 Pune neighbourhoods (Baner, Hinjawadi, Viman Nagar, Koregaon Park, Kalyani Nagar, Shivajinagar, Wakad, Aundh, Kothrud, Hadapsar), owned by 5 demo hosts. Areas and landmarks are real places, but the spaces, hosts and prices are made up; every demo listing is flagged `isDemo` and labelled as a demo in the app. Re-running the seed replaces only demo data, never real users or listings.

## Testing

Server tests run against a real MongoDB. Locally, an in-memory MongoDB is started automatically (`mongodb-memory-server`), so no database installation is needed. In CI, a MongoDB 7 service container is used instead via `MONGODB_TEST_URI`.

## Continuous integration

Every push and pull request to `main` runs the [CI workflow](.github/workflows/ci.yml), with two parallel jobs:

- **Client:** install → lint → test → production build
- **Server:** install → lint → test (against a MongoDB service container)

A failure in any step fails the pipeline.
