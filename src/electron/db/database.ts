import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import bcrypt from 'bcryptjs';
import { calculateMonthlyPayment, totalMonthlyCharge, isCreditFinished } from '../../shared/credit.js';

let db: Database.Database | null = null;

/**
 * Resolve the SQLite database path, allowing tests to override with CONTRACTDESK_DB_PATH
 * (use ":memory:" for an ephemeral database).
 */
function resolveDbPath(): string {
  const override = process.env.CONTRACTDESK_DB_PATH;
  if (override) {
    return override === ':memory:' ? override : path.isAbsolute(override) ? override : path.join(process.cwd(), override);
  }
  const baseProject = process.cwd();
  return path.join(baseProject, 'database', 'contractdesk.db');
}

/**
 * Lazily open the shared SQLite connection and initialize schema if needed.
 */
export function getDb() {
  if (!db) {
    const dbPath = resolveDbPath();
    if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    initSchema(db);
  }
  return db;
}

/**
 * Test-only helper to close and clear the singleton database connection.
 */
export function resetDbForTests() {
  if (db) {
    db.close();
    db = null;
  }
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS countries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      country_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (country_id) REFERENCES countries(id),
      UNIQUE(country_id, name)
    );

    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      region_id INTEGER NOT NULL,
      country_id INTEGER NOT NULL,
      department_id INTEGER,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (region_id) REFERENCES regions(id),
      FOREIGN KEY (country_id) REFERENCES countries(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      UNIQUE(country_id, region_id, department_id, name)
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      region_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (region_id) REFERENCES regions(id),
      UNIQUE(region_id, name)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      city_id INTEGER,
      region_id INTEGER,
      country_id INTEGER,
      department_id INTEGER,
      type TEXT,
      surface REAL,
      base_rent REAL,
      base_charges REAL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (city_id) REFERENCES cities(id),
      FOREIGN KEY (region_id) REFERENCES regions(id),
      FOREIGN KEY (country_id) REFERENCES countries(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      type TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS leases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      rent REAL NOT NULL,
      charges REAL NOT NULL,
      deposit REAL,
      frequency TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS dues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lease_id INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      amount_rent REAL NOT NULL,
      amount_charges REAL NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      paid_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (lease_id) REFERENCES leases(id)
    );

    CREATE TABLE IF NOT EXISTS credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      credit_type TEXT,
      down_payment REAL,
      principal REAL,
      annual_rate REAL,
      duration_months INTEGER,
      start_date TEXT,
      monthly_payment REAL,
      insurance_monthly REAL,
      notes TEXT,
      monthly_amount REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      frequency TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS incomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      lease_id INTEGER,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (lease_id) REFERENCES leases(id)
    );

    CREATE TABLE IF NOT EXISTS amortizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      UNIQUE(type, name)
    );
  `);

  ensurePropertyColumns(db);
  ensureCreditColumns(db);
  ensureCityColumns(db);
  initializeDefaultCountries(db);

  // Migration: hash password "1234" for existing users with placeholder
  const defaultHash = bcrypt.hashSync('1234', 10);
  db.prepare(`
    UPDATE users 
    SET password_hash = ? 
    WHERE password_hash = 'local-user';
  `).run(defaultHash);
}

function ensureColumn(db: Database.Database, table: string, column: string, definition: string) {
  const info = db.prepare(`PRAGMA table_info(${table});`).all() as Array<{ name: string }>;
  const exists = info.some((row) => row.name === column);
  if (!exists) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${definition};`).run();
  }
}

function ensurePropertyColumns(db: Database.Database) {
  ensureColumn(db, 'properties', 'city_id', 'city_id INTEGER');
  ensureColumn(db, 'properties', 'region_id', 'region_id INTEGER');
  ensureColumn(db, 'properties', 'country_id', 'country_id INTEGER');
  ensureColumn(db, 'properties', 'department_id', 'department_id INTEGER REFERENCES departments(id)');
  ensureColumn(db, 'properties', 'purchase_price', 'purchase_price REAL');
  
  // Migrate department TEXT to department_id if old schema exists
  const depCheckInfo = db.prepare(`PRAGMA table_info(properties);`).all() as Array<{ name: string; type: string }>;
  const hasOldDept = depCheckInfo.some((row) => row.name === 'department');
  if (hasOldDept) {
    try {
      db.prepare(`DROP COLUMN IF EXISTS department;`).run();
    } catch {
      // Ignore errors if column doesn't exist
    }
  }

  // Ensure departments table exists (in case schema wasn't created fresh)
  const deptTableCheck = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='departments';`).get();
  if (!deptTableCheck) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (region_id) REFERENCES regions(id),
        UNIQUE(region_id, name)
      );
    `);
  }
}

function ensureCityColumns(db: Database.Database) {
  ensureColumn(db, 'cities', 'department_id', 'department_id INTEGER REFERENCES departments(id)');
}

function ensureCreditColumns(db: Database.Database) {
  ensureColumn(db, 'credits', 'credit_type', 'credit_type TEXT');
  ensureColumn(db, 'credits', 'down_payment', 'down_payment REAL');
  ensureColumn(db, 'credits', 'principal', 'principal REAL');
  ensureColumn(db, 'credits', 'annual_rate', 'annual_rate REAL');
  ensureColumn(db, 'credits', 'duration_months', 'duration_months INTEGER');
  ensureColumn(db, 'credits', 'start_date', 'start_date TEXT');
  ensureColumn(db, 'credits', 'monthly_payment', 'monthly_payment REAL');
  ensureColumn(db, 'credits', 'insurance_monthly', 'insurance_monthly REAL');
  ensureColumn(db, 'credits', 'notes', 'notes TEXT');
  ensureColumn(db, 'credits', 'monthly_amount', 'monthly_amount REAL');
  ensureColumn(db, 'credits', 'is_active', 'is_active INTEGER NOT NULL DEFAULT 1');

  const creditInfo = db.prepare(`PRAGMA table_info(credits);`).all() as Array<{ name: string }>;  
  const hasMonthlyPayment = creditInfo.some((row) => row.name === 'monthly_payment');
  const hasMonthlyAmount = creditInfo.some((row) => row.name === 'monthly_amount');
  if (hasMonthlyPayment && hasMonthlyAmount) {
    db.prepare(`UPDATE credits SET monthly_payment = monthly_amount WHERE monthly_payment IS NULL;`).run();
  }
}

