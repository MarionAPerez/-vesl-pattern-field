export interface Moment {
  id: string;
  time: string; // HH:MM format
  tone: "calm" | "focused" | "anxious" | "energized" | "neutral";
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
  calm: "rgba(100, 200, 255, 0.8)",
  focused: "rgba(255, 255, 255, 0.9)",
  anxious: "rgba(255, 150, 150, 0.8)",
  energized: "rgba(255, 220, 100, 0.8)",
  neutral: "rgba(200, 200, 200, 0.7)",
};
