import React from 'react';
import { render } from 'ink';
import { TaskView } from '../components/TaskView.js';

export async function runTaskCommand(taskName: string): Promise<void> {
  return new Promise((resolve) => {
    const { unmount } = render(
      React.createElement(TaskView, {
        taskName,
        onComplete: () => {
          unmount();
          resolve();
        },
      })
    );
  });
}