/**
 * Scan active credits and mark the ones past their term as inactive.
 * @param now Current date reference used to evaluate end-of-term.
 */
export function markFinishedCreditsInactive(now: Date = new Date()) {
  const db = getDb();
  const activeCredits = db
    .prepare(
      `SELECT id, user_id, property_id, credit_type, down_payment, principal, annual_rate, duration_months, start_date, monthly_payment, insurance_monthly, notes, monthly_amount, is_active, created_at
       FROM credits
       WHERE is_active = 1;`
    )
    .all() as CreditRow[];

  const finishedIds = activeCredits
    .filter((credit) => {
      try {
        return isCreditFinished(credit, now);
      } catch (err) {
        console.warn('[credits] unable to evaluate credit', credit?.id, err);
        return false;
      }
    })
    .map((credit) => credit.id);

  if (finishedIds.length === 0) return;

  const placeholders = finishedIds.map(() => '?').join(', ');
  db.prepare(`UPDATE credits SET is_active = 0 WHERE id IN (${placeholders});`).run(...finishedIds);
}

function initializeDefaultCountries(db: Database.Database) {
  const countries = [
    { name: 'France', code: 'FR' },
    { name: 'Belgium', code: 'BE' },
    { name: 'Switzerland', code: 'CH' },
    { name: 'Luxembourg', code: 'LU' },
    { name: 'Germany', code: 'DE' },
    { name: 'Spain', code: 'ES' },
    { name: 'Italy', code: 'IT' },
    { name: 'Netherlands', code: 'NL' },
  ];

  const countryStmt = db.prepare('INSERT OR IGNORE INTO countries (name, code) VALUES (?, ?)');
  for (const country of countries) {
    countryStmt.run(country.name, country.code);
  }
}

export type UserRow = {
  id: number;
  username: string;
  created_at: string;
};

export type PropertyRow = {
  id: number;
  user_id: number;
  name: string;
  address: string | null;
  city_id: number | null;
  region_id: number | null;
  country_id: number | null;
  department_id: number | null;
  type: string | null;
  surface: number | null;
  base_rent: number | null;
  base_charges: number | null;
  purchase_price: number | null;
  status: string;
  created_at: string;
};

export type CountryRow = {
  id: number;
  name: string;
  code: string | null;
  created_at: string;
};

export type RegionRow = {
  id: number;
  country_id: number;
  name: string;
  created_at: string;
};

export type CityRow = {
  id: number;
  region_id: number;
  country_id: number;
  department_id: number | null;
  name: string;
  created_at: string;
};

export type DepartmentRow = {
  id: number;
  region_id: number;
  name: string;
  created_at: string;
};

export type ExpenseRow = {
  id: number;
  property_id: number;
  date: string;
  category: string;
  description: string | null;
  amount: number;
  is_recurring: number;
  frequency: string | null;
  created_at: string;
};

export type IncomeRow = {
  id: number;
  property_id: number;
  lease_id: number | null;
  date: string;
  amount: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
};

export type CreditRow = {
  id: number;
  user_id: number;
  property_id: number;
  credit_type: string | null;
  down_payment: number | null;
  principal: number | null;
  annual_rate: number | null;
  duration_months: number | null;
  start_date: string | null;
  monthly_payment: number | null;
  insurance_monthly: number | null;
  notes: string | null;
  monthly_amount: number | null;
  is_active: number;
  created_at: string;
};

export type AmortizationRow = {
  id: number;
  property_id: number;
  start_date: string;
  end_date: string;
  amount: number;
  category: string;
  created_at: string;
};

export type CategoryRow = {
  id: number;
  type: 'expense' | 'income';
  name: string;
};

/**
 * List all users ordered by creation date.
 * @returns Array of persisted users with ids and timestamps.
 */
