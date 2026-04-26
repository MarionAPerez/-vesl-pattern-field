"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Moment } from "@/lib/types";

interface MomentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (moment: Omit<Moment, "id" | "createdAt">) => void;
}

const TONES: { value: Moment["tone"]; label: string; icon: string }[] = [
  { value: "calm", label: "Calm", icon: "○" },
  { value: "focused", label: "Focused", icon: "◉" },
  { value: "neutral", label: "Neutral", icon: "◌" },
  { value: "anxious", label: "Anxious", icon: "◎" },
  { value: "energized", label: "Energized", icon: "●" },
];

export function MomentForm({ isOpen, onClose, onSubmit }: MomentFormProps) {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const [time, setTime] = useState(currentTime);
  const [tone, setTone] = useState<Moment["tone"]>("neutral");
  const [energy, setEnergy] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ time, tone, energy });
    setTime(currentTime);
    setTone("neutral");
    setEnergy(3);
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

              {/* Time Input */}
              <div className="mb-6">
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-transparent border border-white/10 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Tone Selection */}
              <div className="mb-6">
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

              {/* Energy Level */}
              <div className="mb-8">
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-3">
                  Energy Level
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-white/30">Low</span>
                  <div className="flex-1 flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEnergy(level)}
                        className={`flex-1 h-10 rounded-lg border transition-all ${
                          energy >= level
                            ? "border-white/40 bg-white/20"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-white/30">High</span>
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
