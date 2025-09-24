"use client";

import { useEffect, useMemo, useRef } from "react";
import type { BackgroundTask } from "@/lib/schemas";

export function useProgressTracking(activeTasks: BackgroundTask[], isPending: boolean, isPolling: boolean) {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const aggregatedProgress = useMemo(() => {
    if (activeTasks.length === 0) {
      return { mode: "idle" as const, percent: 0, phase: null };
    }

    // Check if any task is in link collection phase
    const isLinkCollection = activeTasks.some(task => task.progress.phase === 'link-collection');
    const phase = isLinkCollection ? 'link-collection' : 'job-analysis';

    const totalCompleted = activeTasks.reduce(
      (acc, task) => {
        const completed = acc.completed + (task.progress.completed ?? 0);
        const totalBaseline = Math.max(
          task.progress.total ?? 0,
          (task.progress.completed ?? 0) + task.errors.length,
        );
        return {
          completed,
          total: acc.total + totalBaseline,
        };
      },
      { completed: 0, total: 0 },
    );

    if (totalCompleted.total === 0) {
      return { mode: "indeterminate" as const, percent: 0, phase };
    }

    const percent = Math.min(1, totalCompleted.completed / totalCompleted.total);
    return { mode: "determinate" as const, percent, phase };
  }, [activeTasks]);

  const progressLabel = useMemo(() => {
    if (activeTasks.length === 0) {
      return null;
    }

    // Check if any task is in link collection phase
    const isLinkCollection = activeTasks.some(task => task.progress.phase === 'link-collection');
    
    if (isLinkCollection) {
      const linkCollectionTask = activeTasks.find(task => task.progress.phase === 'link-collection');
      if (linkCollectionTask?.progress.message) {
        return linkCollectionTask.progress.message;
      }
      return "Collecting job links...";
    }

    const totals = activeTasks.reduce(
      (acc, task) => ({
        completed: acc.completed + (task.progress.completed ?? 0),
        total: acc.total + (task.progress.total ?? 0),
      }),
      { completed: 0, total: 0 },
    );

    if (totals.total === 0) {
      return "Analyzing jobs...";
    }

    return `${totals.completed}/${totals.total}`;
  }, [activeTasks]);

  const showLoadingBar = isPending || isPolling || activeTasks.length > 0;

  // Set progress bar width programmatically to avoid inline styles
  useEffect(() => {
    if (progressBarRef.current && aggregatedProgress.mode === "determinate") {
      const width = Math.min(100, Math.max(5, aggregatedProgress.percent * 100));
      progressBarRef.current.style.width = `${width}%`;
    }
  }, [aggregatedProgress]);

  return {
    aggregatedProgress,
    progressLabel,
    showLoadingBar,
    progressBarRef,
  };
}