export function listUsers(): UserRow[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT id, username, created_at FROM users ORDER BY created_at ASC;`)
    .all() as UserRow[];

  return rows;
}

/**
 * Create a user with a hashed password.
 * @param username User login name.
 * @param password Plaintext password (default 1234 for bootstrapping).
 */
export function createUser(username: string, password: string = '1234'): UserRow {
  const trimmedName = username.trim();
  if (!trimmedName) throw new Error("username_required");

  const db = getDb();
  const passwordHash = bcrypt.hashSync(password, 10);

  try {
    const insertResult = db
      .prepare(`INSERT INTO users (username, password_hash) VALUES (?, ?);`)
      .run(trimmedName, passwordHash);

    const userId = Number(insertResult.lastInsertRowid);
    const created = db
      .prepare(`SELECT id, username, created_at FROM users WHERE id = ?;`)
      .get(userId) as UserRow | undefined;

    if (!created) throw new Error("user_not_persisted");

    return created;
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new Error("user_already_exists");
    }
    throw error;
  }
}

/**
 * Verify credentials and return the user row on success.
 */
export function verifyUserPassword(username: string, password: string): UserRow | null {
  const db = getDb();
  const user = db
    .prepare(`SELECT id, username, password_hash, created_at FROM users WHERE username = ?;`)
    .get(username) as (UserRow & { password_hash: string }) | undefined;

  if (!user) return null;
  if (!bcrypt.compareSync(password, user.password_hash)) return null;

  return { id: user.id, username: user.username, created_at: user.created_at };
}

/**
 * Update a username while keeping uniqueness constraints intact.
 */
export function updateUser(id: number, username: string): UserRow {
  const trimmedName = username.trim();
  if (!trimmedName) throw new Error("username_required");

  const db = getDb();

  try {
    const result = db
      .prepare(`UPDATE users SET username = ? WHERE id = ?;`)
      .run(trimmedName, id);

    if (result.changes === 0) throw new Error("user_not_found");

    const updated = db
      .prepare(`SELECT id, username, created_at FROM users WHERE id = ?;`)
      .get(id) as UserRow | undefined;

    if (!updated) throw new Error("user_not_persisted");

    return updated;
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new Error("user_already_exists");
    }
    throw error;
  }
}

/**
 * Delete a user and cascade delete their properties.
 * @returns Count of properties removed.
 */
export function deleteUser(id: number): { propertiesDeleted: number } {
  const db = getDb();

  // Supprimer d'abord toutes les propriétés associées
  const propertiesResult = db
    .prepare(`DELETE FROM properties WHERE user_id = ?;`)
    .run(id);

  // Puis supprimer l'utilisateur
  const userResult = db
    .prepare(`DELETE FROM users WHERE id = ?;`)
    .run(id);

  if (userResult.changes === 0) throw new Error("user_not_found");

  return { propertiesDeleted: propertiesResult.changes };
}

// ========== COUNTRIES, REGIONS, CITIES ==========

/**
 * Retrieve all countries ordered alphabetically.
 */
export function listCountries(): CountryRow[] {
  const db = getDb();
  return db
    .prepare(`SELECT id, name, code, created_at FROM countries ORDER BY name ASC;`)
    .all() as CountryRow[];
}

/**
 * List regions for a given country id.
 */
export function listRegions(countryId: number): RegionRow[] {
  const db = getDb();
  return db
    .prepare(`SELECT id, country_id, name, created_at FROM regions WHERE country_id = ? ORDER BY name ASC;`)
    .all(countryId) as RegionRow[];
}

/**
 * List cities by region, optionally filtered by department.
 */
export function listCities(regionId: number, departmentId?: number | null): CityRow[] {
  const db = getDb();
  if (departmentId) {
    return db
      .prepare(
        `SELECT id, region_id, country_id, department_id, name, created_at FROM cities WHERE region_id = ? AND department_id = ? ORDER BY name ASC;`
      )
      .all(regionId, departmentId) as CityRow[];
  }

  return db
    .prepare(`SELECT id, region_id, country_id, department_id, name, created_at FROM cities WHERE region_id = ? ORDER BY name ASC;`)
    .all(regionId) as CityRow[];
}

/**
 * Create a country row with uniqueness enforcement on name/code.
 */
export function createCountry(name: string, code?: string): CountryRow {
  const db = getDb();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("country_name_required");

  try {
    const result = db
      .prepare(`INSERT INTO countries (name, code) VALUES (?, ?);`)
      .run(trimmedName, code?.trim() || null);

    const inserted = db
      .prepare(`SELECT id, name, code, created_at FROM countries WHERE id = ?;`)
      .get(Number(result.lastInsertRowid)) as CountryRow | undefined;

    if (!inserted) throw new Error("country_not_persisted");
    return inserted;
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new Error("country_already_exists");
    }
    throw error;
  }
}

/**
 * Create a region under a country.
 */
export function createRegion(countryId: number, name: string): RegionRow {
  const db = getDb();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("region_name_required");

  try {
    const result = db
      .prepare(`INSERT INTO regions (country_id, name) VALUES (?, ?);`)
      .run(countryId, trimmedName);

    const inserted = db
      .prepare(`SELECT id, country_id, name, created_at FROM regions WHERE id = ?;`)
      .get(Number(result.lastInsertRowid)) as RegionRow | undefined;

    if (!inserted) throw new Error("region_not_persisted");
    return inserted;
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new Error("region_already_exists");
    }
    throw error;
  }
}

/**
 * Create a city tied to region/country (and optionally department).
 */
export function createCity(regionId: number, countryId: number, departmentId: number | null, name: string): CityRow {
  const db = getDb();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("city_name_required");

  try {
    const result = db
      .prepare(`INSERT INTO cities (region_id, country_id, department_id, name) VALUES (?, ?, ?, ?);`)
      .run(regionId, countryId, departmentId ?? null, trimmedName);

    const inserted = db
      .prepare(`SELECT id, region_id, country_id, department_id, name, created_at FROM cities WHERE id = ?;`)
      .get(Number(result.lastInsertRowid)) as CityRow | undefined;

    if (!inserted) throw new Error("city_not_persisted");
    return inserted;
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new Error("city_already_exists");
    }
    throw error;
  }
}

/**
 * List departments for a region.
 */
export function listDepartments(regionId: number): DepartmentRow[] {
  const db = getDb();
  return db
    .prepare(`SELECT id, region_id, name, created_at FROM departments WHERE region_id = ? ORDER BY name ASC;`)
    .all(regionId) as DepartmentRow[];
}

/**
 * Create a department under a region.
 */
export function createDepartment(regionId: number, name: string): DepartmentRow {
  const db = getDb();
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("department_name_required");

  try {
    const result = db
      .prepare(`INSERT INTO departments (region_id, name) VALUES (?, ?);`)
      .run(regionId, trimmedName);

    const inserted = db
      .prepare(`SELECT id, region_id, name, created_at FROM departments WHERE id = ?;`)
      .get(Number(result.lastInsertRowid)) as DepartmentRow | undefined;

    if (!inserted) throw new Error("department_not_persisted");
    return inserted;
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new Error("department_already_exists");
    }
    throw error;
  }
}

type PropertyUpdatePayload = {
  id: number;
  userId: number;
  name?: string;
  address?: string;
  city_id?: number | null;
  region_id?: number | null;
  country_id?: number | null;
  department_id?: number | null;
  type?: string;
  surface?: number | null;
  baseRent?: number | null;
  baseCharges?: number | null;
  purchase_price?: number | null;
  status?: string;
};

/**
 * List properties owned by a user ordered by creation date.
 */
export function listProperties(userId: number): PropertyRow[] {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT id, user_id, name, address, city_id, region_id, country_id, department_id, type, surface, base_rent, base_charges, purchase_price, status, created_at
      FROM properties
      WHERE user_id = ?
      ORDER BY created_at DESC;
    `)
    .all(userId) as PropertyRow[];

  return rows;
}

