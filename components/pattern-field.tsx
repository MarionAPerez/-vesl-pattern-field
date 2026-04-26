"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Lock, Layers, RotateCcw, ChevronLeft } from "lucide-react";
import { WaveCanvas } from "./wave-canvas";
import { MomentForm } from "./moment-form";
import { DayPattern, Moment, ViewMode } from "@/lib/types";
import {
  getDateKey,
  loadDay,
  addMoment,
  sealDay,
  getAllSealedDays,
  clearAllData,
} from "@/lib/storage";

export function PatternField() {
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [todayPattern, setTodayPattern] = useState<DayPattern | null>(null);
  const [sealedPatterns, setSealedPatterns] = useState<DayPattern[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const todayKey = getDateKey();

  const refreshData = useCallback(() => {
    setTodayPattern(loadDay(todayKey));
    setSealedPatterns(getAllSealedDays());
  }, [todayKey]);

  useEffect(() => {
    refreshData();
    setIsLoaded(true);
  }, [refreshData]);

  const handleAddMoment = (moment: Omit<Moment, "id" | "createdAt">) => {
    const updated = addMoment(todayKey, moment);
    setTodayPattern(updated);
  };

  const handleSealDay = () => {
    if (!todayPattern || todayPattern.moments.length < 2) {
      return;
    }
    const updated = sealDay(todayKey);
    setTodayPattern(updated);
    setSealedPatterns(getAllSealedDays());
  };

  const handleReset = () => {
    if (confirm("Clear all pattern data? This cannot be undone.")) {
      clearAllData();
      refreshData();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            {viewMode === "field" && (
              <button
                onClick={() => setViewMode("today")}
                className="p-2 text-white/40 hover:text-white/80 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h1 className="text-[10px] tracking-[0.3em] text-white/40 uppercase">
                VESL / Pattern Field
              </h1>
              <p className="text-sm text-white/60 mt-1">
                {viewMode === "today"
                  ? formatDate(todayKey)
                  : `${sealedPatterns.length} sealed patterns`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {todayPattern?.sealed && viewMode === "today" && (
              <span className="text-xs text-white/30 flex items-center gap-1">
                <Lock size={12} />
                Sealed
              </span>
            )}
          </div>
        </motion.div>
      </header>

      {/* Canvas Area */}
      <main className="flex-1 relative min-h-[300px] md:min-h-[400px]">
        <AnimatePresence mode="wait">
          {viewMode === "today" ? (
            <motion.div
              key="today"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <WaveCanvas
                patterns={todayPattern ? [todayPattern] : []}
                isFieldView={false}
              />

              {/* Empty state */}
              {todayPattern && todayPattern.moments.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/20 text-sm">
                    Add your first moment
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="field"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <WaveCanvas patterns={sealedPatterns} isFieldView={true} />

              {/* Empty state */}
              {sealedPatterns.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/20 text-sm text-center">
                    No sealed patterns yet.
                    <br />
                    Seal a day to see it here.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Moment Indicators */}
      {viewMode === "today" && todayPattern && todayPattern.moments.length > 0 && (
        <div className="flex-shrink-0 px-6 pb-2">
          <div className="flex gap-1 justify-center">
            {todayPattern.moments.map((m) => (
              <div
                key={m.id}
                className="w-1.5 h-1.5 rounded-full bg-white/30"
                title={`${m.time} - ${m.tone} (${m.energy})`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <footer className="flex-shrink-0 p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-3"
        >
          {viewMode === "today" && (
            <>
              {/* Add Moment */}
              <button
                onClick={() => setIsFormOpen(true)}
                disabled={todayPattern?.sealed}
                className="flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-full text-sm text-white/70 hover:text-white hover:border-white/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                <span>Moment</span>
              </button>

              {/* Seal Day */}
              <button
                onClick={handleSealDay}
                disabled={
                  todayPattern?.sealed ||
                  !todayPattern ||
                  todayPattern.moments.length < 2
                }
                className="flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-full text-sm text-white/70 hover:text-white hover:border-white/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Lock size={14} />
                <span>Seal</span>
              </button>

              {/* View Field */}
              <button
                onClick={() => setViewMode("field")}
                className="flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-full text-sm text-white/70 hover:text-white hover:border-white/40 transition-all"
              >
                <Layers size={14} />
                <span>Field</span>
              </button>
            </>
          )}

          {viewMode === "field" && (
            <button
              onClick={() => setViewMode("today")}
              className="flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-full text-sm text-white/70 hover:text-white hover:border-white/40 transition-all"
            >
              <span>Back to Today</span>
            </button>
          )}

          {/* Reset - subtle */}
          <button
            onClick={handleReset}
            className="p-2.5 text-white/20 hover:text-white/50 transition-colors"
            title="Clear all data"
          >
            <RotateCcw size={14} />
          </button>
        </motion.div>
      </footer>

      {/* Moment Form Modal */}
      <MomentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddMoment}
      />
    </div>
  );
}
