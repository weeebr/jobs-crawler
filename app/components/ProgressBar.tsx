"use client";

import { forwardRef } from "react";

interface ProgressBarProps {
  show: boolean;
  mode: "idle" | "determinate" | "indeterminate";
  percent: number;
  phase?: 'link-collection' | 'job-analysis' | null;
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ show, mode, percent, phase }, ref) => {
    if (!show) return null;

    const getProgressBarColor = () => {
      if (phase === 'link-collection') {
        return "bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-400";
      }
      return "bg-gradient-to-r from-blue-500 via-sky-500 to-teal-400";
    };

    return (
      <div className="fixed inset-x-0 top-0 z-[60]">
        <div className="h-1 bg-slate-200/70">
          {mode === "determinate" ? (
            <div
              ref={ref}
              className={`h-1 ${getProgressBarColor()} transition-[width] duration-200 ease-out`}
              style={{ width: `${percent}%` }}
            />
          ) : (
            <div className="relative h-1 overflow-hidden">
              <span className="loading-bar-indicator" />
            </div>
          )}
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";