/**
 * Persist a property with validation on name and status defaults.
 */
export function createProperty(payload: {
  userId: number;
  name: string;
  address?: string;
  city_id?: number | null;
  region_id?: number | null;
  country_id?: number | null;
  department_id?: number | null;
  type?: string;
  surface?: number | null;
  baseRent?: number | null;
  baseCharges?: number | null;
  purchase_price?: number | null;
}): PropertyRow {
  const db = getDb();
  const name = payload.name?.trim();
  if (!name) throw new Error("property_name_required");

  const result = db
    .prepare(`
      INSERT INTO properties (user_id, name, address, city_id, region_id, country_id, department_id, type, surface, base_rent, base_charges, purchase_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active');
    `)
    .run(
      payload.userId,
      name,
      payload.address?.trim() || null,
      payload.city_id ?? null,
      payload.region_id ?? null,
      payload.country_id ?? null,
      payload.department_id ?? null,
      payload.type?.trim() || null,
      payload.surface ?? null,
      payload.baseRent ?? null,
      payload.baseCharges ?? null,
      payload.purchase_price ?? null
    );

  const id = Number(result.lastInsertRowid);
  const inserted = db
    .prepare(`
      SELECT id, user_id, name, address, city_id, region_id, country_id, department_id, type, surface, base_rent, base_charges, purchase_price, status, created_at
      FROM properties WHERE id = ?;
    `)
    .get(id) as PropertyRow | undefined;

  if (!inserted) throw new Error("property_not_persisted");
  return inserted;
}

/**
 * Update selected property fields while validating status and name.
 */
export function updateProperty(payload: PropertyUpdatePayload): PropertyRow {
  const db = getDb();
  if (!payload.id || !payload.userId) throw new Error("property_update_missing_id");

  const allowedStatus = ["active", "archived"];
  if (payload.status && !allowedStatus.includes(payload.status)) {
    throw new Error("property_status_invalid");
  }

  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if (payload.name !== undefined) {
    const name = payload.name.trim();
    if (!name) throw new Error("property_name_required");
    fields.push("name = ?");
    values.push(name);
  }
  if (payload.address !== undefined) {
    fields.push("address = ?");
    values.push(payload.address.trim() || null);
  }
  if (payload.city_id !== undefined) {
    fields.push("city_id = ?");
    values.push(payload.city_id ?? null);
  }
  if (payload.region_id !== undefined) {
    fields.push("region_id = ?");
    values.push(payload.region_id ?? null);
  }
  if (payload.country_id !== undefined) {
    fields.push("country_id = ?");
    values.push(payload.country_id ?? null);
  }
  if (payload.department_id !== undefined) {
    fields.push("department_id = ?");
    values.push(payload.department_id ?? null);
  }
  if (payload.type !== undefined) {
    fields.push("type = ?");
    values.push(payload.type.trim() || null);
  }
  if (payload.surface !== undefined) {
    fields.push("surface = ?");
    values.push(payload.surface ?? null);
  }
  if (payload.baseRent !== undefined) {
    fields.push("base_rent = ?");
    values.push(payload.baseRent ?? null);
  }
  if (payload.baseCharges !== undefined) {
    fields.push("base_charges = ?");
    values.push(payload.baseCharges ?? null);
  }
  if (payload.purchase_price !== undefined) {
    fields.push("purchase_price = ?");
    values.push(payload.purchase_price ?? null);
  }
  if (payload.status !== undefined) {
    fields.push("status = ?");
    values.push(payload.status);
  }

  if (fields.length === 0) throw new Error("property_update_empty");

  values.push(payload.id, payload.userId);

  const stmt = `UPDATE properties SET ${fields.join(", ")} WHERE id = ? AND user_id = ?;`;
  const res = db.prepare(stmt).run(...values);
  if (res.changes === 0) throw new Error("property_not_found");

  const updated = db
    .prepare(`
      SELECT id, user_id, name, address, city_id, region_id, country_id, department_id, type, surface, base_rent, base_charges, purchase_price, status, created_at
      FROM properties WHERE id = ?;
    `)
    .get(payload.id) as PropertyRow | undefined;

  if (!updated) throw new Error("property_not_persisted");
  return updated;
}

// ========== FINANCE: EXPENSES / INCOMES / AMORTIZATIONS / CATEGORIES ==========

type ExpensePayload = {
  property_id: number;
  date: string;
  category: string;
  description?: string | null;
  amount: number;
  is_recurring?: boolean;
  frequency?: string | null;
};

/**
 * Insert an expense row for a property.
 */
