# LabMate

> **An AI-powered smart laboratory assistant** — combining chemical intelligence, computer vision, academic research, and emergency alerting in one unified platform.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Demo-labmate--2ljo.onrender.com-green)](https://labmate-2ljo.onrender.com)

---

## Overview

LabMate is a full-stack web application built for chemistry researchers, students, and lab personnel. It wraps **Google Gemini 2.5 Flash** AI across multiple lab-focused tools — all behind a secure, authenticated interface with persistent search history.

It reduces the cost and time of:
- Predicting chemical reactions and processes
- Looking up equipment safety information
- Searching academic literature
- Estimating physical/thermodynamic properties of compounds
- Drawing process flow diagrams
- Responding to lab emergencies

---

## Features

### Process Predictor
Type any chemical process, reaction, or lab procedure query and get a structured AI response — a direct one-line answer followed by a detailed breakdown covering mechanisms, conditions, safety, and insights.

### Research Scraper
Search academic papers across **Semantic Scholar** and **OpenAlex** simultaneously (no API key required). Results are deduplicated, ranked by abstract availability, and cached for 10 minutes. Papers with no abstract get an AI-generated summary via Gemini.

### Equipment Analyzer
Upload a photo of any laboratory equipment. Gemini identifies it and returns either:
- **General mode** — name + description of function and important details
- **Safety mode** — bullet-pointed safety guidelines and operational precautions

### Chemical Safety Analyzer
Upload a chemical label photo. Gemini acts as a safety expert and returns a structured 4-section analysis:
- **Hazards** · **Safety Handling** · **First Aid Measures** · **Precautions**

Each section includes 5–7 specific, accurate points in plain language.

### Physical Property Estimator
Enter a compound name or SMILES notation. LabMate uses **Group Contribution Methods (GCM)** — Gemini returns molecular group data, and client-side logic applies hardcoded thermodynamic formulas to calculate:

| Property | Symbol |
|---|---|
| Normal Boiling Point | Tb |
| Melting Point | Tm |
| Critical Temperature | Tc |
| Critical Pressure | Pc |
| Critical Volume | Vc |
| Heat of Formation | DHf |
| Gibbs Energy of Formation | DGf |
| Density | rho |

Results are rendered with **KaTeX** in a clean "Given → Formula → Substituted → Answer" format.

### Block Diagram Generator
Describe any chemical or industrial process in plain English. Gemini generates a valid **Mermaid.js flowchart** that renders live in the browser — with left-to-right layout, proper shape conventions, and zoomable output.

### Emergency Alert
A persistent red button in the navigation bar. On click, sends an **instant Telegram notification** to a configured lab contact, including message type, severity, and timestamp. Active alerts are tracked and can be resolved.

### Recent Searches
Every analysis and query is automatically saved per user (with optional compressed image). Browse, review, or delete your full history of:
- Process predictions
- Equipment identifications
- Chemical safety analyses
- Research paper analyses
- Block diagram generations

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 5 |
| **Routing** | Wouter 3 |
| **State / Data** | TanStack React Query v5 |
| **UI Library** | shadcn/ui (Radix UI primitives) |
| **Styling** | Tailwind CSS v3 |
| **Animations** | Framer Motion v11 |
| **Math Rendering** | KaTeX |
| **Diagram Rendering** | Mermaid.js v11 |
| **OCR** | Tesseract.js v6 (client-side) |
| **Backend** | Node.js, Express 4, TypeScript (ESM) |
| **ORM** | Drizzle ORM |
| **Database** | Neon (serverless PostgreSQL) |
| **Authentication** | Passport.js (Local Strategy) + express-session |
| **AI Model** | Google Gemini 2.5 Flash |
| **Notifications** | Telegram Bot API |
| **Build (client)** | Vite |
| **Build (server)** | esbuild |

---

## Project Structure

```
LabMate/
├── client/                     # React SPA
│   └── src/
│       ├── App.tsx             # Root router + providers
│       ├── pages/              # Route-level page components
│       │   ├── home.tsx
│       │   ├── intro.tsx
│       │   ├── process-predictor.tsx
│       │   ├── research-scraper.tsx
│       │   ├── equipment-analyzer.tsx
│       │   ├── chemical.tsx
│       │   ├── property-estimation.tsx
│       │   ├── process-flow.tsx        # Block Diagram Generator
│       │   ├── recent-searches.tsx
│       │   └── credits.tsx
│       ├── components/
│       │   ├── layout/
│       │   │   └── navbar.tsx          # Sticky responsive navbar
│       │   ├── alert-button.tsx        # Emergency alert trigger
│       │   └── ui/                     # shadcn/ui components
│       ├── hooks/
│       │   ├── use-auth.tsx            # Auth context + mutations
│       │   └── use-toast.ts
│       └── lib/
│           ├── gemini.ts               # Client Gemini helpers
│           ├── queryClient.ts          # TanStack Query config
│           ├── protected-route.tsx     # Auth guard HOC
│           └── websocket.tsx           # WebSocket context
├── server/
│   ├── index.ts                # Express entry point
│   ├── auth.ts                 # Passport setup + auth routes
│   ├── routes.ts               # Core API route handlers
│   ├── storage.ts              # DatabaseStorage (data access layer)
│   ├── db.ts                   # Drizzle + Neon connection
│   ├── telegram.ts             # Telegram alert sender
│   ├── api/
│   │   ├── papers.ts           # Research paper search (multi-source)
│   │   └── estimate-properties.ts   # SMILES-based GCM endpoint
│   └── lib/
│       └── gemini-keys.ts      # Multi-key Gemini pool with auto-rotation
├── shared/
│   └── schema.ts               # Drizzle tables + Zod schemas + TS types
├── drizzle.config.ts
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- A **Neon PostgreSQL** database (or any PostgreSQL database)
- At least one **Google Gemini API key** (free tier available at [aistudio.google.com](https://aistudio.google.com))
- *(Optional)* A Telegram bot token + chat ID for emergency alerts

---

### 1. Clone the repository

```bash
git clone https://github.com/uday-chavan/LabMate.git
cd LabMate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@host/labmate

# Gemini API Keys (add as many as you have)
# LabMate rotates through these automatically on rate-limit errors.
GEMINI_API_KEY_1=AIza...
GEMINI_API_KEY_2=AIza...
GEMINI_API_KEY_3=AIza...
# Up to GEMINI_API_KEY_50 supported

# Telegram Emergency Alerts (optional)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=-100123456789
```

> **Tip:** Get a free Gemini API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey). Multiple keys provide redundancy — LabMate automatically rotates to the next key if one hits its rate limit.

### 4. Push the database schema

```bash
npm run db:push
```

### 5. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Express + Vite HMR) |
| `npm run build` | Build client (Vite) + bundle server (esbuild) |
| `npm run start` | Start production server from `dist/` |
| `npm run check` | TypeScript type check |
| `npm run db:push` | Push Drizzle schema to database |

---

## Database Schema

LabMate uses **6 tables** in PostgreSQL:

| Table | Purpose |
|---|---|
| `users` | User accounts (username, password, display name, avatar) |
| `recent_searches` | Per-user history of all AI queries and results |
| `emergency_alerts` | Log of dispatched emergency alerts with resolved status |
| `equipment_records` | Cached equipment analysis results |
| `chemical_records` | Cached chemical safety analysis results |
| `papers` | Cached research paper records |

---

## Gemini API Key Rotation

LabMate includes a production-grade key management system (`server/lib/gemini-keys.ts`):

- Supports up to **50 API keys** (`GEMINI_API_KEY_1` ... `GEMINI_API_KEY_50`)
- **Automatic rotation** — tries each key in order on every request
- **HTTP 429 (rate limit)** — key placed in **60-second cooldown** immediately
- **3 consecutive failures** (auth/server errors) — key placed in **60-second cooldown**
- **All keys cooling down** — waits for the soonest recovery, then retries automatically
- **Non-key errors** (e.g., bad request) — thrown immediately without rotation

This makes LabMate resilient to individual API key exhaustion in production environments.

---

## Authentication

LabMate uses **Passport.js** with a username/password local strategy:

- Sessions are stored in-memory (reset on server restart) via `memorystore`
- Session cookies are valid for **24 hours**
- All feature routes are protected — unauthenticated users are redirected to the login page
- User profile (display name + avatar) is editable via the navbar dropdown
- Avatar uploads support in-browser circular cropping before saving

> **Note:** Passwords are currently stored as plaintext. This is not suitable for a public-facing production deployment. Integrate `bcrypt` before exposing to untrusted users.

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Register a new user |
| `POST` | `/api/login` | Log in |
| `POST` | `/api/logout` | Log out |
| `GET` | `/api/user` | Get current user |
| `PATCH` | `/api/user/profile` | Update display name / avatar |

### AI Features
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze-image` | Analyze chemical label or equipment photo |
| `POST` | `/api/predict-process` | Predict/explain a chemical process |
| `POST` | `/api/generate-diagram` | Generate a Mermaid.js block diagram |
| `POST` | `/api/analyze-paper` | Analyze research paper text |
| `POST` | `/api/estimate-properties` | Estimate properties from SMILES notation |

### Research Papers
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/papers?q=<query>` | Search papers (Semantic Scholar + OpenAlex) |
| `GET` | `/api/papers/summarize?title=` | AI-generated summary for a paper |

### History & Alerts
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/recent-searches` | Get user's search history |
| `POST` | `/api/recent-searches` | Save a new search record |
| `DELETE` | `/api/recent-searches/:id` | Delete a search record |
| `POST` | `/api/alert` | Send emergency Telegram alert |
| `GET` | `/api/alerts` | Get all active (unresolved) alerts |
| `POST` | `/api/alerts/:id/resolve` | Mark an alert as resolved |

---

## Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## Author

**Uday Chavan**
- GitHub: [@uday-chavan](https://github.com/uday-chavan)

---

## License

This project is open source and available under the [MIT License](LICENSE).
