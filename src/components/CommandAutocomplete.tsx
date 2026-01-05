import React from 'react';
import { Box, Text } from 'ink';

export interface CommandDefinition {
  name: string;
  description: string;
  usage?: string;
}

export const COMMANDS: CommandDefinition[] = [
  { name: 'task', description: 'Create and execute a new task', usage: '/task' },
  { name: 'cd', description: 'Navigate into a specific task', usage: '/cd <number>' },
  { name: 'link', description: 'Get PR link for a task', usage: '/link <number>' },
  { name: 'update', description: 'Pull latest changes from remote', usage: '/update' },
  { name: 'delete', description: 'Delete one or more tasks', usage: '/delete <number> ...' },
  { name: 'tasks', description: 'Refresh task list', usage: '/tasks' },
  { name: 'config', description: 'Configure settings', usage: '/config [set|get|clear]' },
  { name: 'clear', description: 'Clear output', usage: '/clear' },
  { name: 'help', description: 'Show available commands', usage: '/help' },
  { name: 'exit', description: 'Exit the application', usage: '/exit' },
  { name: 'quit', description: 'Exit the application', usage: '/quit' },
];

export const TASK_DETAIL_COMMANDS: CommandDefinition[] = [
  { name: 'cd', description: 'Go back to main view', usage: '/cd ..' },
  { name: 'link', description: 'Get PR link for current task', usage: '/link' },
  { name: 'update', description: 'Pull latest changes from remote', usage: '/update' },
  { name: 'delete', description: 'Delete current task', usage: '/delete' },
  { name: 'clear', description: 'Clear output', usage: '/clear' },
  { name: 'help', description: 'Show available commands', usage: '/help' },
  { name: 'exit', description: 'Exit the application', usage: '/exit' },
  { name: 'quit', description: 'Exit the application', usage: '/quit' },
];

export function getCommandNames(isTaskDetail: boolean): string[] {
  const commands = isTaskDetail ? TASK_DETAIL_COMMANDS : COMMANDS;
  return commands.map(cmd => cmd.name);
}

export function isValidCommand(input: string, isTaskDetail: boolean): boolean {
  if (!input.startsWith('/')) return false;
  const commandPart = input.slice(1).split(' ')[0];
  const commands = getCommandNames(isTaskDetail);
  return commands.includes(commandPart);
}

interface CommandAutocompleteProps {
  input: string;
  isTaskDetail: boolean;
  visible: boolean;
}

export function CommandAutocomplete({ input, isTaskDetail, visible }: CommandAutocompleteProps) {
  if (!visible) return null;

  const commands = isTaskDetail ? TASK_DETAIL_COMMANDS : COMMANDS;
  const searchTerm = input.slice(1).toLowerCase();

  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().startsWith(searchTerm)
  );

  if (filteredCommands.length === 0) return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      marginBottom={0}
    >
      <Text color="gray" dimColor>Commands:</Text>
      {filteredCommands.map((cmd) => (
        <Box key={cmd.name}>
          <Text color="cyan">/{cmd.name}</Text>
          <Text color="gray"> - {cmd.description}</Text>
        </Box>
      ))}
    </Box>
  );
}
