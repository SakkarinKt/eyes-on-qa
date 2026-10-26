import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { doneCount, filterTasks, store, useTasks, type Filter } from "../lib/store";
import { DueBadge, PriorityIcon, Toast } from "../lib/ui";

export default function TaskList() {
  const tasks = useTasks();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const toast = (location.state as { toast?: string } | null)?.toast;
  const visible = filterTasks(tasks, filter, query);
  const counts = doneCount(tasks);

  return (
    <section>
      <div className="toolbar">
        <h1>Tasks</h1>
        <Link to="/tasks/new" className="btn btn-primary" data-testid="add-task-button">
          Add task
        </Link>
      </div>
      <div className="controls">
        <input
          type="search"
          placeholder="Search tasks"
          aria-label="Search tasks"
          data-testid="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter"
          data-testid="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
        >
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="done">Done</option>
        </select>
        <span className="counter" data-testid="done-counter">
          {counts.done} of {counts.total} done
        </span>
      </div>

      {toast && <Toast message={toast} onDone={() => navigate(location.pathname, { replace: true, state: null })} />}

      {tasks.length === 0 ? (
        <div className="empty" data-testid="empty-state">
          <div className="empty-art" aria-hidden="true">
            ✓
          </div>
          <p>No tasks yet. Add your first task to get going.</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="muted" data-testid="no-match">
          Nothing matches that search.
        </p>
      ) : (
        <ul className="task-list" data-testid="task-list">
          {visible.map((t) => (
            <li key={t.id} className={`task-row ${t.done ? "is-done" : ""}`} data-testid="task-row">
              <label className="check">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => store.toggleTask(t.id)}
                  aria-label={`Mark ${t.title} ${t.done ? "open" : "done"}`}
                  data-testid="task-checkbox"
                />
                <span className="check-box" aria-hidden="true" />
              </label>
              <PriorityIcon priority={t.priority} />
              <Link to={`/tasks/${t.id}`} className="task-title" data-testid="task-title">
                {t.title}
              </Link>
              <DueBadge due={t.due} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
