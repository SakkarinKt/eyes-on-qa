// Trackly state: a tiny external store persisted to localStorage.
// Built during the Meta Global AI Developer Hackathon 2026 as the app Eyes-On QA's agents work on.
import { useSyncExternalStore } from "react";

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  due: string; // YYYY-MM-DD or ""
  done: boolean;
  progress: number; // 0..100
  createdAt: number;
}

export interface Settings {
  displayName: string;
  theme: "light" | "dark";
}

const TASKS_KEY = "trackly.tasks.v1";
const SETTINGS_KEY = "trackly.settings.v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep in memory only */
  }
}

let tasks: Task[] = read<Task[]>(TASKS_KEY, []);
let settings: Settings = read<Settings>(SETTINGS_KEY, { displayName: "", theme: "light" });
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function newId(): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const store = {
  getTasks: (): Task[] => tasks,
  getSettings: (): Settings => settings,
  subscribe,
  addTask(input: Pick<Task, "title"> & Partial<Omit<Task, "id" | "createdAt">>): Task {
    const task: Task = {
      id: newId(),
      title: input.title.trim(),
      notes: input.notes ?? "",
      priority: input.priority ?? "medium",
      due: input.due ?? "",
      done: input.done ?? false,
      progress: input.progress ?? 0,
      createdAt: Date.now(),
    };
    tasks = [task, ...tasks];
    write(TASKS_KEY, tasks);
    emit();
    return task;
  },
  updateTask(id: string, patch: Partial<Omit<Task, "id" | "createdAt">>): void {
    tasks = tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    write(TASKS_KEY, tasks);
    emit();
  },
  toggleTask(id: string): void {
    tasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done, progress: t.done ? t.progress : 100 } : t));
    write(TASKS_KEY, tasks);
    emit();
  },
  removeTask(id: string): void {
    tasks = tasks.filter((t) => t.id !== id);
    write(TASKS_KEY, tasks);
    emit();
  },
  updateSettings(patch: Partial<Settings>): void {
    settings = { ...settings, ...patch };
    write(SETTINGS_KEY, settings);
    emit();
  },
  reset(): void {
    tasks = [];
    settings = { displayName: "", theme: "light" };
    write(TASKS_KEY, tasks);
    write(SETTINGS_KEY, settings);
    emit();
  },
};

export function useTasks(): Task[] {
  return useSyncExternalStore(subscribe, store.getTasks, store.getTasks);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, store.getSettings, store.getSettings);
}

export type Filter = "all" | "open" | "done";

export function filterTasks(list: Task[], filter: Filter, query: string): Task[] {
  const q = query.trim().toLowerCase();
  return list.filter((t) => {
    if (filter === "open" && t.done) return false;
    if (filter === "done" && !t.done) return false;
    return q === "" || t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q);
  });
}

export function doneCount(list: Task[]): { done: number; total: number } {
  return { done: list.filter((t) => t.done).length, total: list.length };
}
