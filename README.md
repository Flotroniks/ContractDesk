# ContractDesk

<div align="center">

![ContractDesk Logo](./contractdesk-icon.png)

**A powerful desktop application for real-estate property management**

[![CI & Build](https://github.com/Flotroniks/ContractDesk/actions/workflows/webpack.yml/badge.svg)](https://github.com/Flotroniks/ContractDesk/actions/workflows/webpack.yml)
[![Version](https://img.shields.io/github/v/release/Flotroniks/ContractDesk)](https://github.com/Flotroniks/ContractDesk/releases)

</div>

---

## 📋 Table of Contents

- [Why ContractDesk?](#-why-contractdesk)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Development](#-development)
- [Building & Packaging](#-building--packaging)
- [Creating a Release](#-creating-a-release)
- [Security](#-security)
- [IPC Communication](#-ipc-communication)
- [Database Schema](#-database-schema)
- [CSV/Excel Import](#-csvexcel-import)
- [Testing](#-testing)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Why ContractDesk?

Managing multiple real-estate properties can be overwhelming. **ContractDesk** is a **100% local, privacy-first desktop application** that helps landlords and property managers:

- **Track finances**: revenues, expenses, cashflow, and credits across all properties
- **Analyze performance**: occupation rates, ROI, monthly/yearly summaries with interactive charts
- **Manage leases**: tenant information, due dates, payment tracking
- **Stay organized**: all data stored locally in SQLite—no cloud, no subscriptions, full data ownership
- **Make informed decisions**: credit simulations, expense distribution, multi-year statistics

Built with modern web technologies (Electron, React, TypeScript) and following security best practices, ContractDesk provides a robust, professional-grade solution for property portfolio management.

---

## ✨ Features

### 🏠 **Property Management**
- Create and manage unlimited properties
- Store property details: address, type, surface area, purchase price
- Hierarchical location data: Country → Region → Department → City (via external API)
- Track property status (active, sold, under renovation, etc.)

### 💰 **Financial Tracking**
- Record revenues and expenses per property
- Support for multiple expense categories (maintenance, taxes, insurance, utilities, etc.)
- Credit/loan management with detailed amortization tracking
- Import financial data from CSV/Excel files (supports +/− signs)
- Export property financial reports to Excel

### 📊 **Dashboard & Analytics**
- **KPI Cards**: Total revenues, expenses, cashflow, annual credit charges, occupation rate
- **Interactive D3.js Charts**:
  - Portfolio trend chart (monthly income/expenses/cashflow over time)
  - Expense distribution donut chart by category
- **Property Rankings**: Best and worst performers by cashflow
- **Alert System**: Notifications for negative cashflow or high vacancy rates
- Multi-property and multi-year filtering

### 🧮 **Credit Simulation**
- Calculate monthly payments based on principal, interest rate, and duration
- Include insurance in monthly charges
- View total cost and amortization schedules
- Track multiple credits per property
- Automatic detection of finished credits

### 🌍 **Multi-Language Support**
- Full internationalization (i18n) with French and English translations
- French locale formatting: `1 234,56 €`, `85 %`
- Easily extensible to other languages

### 🔐 **Security & Privacy**
- All data stored **100% locally** in SQLite database
- No cloud synchronization, no external data transmission
- Strong Electron security:
  - `contextIsolation: true`
  - `sandbox: false` (for SQLite native module access)
  - `nodeIntegration: false`
  - Secure IPC communication via preload script

### 🧪 **Testing & Quality**
- Comprehensive test suite with Jest + React Testing Library
- Unit, integration, and UI tests
- Mock database for isolated testing
- ESLint + TypeScript strict mode
- JSDoc documentation strategy

---

## 📸 Screenshots

> **Note**: Add screenshots to the `docs/` folder and update the paths below.

### Dashboard Overview
![Dashboard screenshot](docs/dashboard.png)

### Property Management
![Properties screenshot](docs/properties.png)

### Financial Analysis
![Finances screenshot](docs/finances.png)

### Credit Simulation
![Credit simulation screenshot](docs/credit-simulation.png)

---

## 🏗️ Architecture

ContractDesk follows the standard Electron multi-process architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        Main Process                         │
│                  (src/electron/main.ts)                     │
│                                                             │
│  - Creates BrowserWindow                                    │
│  - Manages application lifecycle                           │
│  - Handles IPC requests                                     │
│  - SQLite database access (better-sqlite3)                  │
│                                                             │
│                           ↕                                 │
│                    IPC Channels                             │
│                  (types.d.ts API)                           │
│                           ↕                                 │
│                                                             │
│                    Preload Script                           │
│              (src/electron/preload.cts)                     │
│                                                             │
│  - Exposes safe window.electron API                         │
│  - contextIsolation bridge                                  │
│  - Type-safe IPC channel mapping                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process                         │
│                   (src/ui/App.tsx)                          │
│                                                             │
│  - React + TypeScript UI                                    │
│  - Vite build system                                        │
│  - Tailwind CSS + ShadCN components                         │
│  - D3.js charts                                             │
│  - i18next internationalization                             │
│                                                             │
│  Modules:                                                   │
│  ├── Dashboard: KPIs + Charts                               │
│  ├── Properties: CRUD + Location selector                   │
│  ├── Finances: Revenues + Expenses + Import/Export          │
│  ├── Credits: Loan tracking + Simulation                    │
│  └── Stats: Multi-year analysis                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    SQLite Database                          │
│              (database/contractdesk.db)                     │
│                                                             │
│  Tables:                                                    │
│  ├── users                                                  │
│  ├── properties                                             │
│  ├── revenues                                               │
│  ├── expenses                                               │
│  ├── credits                                                │
│  ├── leases                                                 │
│  ├── tenants                                                │
│  ├── countries, regions, departments, cities                │
│  └── due_dates                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Desktop Framework** | Electron 34.1.1 |
| **UI Framework** | React 19 |
| **Language** | TypeScript 5.6+ (strict mode) |
| **Build Tool** | Vite 6.2 |
| **Database** | SQLite (better-sqlite3) |
| **Styling** | Tailwind CSS 4.0 + ShadCN UI |
| **Charts** | D3.js 7.9 |
| **Testing** | Jest + React Testing Library |
| **Internationalization** | i18next + react-i18next |
| **Packaging** | electron-builder 25.1.8 |
| **CI/CD** | GitHub Actions |

---

## 🚀 Installation

### Prerequisites

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** 10.x or higher (comes with Node.js)
- **Git** (for cloning the repository)

> **Note on SQLite**: The `better-sqlite3` native module is included. After installation or Node/Electron version changes, rebuild native modules:
> ```bash
> npx electron-rebuild -f
> ```

### Clone the Repository

```bash
git clone https://github.com/Flotroniks/ContractDesk.git
cd ContractDesk
```

### Install Dependencies

```bash
npm install
```

This will install all required dependencies and rebuild native modules for your platform.

---

## 💻 Development

### Start Development Environment

Run both the Vite dev server and Electron in parallel:

```bash
npm run dev
```

This command:
1. Transpiles Electron TypeScript files to `dist-electron/`
2. Starts Vite dev server on port `3524`
3. Launches Electron with hot-reload enabled

### Run Components Separately

**Renderer only** (React UI):
```bash
npm run dev:react
```

**Electron only** (after transpiling):
```bash
npm run dev:electron
```

### Transpile Electron Source

When you modify Electron TypeScript files (`src/electron/`), run:

```bash
npm run transpile:electron
```

Or restart `npm run dev` to pick up changes.

### Linting

```bash
npm run lint           # Check for issues
npm run lint:fix       # Auto-fix issues
```

### Type Checking

```bash
npx tsc --noEmit       # Check TypeScript types
```

---

## 📦 Building & Packaging

### Build for Production

```bash
npm run build
```

This command:
1. Transpiles Electron code to `dist-electron/`
2. Builds React app to `dist-react/` (via Vite)
3. Optimizes and minifies all assets

### Package Desktop Applications

#### macOS (ARM64)

```bash
npm run dist:mac
```

Generates:
- `dist/mac-arm64/ContractDesk.app`
- `dist/ContractDesk-X.X.X-arm64.dmg`

#### Windows (x64)

```bash
npm run dist:win
```

Generates:
- `dist/ContractDesk-X.X.X-portable.exe` (portable version)
- `dist/ContractDesk-X.X.X.msi` (installer)

#### Linux (x64)

```bash
npm run dist:linux
```

Generates:
- `dist/ContractDesk-X.X.X.AppImage`
- `dist/ContractDesk-X.X.X.tar.gz`

---

## 🏷️ Creating a Release

ContractDesk uses **semantic versioning** (`vX.Y.Z`) and automated GitHub releases.

### Release Process

1. **Ensure all changes are committed**:
   ```bash
   git status
   ```

2. **Run release script** (patch/minor/major):
   ```bash
   npm run release:patch    # v0.3.4 → v0.3.5 (bug fixes)
   npm run release:minor    # v0.3.4 → v0.4.0 (new features)
   npm run release:major    # v0.3.4 → v1.0.0 (breaking changes)
   ```

3. **Automated GitHub Actions workflow**:
   - CI runs tests, linting, and typecheck
   - Builds for Linux, macOS, and Windows
   - Creates GitHub Release with binaries attached
   - Publishes artifacts automatically

### Manual Tag Creation

```bash
git tag v0.4.0
git push origin main --follow-tags
```

GitHub Actions will automatically build and publish the release.

---

## 🔐 Security

ContractDesk follows **Electron security best practices**:

### Electron Configuration

```typescript
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,      // Isolate renderer from Node.js
    nodeIntegration: false,      // Disable Node.js in renderer
    sandbox: false,              // Required for better-sqlite3
    preload: preloadPath,        // Safe IPC bridge
  },
});
```

### Security Features

| Setting | Value | Purpose |
|---------|-------|---------|
| **contextIsolation** | `true` | Separates preload/renderer contexts |
| **nodeIntegration** | `false` | Prevents direct Node.js access in renderer |
| **sandbox** | `false` | Allows native modules (SQLite) in main process |
| **preload** | Typed API | Exposes only safe, validated IPC channels |

### Preload API (window.electron)

All renderer ↔ main communication goes through a **type-safe preload bridge**:

```typescript
// Renderer (React)
const users = await window.electron.listUsers();
await window.electron.createProperty({ userId: 1, name: "Apartment 1A" });

// Preload (src/electron/preload.cts)
contextBridge.exposeInMainWorld('electron', {
  listUsers: () => ipcRenderer.invoke('listUsers'),
  createProperty: (args) => ipcRenderer.invoke('createProperty', args),
  // ... all IPC channels defined in types.d.ts
});
```

### Data Privacy

- **100% local storage**: No cloud uploads, no telemetry
- **No external API calls** except optional location lookup (user-initiated)
- **No third-party analytics**
- **Password hashing**: bcrypt for user authentication
- **File system isolation**: Database stored in app data directory

---

## 📡 IPC Communication

ContractDesk uses **typed IPC channels** for all inter-process communication.

### Flow Diagram

```
┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
│              │                 │              │                 │              │
│   Renderer   │────invoke────▶│   Preload    │────invoke────▶│     Main     │
│  (React UI)  │                 │   Bridge     │                 │   Process    │
│              │                 │              │                 │              │
│              │◀───result──────│              │◀───result──────│   SQLite DB  │
│              │                 │              │                 │              │
└──────────────┘                 └──────────────┘                 └──────────────┘
```

### Example: Creating a Property

**1. Renderer (React Component)**
```typescript
const handleCreate = async () => {
  const newProperty = await window.electron.createProperty({
    userId: currentUser.id,
    name: "Downtown Apartment",
    address: "123 Main St",
    city_id: 42,
    type: "Apartment",
    surface: 65,
    base_rent: 1200,
    purchase_price: 180000,
  });
  console.log("Created:", newProperty);
};
```

**2. Preload (Type-safe Bridge)**
```typescript
// src/electron/preload.cts
contextBridge.exposeInMainWorld('electron', {
  createProperty: (args: EventPayloadArgs['createProperty']) =>
    ipcRenderer.invoke('createProperty', args),
});
```

**3. Main Process (Database Handler)**
```typescript
// src/electron/main.ts
ipcMain.handle('createProperty', async (_event, args) => {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO properties (user_id, name, address, city_id, type, surface, base_rent, purchase_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    args.userId, args.name, args.address, args.city_id,
    args.type, args.surface, args.base_rent, args.purchase_price
  );
  return { id: result.lastInsertRowid, ...args };
});
```

### Type Definitions (types.d.ts)

All IPC channels are defined in `types.d.ts`:

```typescript
type EventPayloadArgs = {
  createProperty: {
    userId: number;
    name: string;
    address?: string;
    city_id?: number | null;
    // ... all other fields
  };
  listProperties: { userId: number };
  updateProperty: { id: number; /* ... */ };
  deleteProperty: { id: number };
  // ... 40+ IPC channels
};

type EventPayloadMapping = {
  createProperty: Property;
  listProperties: Property[];
  updateProperty: Property;
  deleteProperty: void;
  // ... return types
};
```

---

## 🗄️ Database Schema

ContractDesk uses **SQLite** with a normalized relational schema.

### Core Tables

#### **users**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | User ID |
| `username` | TEXT UNIQUE | Username |
| `password_hash` | TEXT | bcrypt hash |
| `created_at` | TEXT | ISO 8601 timestamp |

#### **properties**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Property ID |
| `user_id` | INTEGER FK | Owner user |
| `name` | TEXT | Property name |
| `address` | TEXT | Street address |
| `city_id` | INTEGER FK | City reference |
| `region_id` | INTEGER FK | Region reference |
| `country_id` | INTEGER FK | Country reference |
| `department_id` | INTEGER FK | Department reference |
| `type` | TEXT | Property type (apartment, house, etc.) |
| `surface` | REAL | Surface area (m²) |
| `base_rent` | REAL | Monthly rent |
| `base_charges` | REAL | Monthly charges |
| `purchase_price` | REAL | Purchase price |
| `status` | TEXT | active, sold, renovating, etc. |
| `created_at` | TEXT | ISO 8601 timestamp |

#### **revenues**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Revenue ID |
| `user_id` | INTEGER FK | Owner user |
| `property_id` | INTEGER FK | Related property |
| `category` | TEXT | Revenue category |
| `amount` | REAL | Amount (positive) |
| `date` | TEXT | ISO 8601 date |
| `description` | TEXT | Optional notes |
| `created_at` | TEXT | Record creation time |

#### **expenses**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Expense ID |
| `user_id` | INTEGER FK | Owner user |
| `property_id` | INTEGER FK | Related property |
| `category` | TEXT | Expense category (see below) |
| `amount` | REAL | Amount (positive) |
| `date` | TEXT | ISO 8601 date |
| `description` | TEXT | Optional notes |
| `created_at` | TEXT | Record creation time |

**Expense Categories**:
- Maintenance (`Entretien`)
- Repairs (`Dégâts`)
- Taxes (`Impôts`)
- Insurance (`Assurance`)
- Electricity (`Électricité`)
- Water (`Eau`)
- Gas (`Gaz`)
- Internet (`Internet`)
- Building fees (`Charges de copropriété`)
- Property management (`Gestion locative`)
- Other (`Autres`)

#### **credits**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Credit ID |
| `user_id` | INTEGER FK | Owner user |
| `property_id` | INTEGER FK | Related property |
| `credit_type` | TEXT | Loan type |
| `down_payment` | REAL | Down payment amount |
| `principal` | REAL | Loan principal |
| `annual_rate` | REAL | Annual interest rate (%) |
| `duration_months` | INTEGER | Loan duration |
| `start_date` | TEXT | Loan start date |
| `monthly_payment` | REAL | Monthly installment |
| `insurance_monthly` | REAL | Monthly insurance |
| `notes` | TEXT | Additional notes |
| `is_active` | INTEGER | 0 = finished, 1 = active |
| `created_at` | TEXT | Record creation time |

#### **leases**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Lease ID |
| `property_id` | INTEGER FK | Related property |
| `tenant_id` | INTEGER FK | Tenant reference |
| `start_date` | TEXT | Lease start date |
| `end_date` | TEXT | Lease end date (nullable) |
| `monthly_rent` | REAL | Rent amount |
| `monthly_charges` | REAL | Charges amount |
| `deposit` | REAL | Security deposit |
| `status` | TEXT | active, terminated, etc. |
| `created_at` | TEXT | Record creation time |

#### **tenants**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Tenant ID |
| `user_id` | INTEGER FK | Owner user |
| `first_name` | TEXT | First name |
| `last_name` | TEXT | Last name |
| `email` | TEXT | Email address |
| `phone` | TEXT | Phone number |
| `created_at` | TEXT | Record creation time |

#### **due_dates**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Due date ID |
| `property_id` | INTEGER FK | Related property |
| `lease_id` | INTEGER FK | Related lease |
| `month` | TEXT | Month (YYYY-MM) |
| `planned_amount` | REAL | Expected amount |
| `paid_amount` | REAL | Actual paid amount |
| `status` | TEXT | ok, partial, late, unpaid |
| `created_at` | TEXT | Record creation time |

### Location Hierarchy

```
countries (id, name, code)
    ↓
regions (id, country_id, name)
    ↓
departments (id, region_id, name)
    ↓
cities (id, region_id, country_id, department_id, name)
```

---

## 📊 CSV/Excel Import

ContractDesk supports importing financial data from CSV or Excel files.

### Import Format

Create a CSV file with the following columns:

| Column | Format | Example | Description |
|--------|--------|---------|-------------|
| **Date** | `YYYY-MM-DD` or `DD/MM/YYYY` | `2024-12-15` | Transaction date |
| **Category** | Text | `Loyer` | Revenue/expense category |
| **Type** | `+` or `-` | `+` | `+` for revenue, `−` for expense |
| **Amount** | Number | `1200.50` | Transaction amount (always positive) |
| **Description** | Text | `Rent December` | Optional notes |

### Example CSV

```csv
Date,Category,Type,Amount,Description
2024-12-01,Loyer,+,1200.00,Monthly rent
2024-12-05,Électricité,-,85.50,Electricity bill
2024-12-10,Charges,+,150.00,Service charges
2024-12-15,Entretien,-,320.00,Plumbing repair
```

### Import Process

1. Navigate to **Finances** tab
2. Click **Import CSV/Excel**
3. Select property
4. Choose file (`.csv` or `.xlsx`)
5. Preview data mapping
6. Confirm import

### Category Mapping

The application automatically maps common category names:

| French | English | Category |
|--------|---------|----------|
| Loyer | Rent | Revenue |
| Électricité | Electricity | Expense |
| Eau | Water | Expense |
| Gaz | Gas | Expense |
| Assurance | Insurance | Expense |
| Impôts | Taxes | Expense |
| Entretien | Maintenance | Expense |
| Dégâts | Repairs | Expense |

---

## 🧪 Testing

ContractDesk has a comprehensive test suite covering unit, integration, and UI tests.

### Run All Tests

```bash
npm test
```

### Test Types

**Unit Tests**: Isolated function/component tests
```bash
npm run test:unit
```

**Integration Tests**: Database operations, IPC handlers
```bash
npm run test:integration
```

**UI Tests**: React component rendering and interactions
```bash
npm run test:ui
```

### Watch Mode (development)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

Generates coverage report in `coverage/` directory.

### Test Structure

```
tests/
├── unit/
│   ├── formatters.test.ts        # Currency/percentage formatting
│   ├── credit.test.ts            # Credit calculation logic
│   └── utils.test.ts             # Utility functions
├── integration/
│   ├── database.test.ts          # SQLite operations
│   ├── ipc-handlers.test.ts      # IPC channel handlers
│   └── import-export.test.ts     # CSV/Excel import/export
└── ui/
    ├── PortfolioDashboard.test.tsx   # Dashboard component
    ├── PropertyForm.test.tsx          # Property form
    └── CreditSimulator.test.tsx       # Credit simulator
```

### Mock Database

Tests use an in-memory SQLite database:

```typescript
// Set test environment
process.env.CONTRACTDESK_DB_PATH = ':memory:';

// Reset between tests
afterEach(() => {
  resetDbForTests();
});
```

---

## 🔄 CI/CD Pipeline

ContractDesk uses **GitHub Actions** for continuous integration and automated releases.

### Workflow Triggers

- **Push to `dev` or `main`**: Runs validation (lint, test, build)
- **Pull requests**: Runs validation
- **Tag push (`v*`)**: Full build + release

### Pipeline Stages

#### 1. **Validate Job** (runs on all pushes/PRs)

```yaml
- Checkout code
- Install Node.js 20
- Install dependencies (npm ci)
- Run ESLint (npm run lint)
- TypeScript type check (tsc --noEmit)
- Run test suite (npm test)
- Build frontend (npm run build)
```

#### 2. **Build Electron Job** (runs only on tag push)

Builds for **Linux**, **macOS**, and **Windows** in parallel:

```yaml
Strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]

Steps:
- Build for Linux: npm run dist:linux → AppImage + tar.gz
- Build for macOS: npm run dist:mac → DMG
- Build for Windows: npm run dist:win → Portable + MSI
```

#### 3. **Release Job** (runs only on tag push)

```yaml
- Create GitHub Release
- Upload all platform binaries as release assets
- Publish to GitHub Releases page
```

### Release Artifacts

| Platform | Files |
|----------|-------|
| **macOS** | `ContractDesk-X.X.X-arm64.dmg` |
| **Windows** | `ContractDesk-X.X.X-portable.exe`<br>`ContractDesk-X.X.X.msi` |
| **Linux** | `ContractDesk-X.X.X.AppImage`<br>`ContractDesk-X.X.X.tar.gz` |

### Workflow Configuration

See `.github/workflows/webpack.yml` for full pipeline definition.

---

## 🛣️ Roadmap

### Short-term (v0.4.x)

- [ ] **Cloud Backup** (optional): Encrypted backup to user's preferred cloud storage
- [ ] **Document Attachments**: PDF/image storage for contracts, invoices, photos
- [ ] **Expense Receipts**: OCR scanning for automatic expense entry
- [ ] **Multi-currency Support**: Handle properties in different currencies
- [ ] **Dark Mode**: UI theme toggle

### Mid-term (v0.5.x)

- [ ] **Mobile Companion App**: React Native app for viewing data on-the-go
- [ ] **Tenant Portal**: Web interface for tenants to view leases, pay rent
- [ ] **Automated Reminders**: Email/notification system for due dates
- [ ] **Tax Reports**: Automated tax document generation
- [ ] **Rental Market Analysis**: Integration with property listing APIs

### Long-term (v1.0+)

- [ ] **Multi-user Collaboration**: Shared property management with permissions
- [ ] **Property Comparison**: Side-by-side comparison tool
- [ ] **Predictive Analytics**: ML-based expense forecasting
- [ ] **Mobile App** (iOS/Android): Native mobile clients
- [ ] **API for Integrations**: RESTful API for third-party tools
- [ ] **Plugin System**: Extensible architecture for custom features

---
