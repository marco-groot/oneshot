#!/usr/bin/env node

import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { runTaskCommand } from './commands/task.js';
import { runTasksCommand } from './commands/tasks.js';
import { setConfig, getConfig, clearConfig, runInteractiveConfig } from './commands/config.js';
import { MainTUI } from './components/MainTUI.js';

const program = new Command();

program
  .name('oneshot')
  .description('CLI tool for managing tasks with Claude AI')
  .version('1.0.0');

program
  .command('task <name>')
  .description('Create and execute a new task with Claude')
  .action(async (name: string) => {
    await runTaskCommand(name);
  });

program
  .command('tasks')
  .description('List all existing tasks')
  .action(async () => {
    await runTasksCommand();
  });

const config = program.command('config').description('Manage configuration');

config
  .action(async () => {
    await runInteractiveConfig();
  });

config
  .command('set <key> <value>')
  .description('Set a configuration value (e.g., apiKey, branchPrefix)')
  .action((key: string, value: string) => {
    setConfig(key, value);
  });

config
  .command('get <key>')
  .description('Get a configuration value')
  .action((key: string) => {
    getConfig(key);
  });

config
  .command('clear <key>')
  .description('Clear a configuration value')
  .action((key: string) => {
    clearConfig(key);
  });

if (process.argv.length === 2) {
  render(React.createElement(MainTUI));
} else {
  program.parse();
}
