import Conf from 'conf';
import type { Task, TaskStore } from '../types.js';

interface ConfigStore extends TaskStore {
  nextTaskNumber: number;
}

const config = new Conf<ConfigStore>({
  projectName: 'oneshot',
  defaults: {
    tasks: [],
    nextTaskNumber: 1,
  },
});

export function getAllTasks(): Task[] {
  return config.get('tasks');
}

export function getTask(id: string): Task | undefined {
  const tasks = getAllTasks();
  return tasks.find((t) => t.id === id);
}

export function getTaskByNumber(number: number): Task | undefined {
  const tasks = getAllTasks();
  return tasks.find((t) => t.number === number);
}

export function createTask(name: string, prompt: string, branchName: string, worktreePath: string): Task {
  const tasks = getAllTasks();
  const taskNumber = config.get('nextTaskNumber');

  const task: Task = {
    id: generateId(),
    number: taskNumber,
    name,
    prompt,
    status: 'pending',
    branchName,
    worktreePath,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.push(task);
  config.set('tasks', tasks);
  config.set('nextTaskNumber', taskNumber + 1);

  return task;
}

export function updateTask(id: string, updates: Partial<Task>): Task | undefined {
  const tasks = getAllTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return undefined;

  tasks[index] = {
    ...tasks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  config.set('tasks', tasks);
  return tasks[index];
}

export function deleteTask(id: string): boolean {
  const tasks = getAllTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  if (filtered.length === tasks.length) return false;
  config.set('tasks', filtered);
  return true;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
