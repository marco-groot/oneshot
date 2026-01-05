import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { Task } from '../types.js';

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

function AnimatedStatusDots() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return <Text color="blue">{dots}</Text>;
}

function WaitingAnimation() {
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

  return (
    <Box>
      <Text color="blue">
        <Spinner type="dots" />
      </Text>
      <Text color="blue"> Waiting for Claude to start</Text>
      <Text color="blue">{dots}</Text>
    </Box>
  );
}

interface TaskDetailViewProps {
  task: Task;
}

export function TaskDetailView({ task }: TaskDetailViewProps) {
  const statusColor = STATUS_COLORS[task.status];
  const statusIcon = STATUS_ICONS[task.status];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text dimColor>Branch: </Text>
        <Text>{task.branchName}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>Worktree: </Text>
        <Text color="gray">{task.worktreePath}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>Status: </Text>
        {task.status === 'in_progress' ? (
          <Box>
            <Text color={statusColor}>
              <Spinner type="dots" />
            </Text>
            <Text color={statusColor}> {task.status}</Text>
            <AnimatedStatusDots />
          </Box>
        ) : (
          <Text color={statusColor}>
            {statusIcon} {task.status}
          </Text>
        )}
        {task.prUrl && (
          <>
            <Text dimColor> • PR: </Text>
            <Text color="cyan">{task.prUrl}</Text>
          </>
        )}
      </Box>

      {(task.logs || task.status === 'in_progress') && (
        <>
          <Box marginBottom={1} marginTop={1}>
            <Text bold underline color="cyan">
              Claude Logs:
            </Text>
          </Box>
          <Box
            marginBottom={1}
            paddingLeft={2}
            borderStyle="single"
            borderColor="gray"
            paddingY={1}
            paddingX={1}
          >
            {task.logs ? (
              <Text dimColor>{task.logs}</Text>
            ) : task.status === 'in_progress' ? (
              <WaitingAnimation />
            ) : (
              <Text dimColor>No logs available</Text>
            )}
          </Box>
        </>
      )}

      {task.error && (
        <>
          <Box marginTop={1}>
            <Text bold color="red">
              Error:
            </Text>
          </Box>
          <Box marginBottom={1} paddingLeft={2}>
            <Text color="red">{task.error}</Text>
          </Box>
        </>
      )}
    </Box>
  );
}
