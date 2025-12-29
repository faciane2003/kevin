import React, { useEffect, useMemo, useState } from "react";
import "./HUD.css";

type PerfEntry = {
  label: string;
  percent: number;
  value: string;
};

type PerfSnapshot = {
  fps: number;
  updatedAt: number;
  entries: PerfEntry[];
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const PerformanceMonitor: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<PerfSnapshot | null>(null);

  useEffect(() => {
    const onKey = (evt: KeyboardEvent) => {
      if (evt.key.toLowerCase() === "p") setOpen((prev) => !prev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onSnapshot = (evt: Event) => {
      const detail = (evt as CustomEvent<PerfSnapshot>).detail;
      if (!detail) return;
      setSnapshot(detail);
    };
    window.addEventListener("perf-snapshot", onSnapshot as EventListener);
    return () => window.removeEventListener("perf-snapshot", onSnapshot as EventListener);
  }, []);

  const sortedEntries = useMemo(() => {
    if (!snapshot?.entries) return [];
    return [...snapshot.entries].sort((a, b) => b.percent - a.percent).slice(0, 10);
  }, [snapshot]);

  if (!open) return null;

  return (
    <div className="perf-monitor">
      <div className="perf-monitor-header">
        <span>Performance Monitor</span>
        <span className="perf-monitor-fps">
          {snapshot ? `${snapshot.fps.toFixed(0)} fps` : "— fps"}
        </span>
      </div>
      <div className="perf-monitor-body">
        {sortedEntries.length === 0 && <div className="perf-monitor-empty">Waiting for data…</div>}
        {sortedEntries.map((entry) => (
          <div key={entry.label} className="perf-monitor-row">
            <div className="perf-monitor-label">{entry.label}</div>
            <div className="perf-monitor-meter">
              <div
                className="perf-monitor-meter-fill"
                style={{ width: `${clampPercent(entry.percent)}%` }}
              />
            </div>
            <div className="perf-monitor-value">{entry.value}</div>
            <div className="perf-monitor-percent">
              {clampPercent(entry.percent).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
      <div className="perf-monitor-footer">Toggle with P</div>
    </div>
  );
};

export default PerformanceMonitor;
