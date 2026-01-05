import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { Task } from '../types.js';
import { createAndExecuteTask } from '../services/task.js';

interface TaskViewProps {
  taskName: string;
  onComplete: () => void;
}

export function TaskView({ taskName, onComplete }: TaskViewProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [status, setStatus] = useState<'creating' | 'executing' | 'done' | 'error'>('creating');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<string>('Creating task...');

  useEffect(() => {
    async function run() {
      setStatus('executing');

      try {
        const completedTask = await createAndExecuteTask(
          taskName,
          taskName,
          (message) => {
            setProgress(message);
          }
        );
        setTask(completedTask);
        setResult(completedTask.result || 'Task completed');
        setStatus('done');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setStatus('error');
      }

      setTimeout(onComplete, 100);
    }

    run();
  }, [taskName, onComplete]);

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Task: {taskName}
        </Text>
      </Box>

      {status === 'creating' && (
        <Box>
          <Text color="green">
            <Spinner type="dots" />
          </Text>
          <Text> Creating task...</Text>
        </Box>
      )}

      {status === 'executing' && (
        <Box>
          <Text color="green">
            <Spinner type="dots" />
          </Text>
          <Text> {progress}</Text>
        </Box>
      )}

      {status === 'done' && (
        <Box flexDirection="column">
          <Text color="green">Task completed!</Text>
          <Box marginTop={1}>
            <Text>{result}</Text>
          </Box>
        </Box>
      )}

      {status === 'error' && (
        <Box flexDirection="column">
          <Text color="red">Task failed!</Text>
          <Text color="red">{error}</Text>
        </Box>
      )}
    </Box>
  );
}
