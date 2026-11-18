import test from "node:test";
import assert from "node:assert/strict";
import { activeTasks, completedToday, localDay, makeTask, projects, seed } from "../web/tasks.mjs";

const today = "2026-06-12";
const tomorrow = "2026-06-13";

test("the sample opens with three open tasks for Today and one unscheduled task", () => {
  const initial = seed(today);
  assert.equal(activeTasks(initial, "today", today).length, 3);
  assert.deepEqual(activeTasks(initial, "inbox", today).map(task => task.title), ["Plan a weekend walk"]);
  assert.equal(completedToday(initial, today)[0].title, "Outline the project");
});

test("capture trims the title, preserves the selected project, and rejects invalid entries", () => {
  const task = makeTask("  Sketch the garden map ", projects[1], today, "garden");
  assert.deepEqual(task, { id: "garden", title: "Sketch the garden map", project: "Weekend plans", due: today, done: null });
  for (const title of ["   ", "x".repeat(161)]) assert.throws(() => makeTask(title, projects[0], today, "bad"));
  assert.throws(() => makeTask("Something", "Unknown", today, "bad"));
});

test("open overdue work carries forward; later work and earlier completions stay out", () => {
  const list = seed(today);
  list.push(makeTask("Tomorrow", projects[0], tomorrow, "future"));
  assert.equal(activeTasks(list, "today", today).length, 3);
  assert.deepEqual(activeTasks(list, "today", tomorrow).map(task => task.id), ["update", "review", "daily", "future"]);
  assert.deepEqual(completedToday(list, tomorrow), []);
});

test("the calendar key follows the local date", () => {
  assert.equal(localDay(new Date(2026, 0, 2, 0, 1)), "2026-01-02");
});
