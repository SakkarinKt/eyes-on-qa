import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { store, useSettings } from "../lib/store";

export default function Login() {
  const settings = useSettings();
  const [name, setName] = useState(settings.displayName);
  const navigate = useNavigate();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    store.updateSettings({ displayName: trimmed });
    navigate("/tasks", { state: { toast: `Welcome, ${trimmed}` } });
  }

  return (
    <section className="card">
      <h1>Sign in</h1>
      <p className="muted">Trackly keeps everything on this device. Pick a display name to get started.</p>
      <form onSubmit={onSubmit} data-testid="login-form" className="form">
        <label>
          Display name
          <input
            data-testid="login-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sakkarin"
            autoComplete="name"
          />
        </label>
        <button type="submit" className="btn btn-primary" data-testid="login-submit" disabled={!name.trim()}>
          Continue
        </button>
      </form>
    </section>
  );
}
