import { useEffect, useState } from "react";
import type { Priority } from "./store";

export function PriorityIcon({ priority }: { priority: Priority }) {
  // Three distinct glyphs so a wrong icon is visible even when the label is right.
  const glyph = priority === "high" ? "▲" : priority === "medium" ? "◆" : "▽";
  const cls = `priority priority-${priority}`;
  return (
    <span className={cls} role="img" aria-label={`${priority} priority`} data-testid="priority-icon">
      {glyph}
    </span>
  );
}

export function DueBadge({ due }: { due: string }) {
  if (!due) return null;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = due < today;
  return (
    <span className={`badge ${overdue ? "badge-overdue" : "badge-due"}`} data-testid="due-badge">
      {overdue ? "overdue " : "due "}
      {due}
    </span>
  );
}

export function Toast({ message, onDone, ms = 2500 }: { message: string; onDone?: () => void; ms?: number }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, ms);
    return () => window.clearTimeout(t);
  }, [ms, onDone]);
  if (!visible) return null;
  return (
    <div className="toast" role="status" data-testid="toast">
      {message}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      aria-label="progress"
      data-testid="progress-bar"
    >
      <div className="progress-fill" style={{ width: `${v}%` }} />
      <span className="progress-label">{v}%</span>
    </div>
  );
}
