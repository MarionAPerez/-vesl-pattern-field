export type TimePeriod = "morning" | "midday" | "afternoon" | "night";

export interface Moment {
  id: string;
  time: TimePeriod;
  tone: "energized" | "clear" | "grounded" | "restless" | "heavy";
  energy: number; // 1-5
  createdAt: number;
}

// Map time periods to positions (0-1 range for canvas positioning)
export const TIME_PERIOD_POSITIONS: Record<TimePeriod, number> = {
  morning: 0.15,    // ~6am
  midday: 0.4,      // ~12pm
  afternoon: 0.6,   // ~3pm
  night: 0.85,      // ~9pm
};

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  night: "Night",
};

export interface DayPattern {
  date: string; // YYYY-MM-DD
  moments: Moment[];
  sealed: boolean;
}

export type ViewMode = "today" | "field";

export const TONE_COLORS: Record<Moment["tone"], string> = {
  energized: "rgba(255, 220, 100, 0.8)",   // warm gold - high positive
  clear: "rgba(255, 255, 255, 0.9)",       // bright white - mid positive
  grounded: "rgba(160, 200, 180, 0.8)",    // sage green - stable positive
  restless: "rgba(255, 150, 130, 0.8)",    // soft coral - high negative
  heavy: "rgba(140, 140, 160, 0.6)",       // muted slate - low negative
};
