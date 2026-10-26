import { useState, type FormEvent } from "react";
import { store, useSettings, useTasks } from "../lib/store";
import { Toast } from "../lib/ui";

export default function SettingsScreen() {
  const settings = useSettings();
  const tasks = useTasks();
  const [name, setName] = useState(settings.displayName);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    store.updateSettings({ displayName: name.trim() });
    setSaved(true);
  }

  return (
    <section className="card">
      <h1>Settings</h1>
      <div className="profile">
        <img src="/avatar.svg" alt="Your avatar" className="avatar" width={72} height={72} data-testid="avatar" />
        <div>
          <strong data-testid="profile-name">{settings.displayName || "Anonymous"}</strong>
          <p className="muted" data-testid="profile-stats">
            {tasks.length} tasks on this device
          </p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="form settings-form" data-testid="settings-form">
        <label>
          Display name
          <input value={name} onChange={(e) => setName(e.target.value)} data-testid="name-input" />
        </label>
        <label className="switch">
          <span>Dark theme</span>
          <input
            type="checkbox"
            role="switch"
            aria-checked={settings.theme === "dark"}
            checked={settings.theme === "dark"}
            onChange={(e) => store.updateSettings({ theme: e.target.checked ? "dark" : "light" })}
            data-testid="theme-toggle"
          />
        </label>
        <div className="actions">
          <a href="https://github.com/SakkarinKt/eyes-on-qa#readme" className="link" data-testid="help-link">
            Help &amp; docs
          </a>
          <button type="submit" className="btn btn-primary" data-testid="settings-save">
            Save settings
          </button>
        </div>
      </form>
      <button type="button" className="btn btn-danger" onClick={() => store.reset()} data-testid="reset-button">
        Reset all data
      </button>
      {saved && <Toast message="Settings saved" onDone={() => setSaved(false)} />}
    </section>
  );
}
