import React from 'react';
import { render } from 'ink';
import { TaskList } from '../components/TaskList.js';

export async function runTasksCommand(): Promise<void> {
  const { unmount, waitUntilExit } = render(React.createElement(TaskList));

  await waitUntilExit();
  unmount();
}
