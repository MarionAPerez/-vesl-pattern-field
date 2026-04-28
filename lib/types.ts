export interface Moment {
  id: string;
  time: string; // HH:MM format
  tone: "energized" | "clear" | "grounded" | "restless" | "heavy";
  energy: number; // 1-5
  createdAt: number;
}

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
