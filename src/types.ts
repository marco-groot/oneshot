export interface Task {
  id: string;
  number: number;
  name: string;
  prompt: string;
  status: 'pending' | 'in_progress' | 'needs_action' | 'completed' | 'failed';
  branchName: string;
  worktreePath: string;
  prUrl?: string;
  createdAt: string;
  updatedAt: string;
  result?: string;
  error?: string;
}

export interface TaskStore {
  tasks: Task[];
}

export interface ClaudeResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
