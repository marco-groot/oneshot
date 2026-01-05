import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { Task } from '../types.js';
import { createAndExecuteTask } from '../services/task.js';
import { LoadingProgress, type ProgressStage } from './LoadingProgress.js';

interface TaskViewProps {
  taskName: string;
  onComplete: () => void;
}

export function TaskView({ taskName, onComplete }: TaskViewProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [status, setStatus] = useState<'creating' | 'executing' | 'done' | 'error'>('creating');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [currentStage, setCurrentStage] = useState<ProgressStage>('worktree');

  useEffect(() => {
    async function run() {
      setStatus('executing');

      try {
        const completedTask = await createAndExecuteTask(
          taskName,
          taskName,
          (progress) => {
            setCurrentStage(progress.stage);
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

      setTimeout(onComplete, 2000);
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

      {(status === 'creating' || status === 'executing') && (
        <LoadingProgress currentStage={currentStage} />
      )}

      {status === 'done' && (
        <Box flexDirection="column">
          <LoadingProgress currentStage="completed" />
          <Box marginTop={1}>
            <Text color="green">✓ PR created: {task?.prUrl || 'N/A'}</Text>
          </Box>
        </Box>
      )}

      {status === 'error' && (
        <LoadingProgress currentStage={currentStage} error={error} />
      )}
    </Box>
  );
}