export function createExpense(payload: ExpensePayload): ExpenseRow {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO expenses (property_id, date, category, description, amount, is_recurring, frequency)
       VALUES (?, ?, ?, ?, ?, ?, ?);`
    )
    .run(
      payload.property_id,
      payload.date,
      payload.category,
      payload.description ?? null,
      payload.amount,
      payload.is_recurring ? 1 : 0,
      payload.frequency ?? null
    );

  const inserted = db
    .prepare(
      `SELECT id, property_id, date, category, description, amount, is_recurring, frequency, created_at
       FROM expenses WHERE id = ?;`
    )
    .get(Number(result.lastInsertRowid)) as ExpenseRow | undefined;

  if (!inserted) throw new Error("expense_not_persisted");
  return inserted;
}

/**
 * Update an expense and return the persisted row.
 */
export function updateExpense(id: number, payload: Partial<ExpensePayload>): ExpenseRow {
  const db = getDb();
  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if (payload.date !== undefined) {
    fields.push("date = ?");
    values.push(payload.date);
  }
  if (payload.category !== undefined) {
    fields.push("category = ?");
    values.push(payload.category);
  }
  if (payload.description !== undefined) {
    fields.push("description = ?");
    values.push(payload.description ?? null);
  }
  if (payload.amount !== undefined) {
    fields.push("amount = ?");
    values.push(payload.amount);
  }
  if (payload.is_recurring !== undefined) {
    fields.push("is_recurring = ?");
    values.push(payload.is_recurring ? 1 : 0);
  }
  if (payload.frequency !== undefined) {
    fields.push("frequency = ?");
    values.push(payload.frequency ?? null);
  }

  if (fields.length === 0) throw new Error("expense_update_empty");

  values.push(id);
  const stmt = `UPDATE expenses SET ${fields.join(", ")} WHERE id = ?;`;
  const res = db.prepare(stmt).run(...values);
  if (res.changes === 0) throw new Error("expense_not_found");

  const updated = db
    .prepare(
      `SELECT id, property_id, date, category, description, amount, is_recurring, frequency, created_at
       FROM expenses WHERE id = ?;`
    )
    .get(id) as ExpenseRow | undefined;

  if (!updated) throw new Error("expense_not_persisted");
  return updated;
}

/**
 * Remove an expense by id.
 */
export function deleteExpense(id: number) {
  const db = getDb();
  const res = db.prepare(`DELETE FROM expenses WHERE id = ?;`).run(id);
  if (res.changes === 0) throw new Error("expense_not_found");
}

/**
 * List expenses for a property, optionally filtered by year.
 */
export function listExpensesByProperty(propertyId: number, year?: number): ExpenseRow[] {
  const db = getDb();
  if (year) {
    return db
      .prepare(
        `SELECT id, property_id, date, category, description, amount, is_recurring, frequency, created_at
         FROM expenses
         WHERE property_id = ?
           AND date >= ? AND date <= ?
         ORDER BY date ASC;`
      )
      .all(propertyId, `${year}-01-01`, `${year}-12-31`) as ExpenseRow[];
  }

  return db
    .prepare(
      `SELECT id, property_id, date, category, description, amount, is_recurring, frequency, created_at
       FROM expenses
       WHERE property_id = ?
       ORDER BY date ASC;`
    )
    .all(propertyId) as ExpenseRow[];
}

type IncomePayload = {
  property_id: number;
  lease_id?: number | null;
  date: string;
  amount: number;
  payment_method?: string | null;
  notes?: string | null;
};

/**
 * Insert an income row for a property/lease.
 */
export function createIncome(payload: IncomePayload): IncomeRow {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO incomes (property_id, lease_id, date, amount, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?);`
    )
    .run(
      payload.property_id,
      payload.lease_id ?? null,
      payload.date,
      payload.amount,
      payload.payment_method ?? null,
      payload.notes ?? null
    );

  const inserted = db
    .prepare(
      `SELECT id, property_id, lease_id, date, amount, payment_method, notes, created_at
       FROM incomes WHERE id = ?;`
    )
    .get(Number(result.lastInsertRowid)) as IncomeRow | undefined;

  if (!inserted) throw new Error("income_not_persisted");
  return inserted;
}

/**
 * Update an income entry and return the row.
 */
export function updateIncome(id: number, payload: Partial<IncomePayload>): IncomeRow {
  const db = getDb();
  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if (payload.date !== undefined) {
    fields.push("date = ?");
    values.push(payload.date);
  }
  if (payload.amount !== undefined) {
    fields.push("amount = ?");
    values.push(payload.amount);
  }
  if (payload.payment_method !== undefined) {
    fields.push("payment_method = ?");
    values.push(payload.payment_method ?? null);
  }
  if (payload.notes !== undefined) {
    fields.push("notes = ?");
    values.push(payload.notes ?? null);
  }
  if (payload.lease_id !== undefined) {
    fields.push("lease_id = ?");
    values.push(payload.lease_id ?? null);
  }

  if (fields.length === 0) throw new Error("income_update_empty");

  values.push(id);
  const stmt = `UPDATE incomes SET ${fields.join(", ")} WHERE id = ?;`;
  const res = db.prepare(stmt).run(...values);
  if (res.changes === 0) throw new Error("income_not_found");

  const updated = db
    .prepare(
      `SELECT id, property_id, lease_id, date, amount, payment_method, notes, created_at
       FROM incomes WHERE id = ?;`
    )
    .get(id) as IncomeRow | undefined;

  if (!updated) throw new Error("income_not_persisted");
  return updated;
}

/**
 * Delete an income entry by id.
 */
export function deleteIncome(id: number) {
  const db = getDb();
  const res = db.prepare(`DELETE FROM incomes WHERE id = ?;`).run(id);
  if (res.changes === 0) throw new Error("income_not_found");
}

/**
 * List incomes for a property, optionally limited to a year.
 */
export function listIncomesByProperty(propertyId: number, year?: number): IncomeRow[] {
  const db = getDb();
  if (year) {
    return db
      .prepare(
        `SELECT id, property_id, lease_id, date, amount, payment_method, notes, created_at
         FROM incomes
         WHERE property_id = ? AND date >= ? AND date <= ?
         ORDER BY date ASC;`
      )
      .all(propertyId, `${year}-01-01`, `${year}-12-31`) as IncomeRow[];
  }

  return db
    .prepare(
      `SELECT id, property_id, lease_id, date, amount, payment_method, notes, created_at
       FROM incomes
       WHERE property_id = ?
       ORDER BY date ASC;`
    )
    .all(propertyId) as IncomeRow[];
}

/**
 * List credits for a property after marking finished ones inactive.
 */
