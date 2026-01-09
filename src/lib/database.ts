import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;
let SQL: any = null;

const DB_NAME = 'time-tracker-db';

/**
 * Initialize the SQL.js library and database
 */
export async function initDatabase(): Promise<Database> {
  if (db) return db;

  // Initialize SQL.js
  SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`
  });

  // Try to load existing database from localStorage
  const savedDb = localStorage.getItem(DB_NAME);

  if (savedDb) {
    // Load existing database
    const uint8Array = new Uint8Array(JSON.parse(savedDb));
    db = new SQL.Database(uint8Array);
  } else {
    // Create new database
    db = new SQL.Database();
    createSchema(db);
  }

  return db;
}

/**
 * Create database schema
 */
function createSchema(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS tracked_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL CHECK(length(name) >= 1 AND length(name) <= 140),
      state TEXT NOT NULL CHECK(state IN ('in_progress', 'completed', 'archived')),
      start_time INTEGER NOT NULL,
      start_timezone TEXT NOT NULL,
      start_timezone_offset INTEGER NOT NULL,
      completed_time INTEGER,
      completed_timezone TEXT,
      completed_timezone_offset INTEGER,
      archived_time INTEGER,
      last_edited_time INTEGER NOT NULL,
      CHECK(completed_time IS NULL OR completed_time > start_time),
      CHECK(archived_time IS NULL OR archived_time > completed_time),
      CHECK(
        (state = 'in_progress' AND completed_time IS NULL AND archived_time IS NULL) OR
        (state = 'completed' AND completed_time IS NOT NULL AND archived_time IS NULL) OR
        (state = 'archived' AND completed_time IS NOT NULL AND archived_time IS NOT NULL)
      )
    );
  `);

  database.run(`
    CREATE INDEX IF NOT EXISTS idx_tracked_items_state ON tracked_items(state);
  `);

  database.run(`
    CREATE INDEX IF NOT EXISTS idx_tracked_items_last_edited ON tracked_items(last_edited_time DESC);
  `);
}

/**
 * Save database to localStorage
 */
export function saveDatabase() {
  if (!db) return;

  const data = db.export();
  const array = Array.from(data);
  localStorage.setItem(DB_NAME, JSON.stringify(array));
}

/**
 * Get the current database instance
 */
export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get current Unix epoch timestamp (seconds)
 */
export function getCurrentUnixEpoch(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Get current UTC offset in seconds
 */
export function getCurrentTimezoneOffset(): number {
  const offsetMinutes = new Date().getTimezoneOffset();
  return -offsetMinutes * 60; // Negative because getTimezoneOffset returns opposite sign
}

/**
 * Get current timezone abbreviation
 */
export function getCurrentTimezoneAbbrev(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' });
    const parts = formatter.formatToParts(new Date());
    const timezonePart = parts.find((part) => part.type === 'timeZoneName');
    return timezonePart ? timezonePart.value : 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Format Unix epoch timestamp with timezone offset
 */
export function formatTime(
  unixEpoch: number,
  timezoneOffset: number,
  timezoneAbbrev: string
): string {
  const localTime = unixEpoch + timezoneOffset;
  const dateObj = new Date(localTime * 1000); // Convert to milliseconds

  const month = dateObj.getUTCMonth();
  const day = dateObj.getUTCDate();
  const hours = dateObj.getUTCHours();
  const minutes = dateObj.getUTCMinutes();

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');

  return `${monthNames[month]} ${day}, ${hoursStr}:${minutesStr} ${timezoneAbbrev}`;
}

/**
 * Format duration in seconds to HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secsStr = secs.toString().padStart(2, '0');

  return `${hoursStr}:${minutesStr}:${secsStr}`;
}

/**
 * Validate item name
 */
export function validateItemName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Name cannot be blank' };
  }

  if (trimmed.length > 140) {
    return { valid: false, error: 'Name cannot exceed 140 characters' };
  }

  return { valid: true };
}

export interface TrackedItem {
  id: string;
  name: string;
  state: 'in_progress' | 'completed' | 'archived';
  start_time: number;
  start_timezone: string;
  start_timezone_offset: number;
  completed_time: number | null;
  completed_timezone: string | null;
  completed_timezone_offset: number | null;
  archived_time?: number | null;
  last_edited_time?: number;
}

/**
 * Create a new tracked item
 */
