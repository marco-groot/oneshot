import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

export type ProgressStage =
  | 'worktree'
  | 'claude_init'
  | 'claude_thinking'
  | 'claude_executing'
  | 'committing'
  | 'creating_pr'
  | 'deleting_worktree'
  | 'deleting_branch'
  | 'deleting_task'
  | 'completed';

export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface ProgressState {
  stage: ProgressStage;
  status: StageStatus;
  message?: string;
}

interface LoadingProgressProps {
  currentStage: ProgressStage;
  error?: string;
  mode?: 'execution' | 'deletion';
}

const STAGE_INFO: Record<ProgressStage, { label: string; icon: string }> = {
  worktree: { label: 'Creating git worktree', icon: '🌳' },
  claude_init: { label: 'Initializing Claude CLI', icon: '🤖' },
  claude_thinking: { label: 'Claude is analyzing the task', icon: '🧠' },
  claude_executing: { label: 'Claude is making changes', icon: '⚡' },
  committing: { label: 'Committing changes to git', icon: '📦' },
  creating_pr: { label: 'Creating pull request', icon: '🚀' },
  deleting_worktree: { label: 'Removing git worktree', icon: '🗑️' },
  deleting_branch: { label: 'Deleting branch (local and remote)', icon: '🔥' },
  deleting_task: { label: 'Removing task record', icon: '📝' },
  completed: { label: 'Task completed', icon: '✅' },
};

const EXECUTION_STAGE_ORDER: ProgressStage[] = [
  'worktree',
  'claude_init',
  'claude_thinking',
  'claude_executing',
  'committing',
  'creating_pr',
  'completed',
];

const DELETION_STAGE_ORDER: ProgressStage[] = [
  'deleting_worktree',
  'deleting_branch',
  'deleting_task',
  'completed',
];

export function LoadingProgress({ currentStage, error, mode = 'execution' }: LoadingProgressProps) {
  const STAGE_ORDER = mode === 'deletion' ? DELETION_STAGE_ORDER : EXECUTION_STAGE_ORDER;
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

  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  const getStageStatus = (stage: ProgressStage): StageStatus => {
    const stageIndex = STAGE_ORDER.indexOf(stage);
    if (error) {
      if (stageIndex === currentIndex) return 'failed';
      if (stageIndex < currentIndex) return 'completed';
      return 'pending';
    }
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'in_progress';
    return 'pending';
  };

  const renderStageIcon = (stage: ProgressStage, status: StageStatus) => {
    if (status === 'completed') {
      return <Text color="green">✓</Text>;
    }
    if (status === 'failed') {
      return <Text color="red">✗</Text>;
    }
    if (status === 'in_progress') {
      return (
        <Text color="yellow">
          <Spinner type="dots" />
        </Text>
      );
    }
    return <Text color="gray">○</Text>;
  };

  const renderStageLabel = (stage: ProgressStage, status: StageStatus) => {
    const info = STAGE_INFO[stage];
    let color: string = 'gray';

    if (status === 'completed') color = 'green';
    else if (status === 'failed') color = 'red';
    else if (status === 'in_progress') color = 'yellow';

    const label = status === 'in_progress' ? `${info.label}${dots}` : info.label;

    return (
      <Text color={color}>
        {info.icon} {label}
      </Text>
    );
  };

  const title = mode === 'deletion' ? '🗑️  Task Deletion Progress' : '⚙️  Task Execution Progress';

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>

      {STAGE_ORDER.map((stage) => {
        if (stage === 'completed') return null;
        const status = getStageStatus(stage);

        return (
          <Box key={stage} marginLeft={2} marginY={0}>
            {renderStageIcon(stage, status)}
            <Text> </Text>
            {renderStageLabel(stage, status)}
          </Box>
        );
      })}

      {error && (
        <Box marginTop={1} marginLeft={2}>
          <Text color="red">❌ Error: {error}</Text>
        </Box>
      )}

      {currentStage === 'completed' && !error && (
        <Box marginTop={1} marginLeft={2}>
          <Text color="green" bold>
            ✨ All done! Your task has been completed successfully.
          </Text>
        </Box>
      )}
    </Box>
  );
}
