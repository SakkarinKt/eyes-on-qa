import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { store, type Priority } from "../lib/store";

export default function NewTask() {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    store.addTask({ title, priority, due, notes });
    navigate("/tasks", { state: { toast: "Task saved" } });
  }

  return (
    <section className="card">
      <h1>New task</h1>
      <form onSubmit={onSubmit} className="form" aria-label="New task" data-testid="new-task-form">
        <label>
          Title
          <input
            data-testid="title-input"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            placeholder="What needs doing?"
            autoFocus
          />
        </label>
        {error && (
          <p className="error" role="alert" data-testid="form-error">
            {error}
          </p>
        )}
        <div className="row">
          <label>
            Priority
            <select
              data-testid="priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            Due
            <input type="date" data-testid="due-input" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
        </div>
        <label>
          Notes
          <textarea data-testid="notes-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>
        <div className="actions">
          <button type="button" className="btn" onClick={() => navigate("/tasks")} data-testid="cancel-button">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" data-testid="save-button">
            Save
          </button>
        </div>
      </form>
    </section>
  );
}