export function createItem(name: string): TrackedItem {
  const db = getDatabase();

  const validation = validateItemName(name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const id = generateUUID();
  const trimmedName = name.trim();
  const now = getCurrentUnixEpoch();
  const timezone = getCurrentTimezoneAbbrev();
  const offset = getCurrentTimezoneOffset();

  db.run(
    `INSERT INTO tracked_items (
      id, name, state, start_time, start_timezone, start_timezone_offset,
      completed_time, completed_timezone, completed_timezone_offset,
      archived_time, last_edited_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, trimmedName, 'in_progress', now, timezone, offset, null, null, null, null, now]
  );

  saveDatabase();

  return {
    id,
    name: trimmedName,
    state: 'in_progress',
    start_time: now,
    start_timezone: timezone,
    start_timezone_offset: offset,
    completed_time: null,
    completed_timezone: null,
    completed_timezone_offset: null,
    archived_time: null,
    last_edited_time: now
  };
}

/**
 * Complete an item
 */
export function completeItem(itemId: string): void {
  const db = getDatabase();

  const now = getCurrentUnixEpoch();
  const timezone = getCurrentTimezoneAbbrev();
  const offset = getCurrentTimezoneOffset();

  db.run(
    `UPDATE tracked_items
     SET state = 'completed',
         completed_time = ?,
         completed_timezone = ?,
         completed_timezone_offset = ?,
         last_edited_time = ?
     WHERE id = ? AND state = 'in_progress'`,
    [now, timezone, offset, now, itemId]
  );

  saveDatabase();
}

/**
 * Archive an item
 */
export function archiveItem(itemId: string): void {
  const db = getDatabase();

  const now = getCurrentUnixEpoch();

  db.run(
    `UPDATE tracked_items
     SET state = 'archived',
         archived_time = ?,
         last_edited_time = ?
     WHERE id = ? AND state = 'completed'`,
    [now, now, itemId]
  );

  saveDatabase();
}

/**
 * Unarchive an item
 */
export function unarchiveItem(itemId: string): void {
  const db = getDatabase();

  const now = getCurrentUnixEpoch();

  db.run(
    `UPDATE tracked_items
     SET state = 'completed',
         last_edited_time = ?
     WHERE id = ? AND state = 'archived'`,
    [now, itemId]
  );

  saveDatabase();
}

/**
 * Delete an item
 */
export function deleteItem(itemId: string): void {
  const db = getDatabase();

  db.run(
    `DELETE FROM tracked_items
     WHERE id = ? AND state = 'archived'`,
    [itemId]
  );

  saveDatabase();
}

/**
 * Get items for main view
 */
export function getMainViewItems(): TrackedItem[] {
  const db = getDatabase();

  const result = db.exec(
    `SELECT id, name, state, start_time, start_timezone, start_timezone_offset,
            completed_time, completed_timezone, completed_timezone_offset, last_edited_time
     FROM tracked_items
     WHERE state IN ('in_progress', 'completed')
     ORDER BY last_edited_time DESC`
  );

  if (result.length === 0) return [];

  return result[0].values.map((row: any[]) => ({
    id: row[0] as string,
    name: row[1] as string,
    state: row[2] as 'in_progress' | 'completed',
    start_time: row[3] as number,
    start_timezone: row[4] as string,
    start_timezone_offset: row[5] as number,
    completed_time: row[6] as number | null,
    completed_timezone: row[7] as string | null,
    completed_timezone_offset: row[8] as number | null,
    last_edited_time: row[9] as number
  }));
}

/**
 * Get items for archive view
 */
export function getArchiveViewItems(): TrackedItem[] {
  const db = getDatabase();

  const result = db.exec(
    `SELECT id, name, start_time, start_timezone, start_timezone_offset,
            completed_time, completed_timezone, completed_timezone_offset, last_edited_time
     FROM tracked_items
     WHERE state = 'archived'
     ORDER BY last_edited_time DESC`
  );

  if (result.length === 0) return [];

  return result[0].values.map((row: any[]) => ({
    id: row[0] as string,
    name: row[1] as string,
    state: 'archived' as const,
    start_time: row[2] as number,
    start_timezone: row[3] as string,
    start_timezone_offset: row[4] as number,
    completed_time: row[5] as number,
    completed_timezone: row[6] as string,
    completed_timezone_offset: row[7] as number,
    last_edited_time: row[8] as number
  }));
}

/**
 * Get all items for export
 */
export function getAllItemsForExport() {
  const db = getDatabase();

  const result = db.exec(
    `SELECT id, name, state, start_time, start_timezone, start_timezone_offset,
            completed_time, completed_timezone, completed_timezone_offset,
            archived_time, last_edited_time
     FROM tracked_items
     ORDER BY last_edited_time DESC`
  );

  if (result.length === 0) return [];

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    name: row[1],
    state: row[2],
    start_time: row[3],
    start_timezone: row[4],
    start_timezone_offset: row[5],
    completed_time: row[6],
    completed_timezone: row[7],
    completed_timezone_offset: row[8],
    archived_time: row[9],
    last_edited_time: row[10]
  }));
}

/**
 * Export all data to JSON
 */
export function exportData(): string {
  const items = getAllItemsForExport();
  const exportTimestamp = getCurrentUnixEpoch();

  const exportData = {
    export_timestamp: exportTimestamp,
    items
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Download export as file
 */
export function downloadExport(): void {
  const data = exportData();
  const timestamp = getCurrentUnixEpoch();
  const filename = `time-tracker-export-${timestamp}.json`;

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
