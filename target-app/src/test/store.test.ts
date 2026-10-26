import { describe, expect, it, beforeEach } from "vitest";
import { doneCount, filterTasks, store } from "../lib/store";

describe("store", () => {
  beforeEach(() => store.reset());

  it("adds, toggles and removes tasks", () => {
    const t = store.addTask({ title: "  Write tests ", priority: "high" });
    expect(t.title).toBe("Write tests");
    expect(store.getTasks()).toHaveLength(1);
    store.toggleTask(t.id);
    expect(store.getTasks()[0].done).toBe(true);
    expect(store.getTasks()[0].progress).toBe(100);
    store.removeTask(t.id);
    expect(store.getTasks()).toHaveLength(0);
  });

  it("persists to localStorage", () => {
    store.addTask({ title: "Persist me" });
    const raw = window.localStorage.getItem("trackly.tasks.v1");
    expect(raw).toContain("Persist me");
  });

  it("filters by status and query", () => {
    const a = store.addTask({ title: "Buy milk" });
    store.addTask({ title: "Ship verifier", notes: "video judge" });
    store.toggleTask(a.id);
    const all = store.getTasks();
    expect(filterTasks(all, "done", "")).toHaveLength(1);
    expect(filterTasks(all, "open", "")).toHaveLength(1);
    expect(filterTasks(all, "all", "judge")).toHaveLength(1);
    expect(doneCount(all)).toEqual({ done: 1, total: 2 });
  });

  it("updates settings", () => {
    store.updateSettings({ displayName: "Sakkarin", theme: "dark" });
    expect(store.getSettings()).toEqual({ displayName: "Sakkarin", theme: "dark" });
  });
});
