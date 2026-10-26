import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { store, useTasks, type Priority } from "../lib/store";
import { DueBadge, PriorityIcon, ProgressBar } from "../lib/ui";

export default function TaskDetail() {
  const { id = "" } = useParams();
  const tasks = useTasks();
  const task = tasks.find((t) => t.id === id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [draftPriority, setDraftPriority] = useState<Priority>("medium");

  if (!task) {
    return (
      <section className="card">
        <p className="muted" data-testid="not-found">
          That task does not exist.
        </p>
        <button className="btn" onClick={() => navigate("/tasks")} data-testid="back-button">
          Back to tasks
        </button>
      </section>
    );
  }

  function openEdit() {
    if (!task) return;
    setDraftTitle(task.title);
    setDraftNotes(task.notes);
    setDraftPriority(task.priority);
    setEditing(true);
  }

  function saveEdit() {
    if (!task || !draftTitle.trim()) return;
    store.updateTask(task.id, { title: draftTitle.trim(), notes: draftNotes, priority: draftPriority });
    setEditing(false);
  }

  function remove() {
    if (!task) return;
    store.removeTask(task.id);
    navigate("/tasks", { state: { toast: "Task deleted" } });
  }

  return (
    <section className="card detail">
      <div className="toolbar">
        <button className="btn" onClick={() => navigate("/tasks")} data-testid="back-button">
          ← Back
        </button>
        <div className="actions">
          <button className="btn" onClick={openEdit} data-testid="edit-button">
            Edit
          </button>
          <button className="btn btn-danger" onClick={remove} data-testid="delete-button">
            Delete
          </button>
        </div>
      </div>
      <h1 className={task.done ? "is-done" : ""} data-testid="detail-title">
        {task.title}
      </h1>
      <p className="meta">
        <PriorityIcon priority={task.priority} /> <span data-testid="priority-label">{task.priority} priority</span>{" "}
        <DueBadge due={task.due} />
      </p>
      {task.notes && (
        <p className="notes" data-testid="detail-notes">
          {task.notes}
        </p>
      )}
      <label className="progress-control">
        Progress
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={task.progress}
          onChange={(e) => store.updateTask(task.id, { progress: Number(e.target.value) })}
          data-testid="progress-input"
        />
      </label>
      <ProgressBar value={task.progress} />
      <label className="check inline">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => store.toggleTask(task.id)}
          data-testid="detail-done"
        />
        <span className="check-box" aria-hidden="true" />
        <span>Done</span>
      </label>

      {editing && (
        <div className="backdrop" data-testid="edit-backdrop">
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="edit-title" data-testid="edit-dialog">
            <div className="dialog-head">
              <h2 id="edit-title">Edit task</h2>
              <button className="btn btn-icon" aria-label="Close" onClick={() => setEditing(false)} data-testid="dialog-close">
                ×
              </button>
            </div>
            <label>
              Title
              <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} data-testid="edit-title-input" />
            </label>
            <label>
              Priority
              <select value={draftPriority} onChange={(e) => setDraftPriority(e.target.value as Priority)} data-testid="edit-priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Notes
              <textarea value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} rows={3} data-testid="edit-notes" />
            </label>
            <div className="actions">
              <button className="btn" onClick={() => setEditing(false)} data-testid="edit-cancel">
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveEdit} data-testid="edit-save">
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
