"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Moment, TimePeriod, TIME_PERIOD_LABELS } from "@/lib/types";

interface MomentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (moment: Omit<Moment, "id" | "createdAt">) => void;
}

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: "morning", label: TIME_PERIOD_LABELS.morning },
  { value: "midday", label: TIME_PERIOD_LABELS.midday },
  { value: "afternoon", label: TIME_PERIOD_LABELS.afternoon },
  { value: "night", label: TIME_PERIOD_LABELS.night },
];

const TONES: { value: Moment["tone"]; label: string; icon: string }[] = [
  { value: "energized", label: "Energized", icon: "●" },
  { value: "clear", label: "Clear", icon: "◉" },
  { value: "grounded", label: "Grounded", icon: "○" },
  { value: "restless", label: "Restless", icon: "◎" },
  { value: "heavy", label: "Heavy", icon: "◌" },
];

function getCurrentTimePeriod(): TimePeriod {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "midday";
  if (hour >= 14 && hour < 18) return "afternoon";
  return "night";
}

export function MomentForm({ isOpen, onClose, onSubmit }: MomentFormProps) {
  const [time, setTime] = useState<TimePeriod>(getCurrentTimePeriod);
  const [tone, setTone] = useState<Moment["tone"]>("grounded");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ time, tone });
    setTime(getCurrentTimePeriod());
    setTone("grounded");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-6 md:p-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2"
          >
            <form
              onSubmit={handleSubmit}
              className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-sm mx-auto"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-1 text-white/40 hover:text-white/80 transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-sm tracking-[0.2em] text-white/60 uppercase mb-6">
                Add Moment
              </h2>

              {/* Time Period Selection */}
              <div className="mb-6">
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-3">
                  Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_PERIODS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTime(t.value)}
                      className={`px-3 py-2.5 rounded-lg border transition-all text-sm ${
                        time === t.value
                          ? "border-white/40 bg-white/10 text-white"
                          : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Selection */}
              <div className="mb-8">
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-3">
                  Tone
                </label>
                <div className="flex gap-2 flex-wrap">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                        tone === t.value
                          ? "border-white/40 bg-white/10 text-white"
                          : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                      }`}
                    >
                      <span className="mr-1">{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
              >
                Add to Pattern
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
