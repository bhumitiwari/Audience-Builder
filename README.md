# Audience Builder

A full-stack application that evaluates audience behavioral rules against synthetic customer event data and lets operators preview matched audiences in real time.

---

## Prerequisites

- **Node.js**: `v22.0.0` or higher (verified on `v24.18.0`)
  - *Zero native dependencies*: Uses Node's built-in `node:sqlite` (`DatabaseSync`), requiring no external C++ compilers or Python installations.
- **npm**: `v10.0.0` or higher

---

## Getting Started (Run Locally)

Clone the repository to your local machine:

```bash
git clone https://github.com/bhumitiwari/Audience-Builder.git
cd Audience-Builder
```

Both the backend and frontend are independently runnable. Open two terminal windows:

### Terminal 1: Backend Service

```bash
cd backend
npm install
npm run dev
```

- The backend service starts on **`http://localhost:3001`**.
- It automatically seeds the local SQLite database (`mable.db`) on initial startup with positive matches, non-matches, and boundary test cases.
- **Health Check**: `GET http://localhost:3001/health`
- **Audience Preview API**: `POST http://localhost:3001/v1/audiences/preview`

### Terminal 2: Frontend Application

```bash
cd frontend
npm install
npm run dev
```

- The frontend application starts on **`http://localhost:5173`**.
- Open **`http://localhost:5173`** in your browser to access the operator console.

---

## How to Preview an Audience

1. Navigate to **`http://localhost:5173`**.
2. The form loads pre-filled with the assignment's canonical product scenario:
   - **Audience Name**: `Viewed but not purchased`
   - **Evaluation Timestamp (`asOf`)**: `2026-09-29T00:00:00.000Z`
   - **Condition 1**: `product_view` ≥ `2` within `7` days
   - **Condition 2**: `purchase` == `0` within `7` days
3. Click **"Preview Audience"** (or press `Ctrl+Enter` / `Cmd+Enter`).
4. The frontend sends the rule definition to the backend, which evaluates membership against the SQLite event logs.
5. Inspect the results panel:
   - **Total matched users**: (e.g. `5 users matched`).
   - **Matched members table**: Displays each anonymous ID (e.g. `anon_101`, `anon_102`) along with condition-by-condition observed behavior evidence.
6. Try modifying rules:
   - Click **"+ Add Condition"** to add more criteria (e.g., `add_to_cart` ≥ `1`).
   - Click **"Remove"** to delete conditions.
   - Click **"Now"** to test against the current real-world timestamp, or **"Seed Date"** to return to the reproducible assignment dataset snapshot.
   - Change the **Backend Base URL** directly in the top header if running the backend on a different port.

---

## Running Automated Tests

Both applications include automated test suites:

### Run Backend Tests
Tests the evaluation engine, date boundary logic (`asOf`), operators (`at_least`, `exactly`), and HTTP validation errors:
```bash
cd backend
npm test
```

### Run Frontend Tests
Tests API client communication, URL normalization, and network error handling:
```bash
cd frontend
npm test
```

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── server.ts       # Express app, input validation, and endpoints (GET /health, POST /v1/audiences/preview)
│   │   ├── evaluator.ts    # Rule evaluation logic, SQL queries, and domain types
│   │   ├── db.ts           # SQLite connection (built-in node:sqlite), schema, and synthetic seed data
│   │   └── server.test.ts  # Integration & evaluator tests
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx        # Title & configurable backend API base URL
│   │   │   ├── AudienceForm.tsx  # Accessible rule builder form with semantic controls
│   │   │   ├── ResultsView.tsx   # Audience size and matched members evidence table
│   │   │   └── ErrorBanner.tsx   # Error alert with visible retry button
│   │   ├── api.ts                # API client and request layer
│   │   ├── useAudiencePreview.ts # Server data lifecycle hook
│   │   ├── App.tsx               # Main layout composing form and results
│   │   └── main.tsx              # React entry point
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   ├── DESIGN.md           # Architecture, data model, rule evaluation, and scaling trade-offs (< 750 words)
│   └── AI_USAGE.md         # Disclosure of AI tool usage and human engineering ownership
│
├── .gitignore
└── README.md
```

---

## Documentation

- **[`docs/DESIGN.md`](./docs/DESIGN.md)**: Explains the data model, rule evaluation strategy, `asOf` snapshot semantics, and production scaling trade-offs (< 750 words).
- **[`docs/AI_USAGE.md`](./docs/AI_USAGE.md)**: Details developer workflow and transparent AI usage disclosure.
