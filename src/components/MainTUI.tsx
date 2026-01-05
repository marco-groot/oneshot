import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { TaskList } from './TaskList.js';
import { TaskDetailView } from './TaskDetailView.js';
import { LoadingProgress, type ProgressStage } from './LoadingProgress.js';
import { setConfig, getConfig, clearConfig, runInteractiveConfig } from '../commands/config.js';
import { createAndExecuteTask } from '../services/task.js';
import { getTaskByNumber } from '../store/tasks.js';

type InputMode = 'command' | 'task_name' | 'task_prompt' | 'confirm_pr';
type ViewMode = 'main' | 'task_detail';

export function MainTUI() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string>('');
  const [refresh, setRefresh] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>('command');
  const [taskName, setTaskName] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [currentTaskNumber, setCurrentTaskNumber] = useState<number | null>(null);
  const [pendingPrTaskNumber, setPendingPrTaskNumber] = useState<number | null>(null);
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [currentStage, setCurrentStage] = useState<ProgressStage>('worktree');
  const [executionError, setExecutionError] = useState<string | undefined>();
  const { exit } = useApp();

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setInput('');

    if (inputMode === 'task_name') {
      setTaskName(trimmed);
      setInputMode('task_prompt');
      setOutput('');
      return;
    }

    if (inputMode === 'task_prompt') {
      const prompt = trimmed;
      setInputMode('command');
      setIsExecutingTask(true);
      setExecutionError(undefined);
      setCurrentStage('worktree');
      setOutput('');

      try {
        await createAndExecuteTask(taskName, prompt, (progress) => {
          setCurrentStage(progress.stage);
          if (progress.message) {
            setOutput(progress.message);
          }
          setRefresh((r) => r + 1);
        });
        setRefresh((r) => r + 1);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setExecutionError(errorMessage);
        setOutput(`Error: ${errorMessage}`);
      } finally {
        setTimeout(() => {
          setIsExecutingTask(false);
        }, 2000);
      }
      return;
    }

    if (inputMode === 'confirm_pr') {
      setInputMode('command');
      const response = trimmed.toLowerCase();

      if (response === 'y' || response === 'yes') {
        if (pendingPrTaskNumber !== null) {
          const task = getTaskByNumber(pendingPrTaskNumber);
          if (task) {
            setOutput(`Creating PR for task #${pendingPrTaskNumber}...`);
            try {
              const { commitAndPush, createPR } = await import('../utils/git.js');
              const { updateTask } = await import('../store/tasks.js');

              commitAndPush(task.worktreePath, task.branchName, task.name);
              const prUrl = createPR(task.worktreePath, task.name, task.prompt);

              updateTask(task.id, { prUrl });
              setOutput(`✓ PR created: ${prUrl}`);
              setRefresh((r) => r + 1);
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              setOutput(`✗ Failed to create PR: ${errorMessage}`);
            }
          }
        }
      } else {
        setOutput('PR creation cancelled');
      }
      setPendingPrTaskNumber(null);
      return;
    }

    const args = trimmed.split(' ');
    const command = args[0];

    try {
      if (command === 'exit' || command === 'quit') {
        exit();
        return;
      }

      if (command === 'config') {
        if (args.length === 1) {
          await runInteractiveConfig();
        } else if (args[1] === 'set' && args.length === 4) {
          setConfig(args[2], args[3]);
        } else if (args[1] === 'get' && args.length === 3) {
          getConfig(args[2]);
        } else if (args[1] === 'clear' && args.length === 3) {
          clearConfig(args[2]);
        } else {
          setOutput('Usage: config [set <key> <value> | get <key> | clear <key>]');
        }
        setRefresh((r) => r + 1);
        return;
      }

      if (command === 'task') {
        setInputMode('task_name');
        setOutput('');
        return;
      }

      if (command === 'cd') {
        if (args.length === 2) {
          if (args[1] === '..') {
            setViewMode('main');
            setCurrentTaskNumber(null);
            setOutput('Returned to main view');
          } else {
            const taskNumber = parseInt(args[1]);
            const task = getTaskByNumber(taskNumber);
            if (task) {
              setViewMode('task_detail');
              setCurrentTaskNumber(taskNumber);
              setOutput('');
            } else {
              setOutput(`Task #${taskNumber} not found`);
            }
          }
        } else {
          setOutput('Usage: cd <number> or cd ..');
        }
        setRefresh((r) => r + 1);
        return;
      }

      if (command === 'link') {
        let taskNumber: number | null = null;

        if (args.length === 2) {
          taskNumber = parseInt(args[1]);
        } else if (args.length === 1 && viewMode === 'task_detail' && currentTaskNumber !== null) {
          taskNumber = currentTaskNumber;
        }

        if (taskNumber !== null) {
          const task = getTaskByNumber(taskNumber);
          if (task) {
            if (task.prUrl) {
              setOutput(`PR Link for Task #${taskNumber}:\n${task.prUrl}`);
            } else {
              setOutput('No PR created yet, would you like to create one? (y/n)');
              setInputMode('confirm_pr');
              setPendingPrTaskNumber(taskNumber);
            }
          } else {
            setOutput(`Task #${taskNumber} not found`);
          }
        } else {
          setOutput('Usage: link <number> or link (when in task detail view)');
        }
        return;
      }

      if (command === 'delete') {
        let taskNumbers: number[] = [];

        if (args.length >= 2) {
          taskNumbers = args.slice(1).map((arg) => parseInt(arg)).filter((n) => !isNaN(n));
        } else if (args.length === 1 && viewMode === 'task_detail' && currentTaskNumber !== null) {
          taskNumbers = [currentTaskNumber];
        }

        if (taskNumbers.length > 0) {
          const { removeWorktree, deleteBranch } = await import('../utils/git.js');
          const { deleteTask } = await import('../store/tasks.js');

          const results: string[] = [];
          let shouldExitTaskDetail = false;

          for (const taskNumber of taskNumbers) {
            const task = getTaskByNumber(taskNumber);
            if (task) {
              try {
                setIsDeletingTask(true);
                setExecutionError(undefined);

                setCurrentStage('deleting_worktree');
                await new Promise((resolve) => setTimeout(resolve, 100));
                removeWorktree(task.worktreePath);

                setCurrentStage('deleting_branch');
                await new Promise((resolve) => setTimeout(resolve, 100));
                deleteBranch(task.branchName);

                setCurrentStage('deleting_task');
                await new Promise((resolve) => setTimeout(resolve, 100));
                deleteTask(task.id);

                setCurrentStage('completed');
                await new Promise((resolve) => setTimeout(resolve, 300));

                if (viewMode === 'task_detail' && currentTaskNumber === taskNumber) {
                  shouldExitTaskDetail = true;
                }

                results.push(`✓ Task #${taskNumber} deleted (worktree, branch, and remote cleaned up)`);
              } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setExecutionError(errorMessage);
                results.push(`✗ Failed to delete task #${taskNumber}: ${errorMessage}`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
              } finally {
                setIsDeletingTask(false);
              }
            } else {
              results.push(`✗ Task #${taskNumber} not found`);
            }
          }

          if (shouldExitTaskDetail) {
            setViewMode('main');
            setCurrentTaskNumber(null);
          }

          setOutput(results.join('\n'));
          setRefresh((r) => r + 1);
        } else {
          setOutput('Usage: delete <number> [<number> ...] or delete (when in task detail view)');
        }
        return;
      }

      if (command === 'update') {
        if (viewMode === 'task_detail' && currentTaskNumber !== null) {
          const task = getTaskByNumber(currentTaskNumber);
          if (task) {
            setOutput(`Updating task #${currentTaskNumber} from remote...`);
            try {
              const { updateFromRemote } = await import('../utils/git.js');
              const result = updateFromRemote(task.worktreePath, task.branchName);
              setOutput(`✓ Update complete:\n${result}`);
              setRefresh((r) => r + 1);
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              setOutput(`✗ Failed to update: ${errorMessage}`);
            }
          }
        } else if (viewMode === 'main') {
          setOutput('Updating main branch from remote...');
          try {
            const { updateMainBranch } = await import('../utils/git.js');
            const result = updateMainBranch();
            setOutput(`✓ Update complete:\n${result}`);
            setRefresh((r) => r + 1);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setOutput(`✗ Failed to update: ${errorMessage}`);
          }
        }
        return;
      }

      if (command === 'tasks') {
        setRefresh((r) => r + 1);
        setOutput('Task list refreshed');
        return;
      }

      if (command === 'clear') {
        setOutput('');
        setRefresh((r) => r + 1);
        return;
      }

      if (command === 'help') {
        const helpText = viewMode === 'task_detail'
          ? 'Available commands:\n' +
            '  cd ..                - Go back to main task list view\n' +
            '  link                 - Get PR link for current task\n' +
            '  update               - Pull latest changes from main and remote branch\n' +
            '  delete               - Delete current task\n' +
            '  clear                - Clear output\n' +
            '  help                 - Show this help\n' +
            '  exit/quit            - Exit the application'
          : 'Available commands:\n' +
            '  task                 - Create and execute a new task (interactive)\n' +
            '  cd <number>          - Navigate into a specific task\n' +
            '  link <number>        - Get PR link for task by number\n' +
            '  update               - Pull latest main/master and rebase\n' +
            '  delete <number> ...  - Delete one or more tasks by number\n' +
            '  tasks                - Refresh task list\n' +
            '  config               - Interactive configuration\n' +
            '  config set <k> <v>   - Set config value\n' +
            '  config get <k>       - Get config value\n' +
            '  config clear <k>     - Clear config value\n' +
            '  clear                - Clear output\n' +
            '  help                 - Show this help\n' +
            '  exit/quit            - Exit the application';

        setOutput(helpText);
        return;
      }

      setOutput(`Unknown command: ${command}. Type 'help' for available commands.`);
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getPromptPrefix = () => {
    if (inputMode === 'task_name') return 'Enter task name: ';
    if (inputMode === 'task_prompt') return 'Enter task prompt: ';
    if (inputMode === 'confirm_pr') return '(y/n): ';
    return '> ';
  };

  const getPromptColor = () => {
    if (inputMode === 'task_name' || inputMode === 'task_prompt') return 'yellow';
    if (inputMode === 'confirm_pr') return 'cyan';
    return 'green';
  };

  const getPlaceholder = () => {
    if (viewMode === 'task_detail') return 'type cd .. to go back';
    return '';
  };

  const renderContent = () => {
    if (viewMode === 'task_detail' && currentTaskNumber !== null) {
      const task = getTaskByNumber(currentTaskNumber);
      if (task) {
        return <TaskDetailView task={task} key={refresh} />;
      }
    }
    return <TaskList key={refresh} />;
  };

  const getHeaderText = () => {
    if (viewMode === 'task_detail' && currentTaskNumber !== null) {
      const task = getTaskByNumber(currentTaskNumber);
      if (task) {
        return `Task #${currentTaskNumber}: ${task.name}`;
      }
    }
    return 'Oneshot CLI - Type \'help\' for commands, \'exit\' to quit';
  };

  return (
    <Box flexDirection="column" height="100%">
      <Box borderStyle="single" borderColor="cyan" flexDirection="column" paddingX={1}>
        <Text bold color="cyan">
          {getHeaderText()}
        </Text>
      </Box>

      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        {isExecutingTask ? (
          <LoadingProgress currentStage={currentStage} error={executionError} mode="execution" />
        ) : isDeletingTask ? (
          <LoadingProgress currentStage={currentStage} error={executionError} mode="deletion" />
        ) : (
          renderContent()
        )}
      </Box>

      {output && !isExecutingTask && !isDeletingTask && (
        <Box borderStyle="single" borderColor="gray" paddingX={1} marginY={1}>
          <Text>{output}</Text>
        </Box>
      )}

      <Box borderStyle="single" borderColor={getPromptColor()} paddingX={1}>
        <Text color={getPromptColor()} bold>
          {getPromptPrefix()}
        </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder={getPlaceholder()}
        />
      </Box>
    </Box>
  );
}
