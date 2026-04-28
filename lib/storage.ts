import { DayPattern, Moment } from "./types";

const STORAGE_PREFIX = "vesl_";
const MIGRATION_KEY = "vesl_migrated_v1";

// Migrate old UTC-based date keys to local date keys
export function migrateOldData(): void {
  if (typeof window === "undefined") return;
  
  // Only run migration once
  if (localStorage.getItem(MIGRATION_KEY)) return;
  
  const keysToMigrate: { oldKey: string; newKey: string; data: DayPattern }[] = [];
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const dateKey = key.replace(STORAGE_PREFIX, "");
      if (datePattern.test(dateKey)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "");
          if (data && data.moments && data.moments.length > 0) {
            // Check if any moment has a createdAt timestamp we can use
            // to determine the correct local date
            const firstMoment = data.moments[0];
            if (firstMoment.createdAt) {
              const localDate = new Date(firstMoment.createdAt);
              const localKey = getDateKey(localDate);
              
              // If the key differs, we need to migrate
              if (localKey !== dateKey) {
                data.date = localKey;
                keysToMigrate.push({
                  oldKey: key,
                  newKey: STORAGE_PREFIX + localKey,
                  data: data
                });
              }
            }
          }
        } catch {
          // Skip invalid data
        }
      }
    }
  }
  
  // Perform migration
  for (const { oldKey, newKey, data } of keysToMigrate) {
    // Check if destination already has data
    const existing = localStorage.getItem(newKey);
    if (existing) {
      try {
        const existingData = JSON.parse(existing);
        // Merge moments if both have data
        if (existingData.moments && data.moments) {
          const existingIds = new Set(existingData.moments.map((m: Moment) => m.id));
          for (const moment of data.moments) {
            if (!existingIds.has(moment.id)) {
              existingData.moments.push(moment);
            }
          }
          existingData.moments.sort((a: Moment, b: Moment) => a.time.localeCompare(b.time));
          existingData.sealed = existingData.sealed || data.sealed;
          localStorage.setItem(newKey, JSON.stringify(existingData));
        }
      } catch {
        // If merge fails, just save the new data
        localStorage.setItem(newKey, JSON.stringify(data));
      }
    } else {
      localStorage.setItem(newKey, JSON.stringify(data));
    }
    // Remove old key
    localStorage.removeItem(oldKey);
  }
  
  // Mark migration as complete
  localStorage.setItem(MIGRATION_KEY, "true");
}

export function getDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayKey(): string {
  return getDateKey(new Date());
}

export function getAllSavedDays(): string[] {
  if (typeof window === "undefined") return [];

  const days: string[] = [];
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const dateKey = key.replace(STORAGE_PREFIX, "");
      if (datePattern.test(dateKey)) {
        const pattern = loadDay(dateKey);
        if (pattern.moments.length > 0) {
          days.push(dateKey);
        }
      }
    }
  }

  return days.sort((a, b) => b.localeCompare(a)); // Most recent first
}

export function loadDay(dateKey: string): DayPattern {
  if (typeof window === "undefined") {
    return { date: dateKey, moments: [], sealed: false };
  }

  const stored = localStorage.getItem(STORAGE_PREFIX + dateKey);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { date: dateKey, moments: [], sealed: false };
    }
  }
  return { date: dateKey, moments: [], sealed: false };
}

export function saveDay(pattern: DayPattern): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + pattern.date, JSON.stringify(pattern));
}

const TIME_PERIOD_ORDER = ["morning", "midday", "afternoon", "night"];

export function addMoment(dateKey: string, moment: Omit<Moment, "id" | "createdAt">): DayPattern {
  const pattern = loadDay(dateKey);
  if (pattern.sealed) return pattern;

  // Check if moment for this time period already exists - replace it
  const existingIndex = pattern.moments.findIndex((m) => m.time === moment.time);
  
  const newMoment: Moment = {
    ...moment,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  if (existingIndex !== -1) {
    // Replace existing moment for this time period
    pattern.moments[existingIndex] = newMoment;
  } else {
    // Add new moment (max 4 - one per time period)
    pattern.moments.push(newMoment);
  }
  
  // Sort by time period order
  pattern.moments.sort((a, b) => 
    TIME_PERIOD_ORDER.indexOf(a.time) - TIME_PERIOD_ORDER.indexOf(b.time)
  );
  
  saveDay(pattern);
  return pattern;
}

export function sealDay(dateKey: string): DayPattern {
  const pattern = loadDay(dateKey);
  pattern.sealed = true;
  saveDay(pattern);
  return pattern;
}

export function getAllSealedDays(): DayPattern[] {
  if (typeof window === "undefined") return [];

  const days: DayPattern[] = [];
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const dateKey = key.replace(STORAGE_PREFIX, "");
      if (datePattern.test(dateKey)) {
        const pattern = loadDay(dateKey);
        if (pattern.sealed && pattern.moments.length >= 2) {
          days.push(pattern);
        }
      }
    }
  }

  return days.sort((a, b) => a.date.localeCompare(b.date));
}

export function clearAllData(): void {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
