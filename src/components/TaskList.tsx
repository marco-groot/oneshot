import React from 'react';
import { Box, Text } from 'ink';
import type { Task } from '../types.js';
import { getAllTasks } from '../store/tasks.js';

const STATUS_COLORS: Record<Task['status'], string> = {
  pending: 'gray',
  in_progress: 'blue',
  needs_action: 'yellow',
  completed: 'green',
  failed: 'red',
};

const STATUS_ICONS: Record<Task['status'], string> = {
  pending: '○',
  in_progress: '◐',
  needs_action: '⚠',
  completed: '✓',
  failed: '✗',
};

export function TaskList() {
  const tasks = getAllTasks();

  if (tasks.length === 0) {
    return (
      <Box padding={1}>
        <Text color="gray">No tasks found. Create one with: task "your task name"</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Tasks ({tasks.length})
        </Text>
      </Box>

      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </Box>
  );
}

function TaskRow({ task }: { task: Task }) {
  const statusColor = STATUS_COLORS[task.status];
  const statusIcon = STATUS_ICONS[task.status];

  return (
    <Box marginBottom={1}>
      <Box width={5}>
        <Text color="cyan" bold>
          #{task.number}
        </Text>
      </Box>
      <Box width={3}>
        <Text color={statusColor}>{statusIcon}</Text>
      </Box>
      <Box flexGrow={1}>
        <Text>{task.name}</Text>
      </Box>
      <Box width={20}>
        <Text color="gray" dimColor>
          {task.branchName}
        </Text>
      </Box>
      <Box width={15}>
        <Text color={statusColor}>{task.status}</Text>
      </Box>
    </Box>
  );
}
