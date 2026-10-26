import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { store } from "../lib/store";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("screens", () => {
  beforeEach(() => store.reset());

  it("shows the empty state and the Add task button", () => {
    renderAt("/tasks");
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("add-task-button")).toBeVisible();
    expect(screen.getByTestId("done-counter")).toHaveTextContent("0 of 0 done");
  });

  it("adds a task through the form and shows the toast", async () => {
    const user = userEvent.setup();
    renderAt("/tasks/new");
    await user.type(screen.getByTestId("title-input"), "Record the demo");
    await user.selectOptions(screen.getByTestId("priority-select"), "high");
    await user.click(screen.getByTestId("save-button"));
    expect(await screen.findByTestId("toast")).toHaveTextContent("Task saved");
    expect(screen.getAllByTestId("task-row")).toHaveLength(1);
    expect(screen.getByTestId("priority-icon")).toHaveAttribute("aria-label", "high priority");
  });

  it("rejects an empty title", async () => {
    const user = userEvent.setup();
    renderAt("/tasks/new");
    await user.click(screen.getByTestId("save-button"));
    expect(screen.getByTestId("form-error")).toHaveTextContent("A title is required.");
  });

  it("toggles done from the list and updates the counter", async () => {
    const user = userEvent.setup();
    store.addTask({ title: "Toggle me" });
    renderAt("/tasks");
    await user.click(screen.getByTestId("task-checkbox"));
    expect(screen.getByTestId("done-counter")).toHaveTextContent("1 of 1 done");
  });

  it("opens the detail page, edits, and deletes", async () => {
    const user = userEvent.setup();
    const t = store.addTask({ title: "Detail me", notes: "some notes" });
    renderAt(`/tasks/${t.id}`);
    expect(screen.getByTestId("detail-title")).toHaveTextContent("Detail me");
    await user.click(screen.getByTestId("edit-button"));
    await user.clear(screen.getByTestId("edit-title-input"));
    await user.type(screen.getByTestId("edit-title-input"), "Edited");
    await user.click(screen.getByTestId("edit-save"));
    expect(screen.getByTestId("detail-title")).toHaveTextContent("Edited");
    await user.click(screen.getByTestId("delete-button"));
    expect(store.getTasks()).toHaveLength(0);
    expect(await screen.findByTestId("toast")).toHaveTextContent("Task deleted");
  });

  it("switches the theme from settings", async () => {
    const user = userEvent.setup();
    renderAt("/settings");
    await user.click(screen.getByTestId("theme-toggle"));
    expect(store.getSettings().theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
