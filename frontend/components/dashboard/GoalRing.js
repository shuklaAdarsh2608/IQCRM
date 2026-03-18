"use client";

import { motion } from "framer-motion";

// Segmented semi‑circular goal gauge, similar to your reference image
export function GoalRing({ value = 0, total = 100, label, subLabel }) {
  const safeTotal = total > 0 ? total : 1;
  const percent = Math.min(Math.max(value / safeTotal, 0), 1);

  const segmentCount = 16;
  const activeSegments = Math.round(segmentCount * percent);

  const radius = 90; // even larger arc inside same box
  const thickness = 20;
  const startAngle = -180;
  const endAngle = 0;
  const sweep = (endAngle - startAngle) / segmentCount;

  const segments = Array.from({ length: segmentCount }).map((_, i) => {
    const angle = startAngle + sweep * i + sweep / 2;
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rOuter = radius;
    const rInner = radius - thickness;

    const x1 = 100 + rOuter * cos;
    const y1 = 100 + rOuter * sin;
    const x2 = 100 + rInner * cos;
    const y2 = 100 + rInner * sin;

    const isActive = i < activeSegments;
    const t = i / Math.max(segmentCount - 1, 1);
    const fromColor = { r: 249, g: 115, b: 22 }; // orange
    const toColor = { r: 168, g: 85, b: 247 }; // violet
    const rCol = Math.round(fromColor.r + (toColor.r - fromColor.r) * t);
    const gCol = Math.round(fromColor.g + (toColor.g - fromColor.g) * t);
    const bCol = Math.round(fromColor.b + (toColor.b - fromColor.b) * t);
    const activeColor = `rgb(${rCol},${gCol},${bCol})`;

    // Inactive segment color tuned for both themes
    const color = isActive ? activeColor : "rgba(148,163,184,0.28)";

    return { x1, y1, x2, y2, color };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-4"
    >
      {/* Subtle glow behind the arc for dark mode clarity */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-2xl opacity-40 dark:opacity-60"
             style={{ background: "radial-gradient(circle, rgba(249,115,22,0.35) 0%, rgba(168,85,247,0.18) 45%, rgba(2,6,23,0) 70%)" }} />
        <svg viewBox="0 0 200 140" className="h-40 w-40">
        {segments.map((seg, idx) => (
          <line
            key={idx}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke={seg.color}
            strokeWidth={6}
            strokeLinecap="round"
          />
        ))}
        </svg>
      </div>
      <div className="mt-[-3rem] flex flex-col items-center">
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          ₹{Math.round(value).toLocaleString()}
        </p>
        {label && (
          <p className="mt-1 text-[11px] text-slate-500 text-center dark:text-slate-300">{label}</p>
        )}
        {subLabel && (
          <p className="mt-1 text-[10px] text-slate-400 text-center dark:text-slate-400">{subLabel}</p>
        )}
      </div>
    </motion.div>
  );
}

