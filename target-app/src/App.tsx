import { useEffect } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useSettings } from "./lib/store";
import Login from "./screens/Login";
import TaskList from "./screens/TaskList";
import NewTask from "./screens/NewTask";
import TaskDetail from "./screens/TaskDetail";
import SettingsScreen from "./screens/Settings";

export default function App() {
  const settings = useSettings();
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  return (
    <div className="app">
      <header className="app-header">
        <NavLink to="/tasks" className="brand" data-testid="brand">
          Trackly
        </NavLink>
        <nav className="nav" aria-label="Main">
          <NavLink to="/tasks" data-testid="nav-tasks">
            Tasks
          </NavLink>
          <NavLink to="/tasks/new" data-testid="nav-new">
            New
          </NavLink>
          <NavLink to="/settings" data-testid="nav-settings">
            Settings
          </NavLink>
        </nav>
        <span className="who" data-testid="who">
          {settings.displayName ? `Hi, ${settings.displayName}` : "Not signed in"}
        </span>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/tasks" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/tasks/new" element={<NewTask />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </main>
    </div>
  );
}
