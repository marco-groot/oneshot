import React from 'react';
import { Box, Text } from 'ink';
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

interface TaskDetailViewProps {
  task: Task;
}

export function TaskDetailView({ task }: TaskDetailViewProps) {
  const statusColor = STATUS_COLORS[task.status];
  const statusIcon = STATUS_ICONS[task.status];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Task #{task.number}: {task.name}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Box width={15}>
          <Text dimColor>Status:</Text>
        </Box>
        <Box>
          <Text color={statusColor}>
            {statusIcon} {task.status}
          </Text>
        </Box>
      </Box>

      <Box marginBottom={1}>
        <Box width={15}>
          <Text dimColor>Branch:</Text>
        </Box>
        <Text>{task.branchName}</Text>
      </Box>

      <Box marginBottom={1}>
        <Box width={15}>
          <Text dimColor>Worktree:</Text>
        </Box>
        <Text color="gray">{task.worktreePath}</Text>
      </Box>

      <Box marginBottom={1}>
        <Box width={15}>
          <Text dimColor>Created:</Text>
        </Box>
        <Text>{new Date(task.createdAt).toLocaleString()}</Text>
      </Box>

      {task.prUrl && (
        <Box marginBottom={1}>
          <Box width={15}>
            <Text dimColor>Pull Request:</Text>
          </Box>
          <Text color="cyan">{task.prUrl}</Text>
        </Box>
      )}

      <Box marginBottom={1} marginTop={1}>
        <Text bold underline>
          Task Prompt:
        </Text>
      </Box>
      <Box marginBottom={1} paddingLeft={2}>
        <Text>{task.prompt}</Text>
      </Box>

      {task.result && (
        <>
          <Box marginBottom={1} marginTop={1}>
            <Text bold underline color="green">
              Result:
            </Text>
          </Box>
          <Box marginBottom={1} paddingLeft={2}>
            <Text>{task.result}</Text>
          </Box>
        </>
      )}

      {task.error && (
        <>
          <Box marginBottom={1} marginTop={1}>
            <Text bold underline color="red">
              Error:
            </Text>
          </Box>
          <Box marginBottom={1} paddingLeft={2}>
            <Text color="red">{task.error}</Text>
          </Box>
        </>
      )}

      {task.status === 'needs_action' && (
        <Box marginTop={1} borderStyle="single" borderColor="yellow" paddingX={1}>
          <Text color="yellow">
            ⚠ This task needs your attention. Review the error above and consider:
            {'\n'}- Running the task again with a more specific prompt
            {'\n'}- Manually making changes in the worktree: {task.worktreePath}
            {'\n'}- Using "cd .." to go back and create a new task
          </Text>
        </Box>
      )}

      {task.status === 'in_progress' && (
        <Box marginTop={1} borderStyle="single" borderColor="blue" paddingX={1}>
          <Text color="blue">
            ◐ Claude is currently working on this task...
            {'\n'}Changes are being made in: {task.worktreePath}
          </Text>
        </Box>
      )}

      <Box marginTop={2} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          Type "cd .." to return to the main task list
        </Text>
      </Box>
    </Box>
  );
}
