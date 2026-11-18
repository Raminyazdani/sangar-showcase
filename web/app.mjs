import { activeTasks, completedToday, localDay, makeTask, projects, seed } from "./tasks.mjs";

const key = "sangar.showcase.tasks.v1";
const el = id => document.getElementById(id);
let view = "today";
let canSave = true;
let day = localDay();
let tasks = seed(day);

function reportStorageIssue() {
  canSave = false;
  el("storage-state").textContent = "Session only";
  el("storage-issue").textContent = "Browser storage is unavailable. Changes will last for this visit.";
  el("storage-issue").hidden = false;
}

function save() {
  if (!canSave) return;
  try {
    localStorage.setItem(key, JSON.stringify(tasks));
  } catch {
    reportStorageIssue();
  }
}

function read() {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      tasks = seed(localDay());
      save();
      return;
    }
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || !list.every(task =>
      task && typeof task.id === "string" && typeof task.title === "string" && projects.includes(task.project)
      && [task.due, task.done].every(value => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value))
    )) throw new Error("Invalid task data");
    tasks = list;
  } catch {
    reportStorageIssue();
  }
}

function taskRow(task, completed = false) {
  const row = document.createElement("li");
  const text = document.createElement("div");
  text.className = "task-text";
  const title = document.createElement("span");
  title.className = "task-name";
  title.textContent = task.title;
  const project = document.createElement("span");
  project.className = "task-project";
  project.dataset.project = task.project;
  project.textContent = task.project;
  text.append(title, project);
  const button = document.createElement("button");
  button.type = "button";
  const inbox = view === "inbox";
  const action = inbox ? "Move to Today" : completed ? "Reopen" : "Complete";
  button.setAttribute("aria-label", `${action}: ${task.title}`);
  button.className = inbox ? "move" : "check";
  if (inbox) button.textContent = "Move to Today";
  button.addEventListener("click", () => {
    const current = tasks.find(item => item.id === task.id);
    if (!current) return;
    const today = localDay();
    if (inbox) current.due = today;
    else current.done = completed ? null : today;
    save();
    render();
    el("notice").textContent = `${task.title} — ${inbox ? "moved to Today" : completed ? "reopened" : "completed"}.`;
    const next = el("open-list").querySelector("button") || el("task-title");
    next.focus({ preventScroll: true });
  });
  row.append(...(inbox ? [text, button] : [button, text]));
  return row;
}

function projectCount(project, count) {
  const row = document.createElement("div");
  row.className = "project-row";
  const term = document.createElement("dt");
  const dot = document.createElement("span");
  dot.className = "project-dot";
  dot.dataset.project = project;
  term.append(dot, project);
  const value = document.createElement("dd");
  value.textContent = count;
  row.append(term, value);
  return row;
}

function render() {
  const date = new Date();
  day = localDay(date);
  const open = activeTasks(tasks, view, day);
  const pendingToday = activeTasks(tasks, "today", day);
  const done = completedToday(tasks, day);
  const today = view === "today";
  const label = today ? "Today" : "Inbox";
  document.title = `${label} · Sangar`;
  el("view-title").textContent = label;
  el("dateline").textContent = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  for (const name of ["today", "inbox"]) {
    const nav = el("nav-" + name);
    if (name === view) nav.setAttribute("aria-current", "page");
    else nav.removeAttribute("aria-current");
  }
  el("today-count").textContent = pendingToday.length;
  el("inbox-count").textContent = activeTasks(tasks, "inbox", day).length;
  el("add-task").textContent = "Add to " + label;
  el("list-heading").textContent = today ? "On the list" : "Unscheduled tasks";
  el("open-count").textContent = open.length;
  el("open-list").replaceChildren(...open.map(task => taskRow(task)));
  el("empty-open").textContent = today ? "Your list is clear for today." : "Your inbox is clear.";
  el("empty-open").hidden = open.length > 0;
  el("done-section").hidden = !today || done.length === 0;
  el("done-count").textContent = done.length;
  el("done-list").replaceChildren(...done.map(task => taskRow(task, true)));
  const total = done.length + pendingToday.length;
  const progress = total ? Math.round(100 * done.length / total) : 0;
  el("percent").textContent = progress + "%";
  document.querySelector(".ring").style.setProperty("--progress", progress + "%");
  el("progress-text").textContent = `${done.length} of ${total} tasks complete today`;
  el("project-counts").replaceChildren(...projects.map(project =>
    projectCount(project, open.filter(task => task.project === project).length)
  ));
}

for (const name of ["today", "inbox"]) {
  el("nav-" + name).addEventListener("click", () => {
    view = name;
    render();
  });
}

el("task-title").addEventListener("input", event => event.target.setCustomValidity(""));
el("capture").addEventListener("submit", event => {
  event.preventDefault();
  const input = el("task-title");
  try {
    const task = makeTask(input.value, el("project").value, view === "today" ? localDay() : null);
    tasks.unshift(task);
    save();
    input.value = "";
    render();
    el("notice").textContent = `Added ${task.title}.`;
  } catch (error) {
    input.setCustomValidity(error.message);
    input.reportValidity();
  }
  input.focus();
});

window.addEventListener("storage", event => {
  if (canSave && (event.key === key || event.key === null)) {
    read();
    render();
  }
});
setInterval(() => { if (localDay() !== day) render(); }, 60_000);
read();
render();