export function listCreditsByProperty(propertyId: number): CreditRow[] {
  const db = getDb();
  markFinishedCreditsInactive();
  return db
    .prepare(
      `SELECT id, user_id, property_id, credit_type, down_payment, principal, annual_rate, duration_months, start_date, monthly_payment, insurance_monthly, notes, monthly_amount, is_active, created_at
       FROM credits
       WHERE property_id = ?
       ORDER BY created_at DESC;`
    )
    .all(propertyId) as CreditRow[];
}

/**
 * Return the first active credit for a property.
 */
export function getCreditByProperty(propertyId: number): CreditRow | null {
  markFinishedCreditsInactive();
  const [first] = listCreditsByProperty(propertyId).filter((c) => c.is_active === 1);
  return first ?? null;
}

type CreditPayload = {
  id?: number;
  user_id: number;
  property_id: number;
  credit_type?: string | null;
  principal?: number | null;
  down_payment?: number | null;
  annual_rate?: number | null;
  duration_months?: number | null;
  start_date?: string | null;
  insurance_monthly?: number | null;
  notes?: string | null;
  is_active?: number | boolean;
  refinance_from_id?: number | null;
};

/**
 * Insert or update a credit, recalculating monthly payment/amount.
 */
export function saveCredit(payload: CreditPayload): CreditRow {
  const db = getDb();
  const creditType = payload.credit_type ?? 'standard';
  const downPayment = payload.down_payment ?? null;
  const principal = payload.principal ?? null;
  const annualRate = payload.annual_rate ?? null;
  const durationMonths = payload.duration_months ?? null;
  const insuranceMonthly = payload.insurance_monthly ?? null;
  const refinanceFromId = payload.refinance_from_id ?? null;
  const monthlyPayment = calculateMonthlyPayment(principal ?? 0, annualRate ?? 0, durationMonths ?? 0);
  const monthlyAmount = totalMonthlyCharge(monthlyPayment, insuranceMonthly);
  const isActive = payload.is_active === undefined ? 1 : payload.is_active ? 1 : 0;

  if (payload.id) {
    const fields: string[] = [];
    const values: Array<string | number | null> = [];

    fields.push("credit_type = ?");
    values.push(creditType);
    fields.push("principal = ?");
    values.push(principal);
    fields.push("down_payment = ?");
    values.push(downPayment);
    fields.push("annual_rate = ?");
    values.push(annualRate);
    fields.push("duration_months = ?");
    values.push(durationMonths);
    fields.push("start_date = ?");
    values.push(payload.start_date ?? null);
    fields.push("monthly_payment = ?");
    values.push(monthlyPayment);
    fields.push("insurance_monthly = ?");
    values.push(insuranceMonthly);
    fields.push("monthly_amount = ?");
    values.push(monthlyAmount);
    fields.push("notes = ?");
    values.push(payload.notes ?? null);
    fields.push("is_active = ?");
    values.push(isActive);

    values.push(payload.id);
    const stmt = `UPDATE credits SET ${fields.join(", ")} WHERE id = ?;`;
    const res = db.prepare(stmt).run(...values);
    if (res.changes === 0) throw new Error("credit_not_found");

    if (isActive === 1) {
      db.prepare(`UPDATE credits SET is_active = 0 WHERE property_id = ? AND id != ?;`).run(payload.property_id, payload.id);
    }
  } else {
    const insert = db
      .prepare(
        `INSERT INTO credits (user_id, property_id, credit_type, down_payment, principal, annual_rate, duration_months, start_date, monthly_payment, insurance_monthly, monthly_amount, notes, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
      )
      .run(
        payload.user_id,
        payload.property_id,
        creditType,
        downPayment,
        principal,
        annualRate,
        durationMonths,
        payload.start_date ?? null,
        monthlyPayment,
        insuranceMonthly,
        monthlyAmount,
        payload.notes ?? null,
        isActive
      );

    payload.id = Number(insert.lastInsertRowid);

    if (refinanceFromId && refinanceFromId !== payload.id) {
      const note = `Refinanced on ${new Date().toISOString().slice(0, 10)} -> new credit #${payload.id}`;
      db.prepare(
        `UPDATE credits
         SET is_active = 0,
             notes = TRIM(COALESCE(notes, '') || CASE WHEN COALESCE(notes, '') = '' THEN '' ELSE char(10) END || ?)
         WHERE id = ?;`
      ).run(note, refinanceFromId);
    }
  }

  const saved = db
    .prepare(
      `SELECT id, user_id, property_id, credit_type, down_payment, principal, annual_rate, duration_months, start_date, monthly_payment, insurance_monthly, notes, monthly_amount, is_active, created_at
       FROM credits WHERE id = ?;`
    )
    .get(payload.id) as CreditRow | undefined;

  if (!saved) throw new Error("credit_not_persisted");
  return saved;
}

/**
 * Delete a credit entry.
 */
export function deleteCredit(id: number) {
  const db = getDb();
  const res = db.prepare(`DELETE FROM credits WHERE id = ?;`).run(id);
  if (res.changes === 0) throw new Error("credit_not_found");
  return { success: true } as const;
}

/**
 * List categories by type ordered by name.
 */
export function listCategories(type: 'expense' | 'income'): CategoryRow[] {
  const db = getDb();
  return db
    .prepare(`SELECT id, type, name FROM categories WHERE type = ? ORDER BY name ASC;`)
    .all(type) as CategoryRow[];
}

/**
 * Ensure a category exists and return it.
 */
export function upsertCategory(type: 'expense' | 'income', name: string): CategoryRow {
  const db = getDb();
  db.prepare(`INSERT OR IGNORE INTO categories (type, name) VALUES (?, ?);`).run(type, name);
  const row = db
    .prepare(`SELECT id, type, name FROM categories WHERE type = ? AND name = ?;`)
    .get(type, name) as CategoryRow | undefined;
  if (!row) throw new Error("category_not_persisted");
  return row;
}

/**
 * List amortization rows for a property.
 */
