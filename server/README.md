# PixelHQ Server

Express + SQLite backend for PixelHQ.

## Setup

```bash
npm install
```

**Windows note:** `better-sqlite3` requires native compilation. If installation fails, ensure you have:
- Visual Studio 2022 with **Desktop development with C++** workload
- **Windows 10/11 SDK** (install via Visual Studio Installer)

## Development

```bash
npm run dev
```

Server runs at http://localhost:3001

## Scripts

- `npm run dev` - Start with nodemon (auto-reload)
- `npm run build` - Compile TypeScript to `dist/`
- `npm run start` - Run compiled `dist/index.js`

## Environment

Copy `.env.example` to `.env` and configure:

- `PORT` - Server port (default 3001)
- `DATABASE_PATH` - SQLite DB path (default `./data/pixelhq.db`)
- `JWT_SECRET` - Secret for JWT signing
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth (when implemented)
