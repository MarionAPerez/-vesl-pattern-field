import { DayPattern, Moment } from "./types";

const STORAGE_PREFIX = "vesl_";

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

export function addMoment(dateKey: string, moment: Omit<Moment, "id" | "createdAt">): DayPattern {
  const pattern = loadDay(dateKey);
  if (pattern.sealed) return pattern;

  const newMoment: Moment = {
    ...moment,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  pattern.moments.push(newMoment);
  pattern.moments.sort((a, b) => a.time.localeCompare(b.time));
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