export function listAmortizationsByProperty(propertyId: number): AmortizationRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, property_id, start_date, end_date, amount, category, created_at
       FROM amortizations
       WHERE property_id = ?
       ORDER BY start_date ASC;`
    )
    .all(propertyId) as AmortizationRow[];
}

type MonthlyCashflow = {
  month: number;
  income: number;
  expenses: number;
  credit: number;
  cashflow: number;
};

type RecurringAllocation = {
  monthly: number[];
  byCategory: Record<string, number>;
  annual: number;
};

function baseMonthlyCredit(credit: CreditRow | null): number {
  const monthly = credit?.monthly_payment ?? credit?.monthly_amount ?? 0;
  return totalMonthlyCharge(monthly, credit?.insurance_monthly ?? 0);
}

function sumMonthlyCreditsForMonth(credits: CreditRow[], year: number, month: number): number {
  return credits
    .filter((credit) => credit.is_active === 1 && isCreditActiveForMonth(credit, year, month))
    .reduce((acc, credit) => acc + baseMonthlyCredit(credit), 0);
}

function annualCreditForYear(credits: CreditRow[], year: number): number {
  return credits
    .filter((credit) => credit.is_active === 1 && !isCreditFinished(credit))
    .reduce((acc, credit) => acc + baseMonthlyCredit(credit) * countActiveMonthsForYear(credit, year), 0);
}

function creditMonthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

function isCreditActiveForMonth(credit: CreditRow | null, year: number, month: number): boolean {
  if (!credit || credit.is_active === 0) return false;
  if (isCreditFinished(credit, new Date(Date.UTC(year, month - 1, 1)))) return false;
  if (!credit.start_date || !credit.duration_months || credit.duration_months <= 0) return true;
  const [startYearStr, startMonthStr] = credit.start_date.split("-");
  const startYear = Number(startYearStr);
  const startMonth = Number(startMonthStr);
  if (!startYear || !startMonth) return true;
  const startIdx = creditMonthIndex(startYear, startMonth);
  const endIdx = startIdx + credit.duration_months - 1;
  const currentIdx = creditMonthIndex(year, month);
  return currentIdx >= startIdx && currentIdx <= endIdx;
}

function countActiveMonthsForYear(credit: CreditRow | null, year: number): number {
  if (!credit || credit.is_active === 0) return 0;
  if (!credit.start_date || !credit.duration_months || credit.duration_months <= 0) return 12;
  const [startYearStr, startMonthStr] = credit.start_date.split("-");
  const startYear = Number(startYearStr);
  const startMonth = Number(startMonthStr);
  if (!startYear || !startMonth) return 12;

  const startIdx = creditMonthIndex(startYear, startMonth);
  const endIdx = startIdx + credit.duration_months - 1;
  const yearStart = creditMonthIndex(year, 1);
  const yearEnd = creditMonthIndex(year, 12);
  const overlapStart = Math.max(startIdx, yearStart);
  const overlapEnd = Math.min(endIdx, yearEnd);
  if (overlapStart > overlapEnd) return 0;
  return overlapEnd - overlapStart + 1;
}

function expandRecurringAllocations(rows: Array<{ amount: number; category: string; frequency: string }>): RecurringAllocation {
  const monthly = Array.from({ length: 12 }, () => 0);
  const byCategory: Record<string, number> = {};

  rows.forEach((row) => {
    const freq = row.frequency?.toLowerCase?.() ?? "monthly";
    if (freq === "quarterly") {
      const perMonth = row.amount / 3;
      [1, 4, 7, 10].forEach((start) => {
        for (let m = start; m < start + 3; m++) {
          monthly[m - 1] += perMonth;
          byCategory[row.category] = (byCategory[row.category] ?? 0) + perMonth;
        }
      });
    } else if (freq === "yearly" || freq === "annuel" || freq === "annually") {
      const perMonth = row.amount / 12;
      for (let m = 1; m <= 12; m++) {
        monthly[m - 1] += perMonth;
        byCategory[row.category] = (byCategory[row.category] ?? 0) + perMonth;
      }
    } else {
      // monthly default
      const perMonth = row.amount;
      for (let m = 1; m <= 12; m++) {
        monthly[m - 1] += perMonth;
        byCategory[row.category] = (byCategory[row.category] ?? 0) + perMonth;
      }
    }
  });

  const annual = monthly.reduce((acc, cur) => acc + cur, 0);
  return { monthly, byCategory, annual };
}

/**
 * Compute monthly cashflow breakdown (income, expenses, credit) for a property.
 */
export function listCashflowByProperty(propertyId: number, year: number): MonthlyCashflow[] {
  const db = getDb();
  markFinishedCreditsInactive();

  const incomeRows = db
    .prepare(
      `SELECT CAST(strftime('%m', date) AS INTEGER) AS month, SUM(amount) AS total
       FROM incomes
       WHERE property_id = ? AND date >= ? AND date <= ?
       GROUP BY month;`
    )
    .all(propertyId, `${year}-01-01`, `${year}-12-31`) as Array<{ month: number; total: number }>;

  const expenseRows = db
    .prepare(
      `SELECT CAST(strftime('%m', date) AS INTEGER) AS month, SUM(amount) AS total
       FROM expenses
       WHERE property_id = ? AND date >= ? AND date <= ? AND (is_recurring IS NULL OR is_recurring = 0)
       GROUP BY month;`
    )
    .all(propertyId, `${year}-01-01`, `${year}-12-31`) as Array<{ month: number; total: number }>;

  const recurringRows = db
    .prepare(
      `SELECT amount, category, frequency
       FROM expenses
       WHERE property_id = ? AND is_recurring = 1;`
    )
    .all(propertyId) as Array<{ amount: number; category: string; frequency: string }>;

  const recurring = expandRecurringAllocations(recurringRows);
  const credits = listCreditsByProperty(propertyId);

  const incomeMap = new Map<number, number>(incomeRows.map((r) => [r.month, r.total]));
  const expenseMap = new Map<number, number>(expenseRows.map((r) => [r.month, r.total]));

  const result: MonthlyCashflow[] = [];
  for (let m = 1; m <= 12; m++) {
    const income = incomeMap.get(m) ?? 0;
    const expenses = (expenseMap.get(m) ?? 0) + recurring.monthly[m - 1];
    const creditPayment = sumMonthlyCreditsForMonth(credits, year, m);
    result.push({
      month: m,
      income,
      expenses,
      credit: creditPayment,
      cashflow: income - expenses - creditPayment,
    });
  }

  return result;
}

/**
 * Combine cashflow with vacancy months to produce monthly stats records.
 */
export function listMonthlyStats(propertyId: number, year: number): Array<{
  month: number;
  income: number;
  expense: number;
  credit: number;
  cashflow: number;
  vacancy: number;
}> {
  const cashflow = listCashflowByProperty(propertyId, year);
  const vacancy = listVacancyMonths(propertyId, year);
  const vacancySet = new Set<number>(vacancy.vacantMonths ?? []);

  return cashflow.map((row) => ({
    month: row.month,
    income: row.income,
    expense: row.expenses,
    credit: row.credit,
    cashflow: row.cashflow,
    vacancy: vacancySet.has(row.month) ? 1 : 0,
  }));
}

type AnnualSummary = {
  total_rents_received: number;
  total_expenses: number;
  expense_breakdown: Array<{ category: string; total: number }>;
  gross_yield: number | null;
  net_yield: number | null;
  annual_credit: number;
  vacancy_cost: number;
};

/**
 * Aggregate annual financial metrics for a property including yields and vacancy cost.
 */
export function getPropertyAnnualSummary(propertyId: number, year: number, purchasePrice?: number | null): AnnualSummary {
  const db = getDb();
  markFinishedCreditsInactive();
  const price = purchasePrice ?? (db.prepare(`SELECT purchase_price FROM properties WHERE id = ?;`).get(propertyId) as { purchase_price: number | null } | undefined)?.purchase_price ?? null;

  const rents = db
    .prepare(`SELECT SUM(amount) AS total FROM incomes WHERE property_id = ? AND date >= ? AND date <= ?;`)
    .get(propertyId, `${year}-01-01`, `${year}-12-31`) as { total: number | null };

  const expenses = db
    .prepare(
      `SELECT SUM(amount) AS total FROM expenses WHERE property_id = ? AND date >= ? AND date <= ? AND (is_recurring IS NULL OR is_recurring = 0);`
    )
    .get(propertyId, `${year}-01-01`, `${year}-12-31`) as { total: number | null };

  const breakdown = db
    .prepare(
      `SELECT category, SUM(amount) AS total
       FROM expenses
       WHERE property_id = ? AND date >= ? AND date <= ? AND (is_recurring IS NULL OR is_recurring = 0)
       GROUP BY category
       ORDER BY total DESC;`
    )
    .all(propertyId, `${year}-01-01`, `${year}-12-31`) as Array<{ category: string; total: number }>;

  const recurringRows = db
    .prepare(
      `SELECT amount, category, frequency
       FROM expenses
       WHERE property_id = ? AND is_recurring = 1;`
    )
    .all(propertyId) as Array<{ amount: number; category: string; frequency: string }>;

  const recurring = expandRecurringAllocations(recurringRows);

  const vacancy = listVacancyMonths(propertyId, year);
  const credits = listCreditsByProperty(propertyId);
  const annualCredit = annualCreditForYear(credits, year);

  const totalRents = rents?.total ?? 0;
  const totalExpenses = (expenses?.total ?? 0) + recurring.annual;
  const avgMonthlyRent = totalRents / 12;
  const vacancyCost = avgMonthlyRent * (vacancy.vacantMonths?.length ?? 0);

  const breakdownWithRecurring = [...breakdown];
  Object.entries(recurring.byCategory).forEach(([category, total]) => {
    const existing = breakdownWithRecurring.find((b) => b.category === category);
    if (existing) existing.total += total;
    else breakdownWithRecurring.push({ category, total });
  });

  // Identify non-recoverable buckets often used for net yield
  const propertyTaxes = breakdown.find((b) => b.category === 'taxe_fonciere')?.total ?? 0;
  const insurances = breakdown
    .filter((b) => ['assurance_pno', 'gli', 'assurance'].includes(b.category))
    .reduce((acc, cur) => acc + (cur.total ?? 0), 0);
  const nonRecoverableExpenses = totalExpenses; // placeholder: adjust if recoverable charges are tracked separately

  const gross_yield = price ? (totalRents / price) * 100 : null;
  const net_yield = price ? ((totalRents - nonRecoverableExpenses - propertyTaxes - insurances - annualCredit - vacancyCost) / price) * 100 : null;

  return {
    total_rents_received: totalRents,
    total_expenses: totalExpenses,
    expense_breakdown: breakdownWithRecurring,
    gross_yield,
    net_yield,
    annual_credit: annualCredit,
    vacancy_cost: vacancyCost,
  };
}

/**
 * Compute months without income and derive vacancy rate.
 */
export function listVacancyMonths(propertyId: number, year: number): { vacantMonths: number[]; vacancyRate: number } {
  const db = getDb();
  const incomeRows = db
    .prepare(
      `SELECT DISTINCT CAST(strftime('%m', date) AS INTEGER) AS month
       FROM incomes
       WHERE property_id = ? AND date >= ? AND date <= ?;`
    )
    .all(propertyId, `${year}-01-01`, `${year}-12-31`) as Array<{ month: number }>;

  const incomeMonths = new Set<number>(incomeRows.map((r) => r.month));
  const vacant: number[] = [];
  for (let m = 1; m <= 12; m++) {
    if (!incomeMonths.has(m)) vacant.push(m);
  }

  return { vacantMonths: vacant, vacancyRate: vacant.length / 12 };
}
