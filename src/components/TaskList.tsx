import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
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

const STATUS_PRIORITY: Record<Task['status'], number> = {
  needs_action: 1,
  in_progress: 2,
  pending: 3,
  failed: 4,
  completed: 5,
};

function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const priorityDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (priorityDiff !== 0) return priorityDiff;
    return a.number - b.number;
  });
}

export function TaskList() {
  const tasks = sortTasksByPriority(getAllTasks());

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

function AnimatedDots() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <Text>{dots}</Text>;
}

function TaskRow({ task }: { task: Task }) {
  const statusColor = STATUS_COLORS[task.status];
  const statusIcon = STATUS_ICONS[task.status];
  const isRunning = task.status === 'in_progress';
  const needsAction = task.status === 'needs_action';

  return (
    <Box marginBottom={1}>
      <Box width={5}>
        <Text color="cyan" bold>
          #{task.number}
        </Text>
      </Box>
      <Box width={3}>
        {isRunning ? (
          <Text color={statusColor}>
            <Spinner type="dots" />
          </Text>
        ) : (
          <Text color={statusColor}>{statusIcon}</Text>
        )}
      </Box>
      <Box width={30}>
        <Text bold={needsAction || isRunning}>{task.name}</Text>
      </Box>
      <Box width={35}>
        {task.prUrl ? (
          <Text color="cyan" dimColor>
            {task.prUrl}
          </Text>
        ) : (
          <Text color="gray" dimColor>
            -
          </Text>
        )}
      </Box>
      <Box width={20}>
        <Text color="gray" dimColor>
          {task.branchName}
        </Text>
      </Box>
      <Box width={15}>
        {isRunning ? (
          <Box>
            <Text color={statusColor}>{task.status}</Text>
            <AnimatedDots />
          </Box>
        ) : (
          <Text color={statusColor} bold={needsAction}>
            {task.status}
          </Text>
        )}
      </Box>
    </Box>
  );
}
