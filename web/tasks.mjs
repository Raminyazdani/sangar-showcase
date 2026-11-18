export const projects = ["Project launch", "Weekend plans"];

// A calendar date in the user's timezone, including around UTC midnight.
export function localDay(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function seed(today) {
  return [
    { id: "update", title: "Prepare the project update", project: projects[0], due: today, done: null },
    { id: "review", title: "Review the draft", project: projects[0], due: today, done: null },
    { id: "daily", title: "Daily planning", project: projects[1], due: today, done: null },
    { id: "outline", title: "Outline the project", project: projects[0], due: today, done: today },
    { id: "walk", title: "Plan a weekend walk", project: projects[1], due: null, done: null },
  ];
}

export function makeTask(title, project, due, id = crypto.randomUUID()) {
  const cleanTitle = title.trim();
  if (!cleanTitle || cleanTitle.length > 160) throw new Error("Use a task title of 1 to 160 characters.");
  if (!projects.includes(project)) throw new Error("Choose a listed project.");
  return { id, title: cleanTitle, project, due, done: null };
}

export function activeTasks(tasks, view, today) {
  return tasks.filter(task => !task.done && (view === "inbox" ? !task.due : task.due && task.due <= today));
}

export function completedToday(tasks, today) {
  return tasks.filter(task => task.done === today);
}
