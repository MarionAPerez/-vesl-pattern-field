"use client";

import { useEffect, useRef, useCallback } from "react";
import { DayPattern, Moment, TONE_COLORS } from "@/lib/types";

interface WaveCanvasProps {
  patterns: DayPattern[];
  isFieldView?: boolean;
  className?: string;
}

interface Point {
  x: number;
  y: number;
  tone: Moment["tone"];
  energy: number;
  time: string;
}

function timeToX(time: string, width: number, padding: number = 40): number {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes;
  const ratio = totalMinutes / (24 * 60);
  return padding + ratio * (width - padding * 2);
}

function energyToY(energy: number, height: number, padding: number = 60): number {
  const centerY = height / 2;
  const amplitude = (height - padding * 2) / 2;
  // Energy 1-5 maps to wave position
  const normalizedEnergy = (energy - 3) / 2; // -1 to 1
  return centerY - normalizedEnergy * amplitude * 0.7;
}

function drawSmoothCurve(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  opacity: number,
  useColors: boolean = true
) {
  if (points.length < 2) return;

  ctx.save();
  ctx.beginPath();

  // Start at first point
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    // Use bezier curves for smooth lines
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      const cpx = (current.x + next.x) / 2;
      const cpy1 = current.y;
      const cpy2 = next.y;

      ctx.bezierCurveTo(cpx, cpy1, cpx, cpy2, next.x, next.y);
    }
  }

  // Create gradient along the path
  if (useColors && points.length > 1) {
    const gradient = ctx.createLinearGradient(
      points[0].x,
      0,
      points[points.length - 1].x,
      0
    );
    
    points.forEach((point, i) => {
      const stop = i / (points.length - 1);
      const color = TONE_COLORS[point.tone].replace(/[\d.]+\)$/, `${opacity})`);
      gradient.addColorStop(stop, color);
    });
    
    ctx.strokeStyle = gradient;
  } else {
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
  }

  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}

function drawNodes(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  opacity: number,
  useColors: boolean = true,
  animate: boolean = false,
  time: number = 0
) {
  points.forEach((point, i) => {
    const baseRadius = 4 + point.energy * 0.5;
    const pulseRadius = animate ? baseRadius + Math.sin(time * 0.003 + i) * 1.5 : baseRadius;
    
    // Outer glow
    ctx.save();
    const glowGradient = ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, pulseRadius * 3
    );
    
    const baseColor = useColors ? TONE_COLORS[point.tone] : "rgba(255, 255, 255, 1)";
    const glowColor = baseColor.replace(/[\d.]+\)$/, `${opacity * 0.3})`);
    
    glowGradient.addColorStop(0, glowColor);
    glowGradient.addColorStop(1, "transparent");
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, pulseRadius * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Core node
    ctx.save();
    ctx.beginPath();
    ctx.arc(point.x, point.y, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = useColors 
      ? TONE_COLORS[point.tone].replace(/[\d.]+\)$/, `${opacity})`)
      : `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();
    ctx.restore();
  });
}

export function WaveCanvas({ patterns, isFieldView = false, className = "" }: WaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw time axis hints
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    
    // Draw subtle horizontal center line
    ctx.beginPath();
    ctx.moveTo(40, height / 2);
    ctx.lineTo(width - 40, height / 2);
    ctx.stroke();
    
    // Time markers
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "center";
    
    ["00:00", "06:00", "12:00", "18:00", "24:00"].forEach((time, i) => {
      const x = timeToX(time === "24:00" ? "23:59" : time, width);
      ctx.fillText(time === "24:00" ? "" : time, x, height - 15);
    });
    ctx.restore();

    if (isFieldView) {
      // Field view: draw all sealed patterns
      patterns.forEach((pattern, patternIndex) => {
        const opacity = 0.2 + (patternIndex / Math.max(patterns.length - 1, 1)) * 0.6;
        const points: Point[] = pattern.moments.map((m) => ({
          x: timeToX(m.time, width),
          y: energyToY(m.energy, height),
          tone: m.tone,
          energy: m.energy,
          time: m.time,
        }));

        drawSmoothCurve(ctx, points, opacity * 0.8, false);
        drawNodes(ctx, points, opacity, false, false);
      });
    } else {
      // Today view: draw current pattern with animation
      const todayPattern = patterns[0];
      if (todayPattern && todayPattern.moments.length > 0) {
        const points: Point[] = todayPattern.moments.map((m) => ({
          x: timeToX(m.time, width),
          y: energyToY(m.energy, height),
          tone: m.tone,
          energy: m.energy,
          time: m.time,
        }));

        drawSmoothCurve(ctx, points, 0.9, true);
        drawNodes(ctx, points, 1, true, !todayPattern.sealed, timestamp);
      }
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [patterns, isFieldView]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 signal-line"
      />
    </div>
  );
}
