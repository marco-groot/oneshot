import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { TaskList } from './TaskList.js';
import { TaskDetailView } from './TaskDetailView.js';
import { setConfig, getConfig, clearConfig, runInteractiveConfig } from '../commands/config.js';
import { createAndExecuteTask } from '../services/task.js';
import { getTaskByNumber } from '../store/tasks.js';

type InputMode = 'command' | 'task_name' | 'task_prompt';
type ViewMode = 'main' | 'task_detail';

export function MainTUI() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string>('');
  const [refresh, setRefresh] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>('command');
  const [taskName, setTaskName] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [currentTaskNumber, setCurrentTaskNumber] = useState<number | null>(null);
  const { exit } = useApp();

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setInput('');

    if (inputMode === 'task_name') {
      setTaskName(trimmed);
      setInputMode('task_prompt');
      setOutput('Enter task prompt (describe what you want Claude to do):');
      return;
    }

    if (inputMode === 'task_prompt') {
      const prompt = trimmed;
      setInputMode('command');
      setOutput(`Creating task "${taskName}" and executing...`);

      try {
        await createAndExecuteTask(taskName, prompt, (message) => {
          setOutput(message);
          setRefresh((r) => r + 1);
        });
        setRefresh((r) => r + 1);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setOutput(`Error: ${errorMessage}`);
      }
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
        setOutput('Enter task name:');
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

      if (command === 'switch' && args.length === 2) {
        const taskNumber = parseInt(args[1]);
        const task = getTaskByNumber(taskNumber);
        if (task) {
          setOutput(`Switched to task #${taskNumber}: ${task.name}\nWorktree: ${task.worktreePath}`);
        } else {
          setOutput(`Task #${taskNumber} not found`);
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
        setOutput(
          'Available commands:\n' +
          '  task                 - Create and execute a new task (interactive)\n' +
          '  cd <number>          - Navigate into a specific task\n' +
          '  cd ..                - Go back to main task list view\n' +
          '  switch <number>      - Show worktree path for a task\n' +
          '  tasks                - Refresh task list\n' +
          '  config               - Interactive configuration\n' +
          '  config set <k> <v>   - Set config value\n' +
          '  config get <k>       - Get config value\n' +
          '  config clear <k>     - Clear config value\n' +
          '  clear                - Clear output\n' +
          '  help                 - Show this help\n' +
          '  exit/quit            - Exit the application'
        );
        return;
      }

      setOutput(`Unknown command: ${command}. Type 'help' for available commands.`);
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getPromptPrefix = () => {
    if (inputMode === 'task_name') return 'Task name: ';
    if (inputMode === 'task_prompt') return 'Task prompt: ';
    return '> ';
  };

  const getPromptColor = () => {
    if (inputMode === 'task_name' || inputMode === 'task_prompt') return 'yellow';
    return 'green';
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
      return `Task #${currentTaskNumber} - Type 'cd ..' to go back`;
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
        {renderContent()}
      </Box>

      {output && (
        <Box borderStyle="single" borderColor="gray" paddingX={1} marginY={1}>
          <Text>{output}</Text>
        </Box>
      )}

      <Box borderStyle="single" borderColor={getPromptColor()} paddingX={1}>
        <Text color={getPromptColor()} bold>
          {getPromptPrefix()}
        </Text>
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}
