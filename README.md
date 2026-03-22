# VaultNotes — Secure Encrypted Notes

A secure notes app where every note is AES-256 encrypted **client-side** before being stored in MongoDB. The server never sees plaintext.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, crypto-js
- **Backend**: Node.js, Express, MongoDB + Mongoose
- **Auth**: JWT + bcrypt
- **Encryption**: AES-256-CBC (client-side, crypto-js)

## Quick Start

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm run dev

# 2. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173

## No AWS needed — notes are stored encrypted in MongoDB.
