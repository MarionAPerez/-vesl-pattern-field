"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Lock, Layers, RotateCcw, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { WaveCanvas } from "./wave-canvas";
import { MomentForm } from "./moment-form";
import { DayPattern, Moment, ViewMode } from "@/lib/types";
import {
  getTodayKey,
  loadDay,
  addMoment,
  sealDay,
  getAllSealedDays,
  getAllSavedDays,
  clearAllData,
} from "@/lib/storage";

export function PatternField() {
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayKey());
  const [currentPattern, setCurrentPattern] = useState<DayPattern | null>(null);
  const [sealedPatterns, setSealedPatterns] = useState<DayPattern[]>([]);
  const [savedDays, setSavedDays] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const todayKey = getTodayKey();
  const isToday = selectedDate === todayKey;
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    if (isDatePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDatePickerOpen]);

  const refreshData = useCallback(() => {
    setCurrentPattern(loadDay(selectedDate));
    setSealedPatterns(getAllSealedDays());
    setSavedDays(getAllSavedDays());
  }, [selectedDate]);

  useEffect(() => {
    refreshData();
    setIsLoaded(true);
  }, [refreshData]);

  // Navigate to previous day
  const goToPreviousDay = () => {
    const current = new Date(selectedDate + "T12:00:00"); // Noon to avoid timezone issues
    current.setDate(current.getDate() - 1);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const current = new Date(selectedDate + "T12:00:00");
    current.setDate(current.getDate() + 1);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    const newKey = `${year}-${month}-${day}`;
    // Don't allow navigating past today
    if (newKey <= todayKey) {
      setSelectedDate(newKey);
    }
  };

  // Go to today
  const goToToday = () => {
    setSelectedDate(todayKey);
  };

  const handleAddMoment = (moment: Omit<Moment, "id" | "createdAt">) => {
    const updated = addMoment(selectedDate, moment);
    setCurrentPattern(updated);
    setSavedDays(getAllSavedDays());
  };

  const handleSealDay = () => {
    if (!currentPattern || currentPattern.moments.length < 2) {
      return;
    }
    const updated = sealDay(selectedDate);
    setCurrentPattern(updated);
    setSealedPatterns(getAllSealedDays());
  };

  const handleReset = () => {
    if (confirm("Clear all pattern data? This cannot be undone.")) {
      clearAllData();
      refreshData();
    }
  };

  const formatDate = (dateStr: string) => {
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
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
          className="flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
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
                {viewMode === "field" ? (
                  <p className="text-sm text-white/60 mt-1">
                    {sealedPatterns.length} sealed pattern{sealedPatterns.length !== 1 ? "s" : ""}
                  </p>
                ) : (
                  <p className="text-sm text-white/60 mt-1">
                    {formatDate(selectedDate)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentPattern?.sealed && viewMode === "today" && (
                <span className="text-xs text-white/30 flex items-center gap-1">
                  <Lock size={12} />
                  Sealed
                </span>
              )}
            </div>
          </div>

          {/* Date Navigation - only show in today view */}
          {viewMode === "today" && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={goToPreviousDay}
                className="p-2 text-white/40 hover:text-white/80 transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft size={16} />
              </button>

              <div ref={datePickerRef} className="relative">
                <button
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/60 hover:text-white/80 border border-white/10 hover:border-white/20 rounded-full transition-all"
                >
                  <Calendar size={12} />
                  <span>{isToday ? "Today" : formatDate(selectedDate)}</span>
                </button>

                {/* Date Picker Dropdown */}
                <AnimatePresence>
                  {isDatePickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/95 border border-white/10 rounded-lg p-2 z-50 min-w-[160px]"
                    >
                      {!isToday && (
                        <button
                          onClick={() => {
                            goToToday();
                            setIsDatePickerOpen(false);
                          }}
                          className="w-full px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded transition-colors text-left"
                        >
                          Go to Today
                        </button>
                      )}
                      {savedDays.length > 0 && (
                        <>
                          <div className="border-t border-white/10 my-1" />
                          <p className="px-3 py-1 text-[10px] text-white/30 uppercase tracking-wider">
                            Saved Days
                          </p>
                          <div className="max-h-[200px] overflow-y-auto">
                            {savedDays.map((day) => (
                              <button
                                key={day}
                                onClick={() => {
                                  setSelectedDate(day);
                                  setIsDatePickerOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-xs text-left rounded transition-colors flex items-center justify-between ${
                                  day === selectedDate
                                    ? "text-white bg-white/10"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                }`}
                              >
                                <span>{formatDate(day)}</span>
                                {loadDay(day).sealed && <Lock size={10} className="text-white/30" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      {savedDays.length === 0 && isToday && (
                        <p className="px-3 py-2 text-xs text-white/30">No saved days yet</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={goToNextDay}
                disabled={isToday}
                className="p-2 text-white/40 hover:text-white/80 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                aria-label="Next day"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
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
                patterns={currentPattern ? [currentPattern] : []}
                isFieldView={false}
              />

              {/* Empty state */}
              {currentPattern && currentPattern.moments.length === 0 && (
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
      {viewMode === "today" && currentPattern && currentPattern.moments.length > 0 && (
        <div className="flex-shrink-0 px-6 pb-2">
          <div className="flex gap-1 justify-center">
            {currentPattern.moments.map((m) => (
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
                disabled={currentPattern?.sealed}
                className="flex items-center gap-2 px-4 py-2.5 border border-white/20 rounded-full text-sm text-white/70 hover:text-white hover:border-white/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                <span>Moment</span>
              </button>

              {/* Seal Day */}
              <button
                onClick={handleSealDay}
                disabled={
                  currentPattern?.sealed ||
                  !currentPattern ||
                  currentPattern.moments.length < 2
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
