import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import Conf from 'conf';
import type { ClaudeResponse } from '../types.js';
import type { ProgressStage } from '../components/LoadingProgress.js';

const config = new Conf({ projectName: 'oneshot' });

export class ClaudeService {
  constructor() {
    try {
      execSync('claude --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error(
        'Claude CLI not found or not authenticated.\n' +
        'Please install and authenticate with Claude CLI:\n' +
        '  1. Install: npm install -g @anthropic-ai/claude-code\n' +
        '  2. Run: claude\n' +
        '  3. Follow the authentication prompts'
      );
    }
  }

  static setApiKey(key: string): void {
    config.set('apiKey', key);
  }

  static getStoredApiKey(): string | undefined {
    return config.get('apiKey') as string | undefined;
  }

  static clearApiKey(): void {
    config.delete('apiKey');
  }

  async executeTask(taskName: string): Promise<ClaudeResponse> {
    const tempDir = path.join(os.tmpdir(), `oneshot-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const promptFile = path.join(tempDir, 'prompt.txt');
    fs.writeFileSync(promptFile, `Execute the following task: ${taskName}`);

    try {
      const output = execSync(`claude "${taskName}"`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });

      return {
        content: output,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
        },
      };
    } catch (error) {
      throw new Error(`Claude execution failed: ${error}`);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  async executeTaskInWorktree(
    prompt: string,
    worktreePath: string,
    onLog?: (log: string, stage?: ProgressStage) => void
  ): Promise<ClaudeResponse> {
    return new Promise((resolve, reject) => {
      const fullPrompt = `You are working in a git worktree at: ${worktreePath}

Please complete the following task. Make all necessary changes to files in this directory:

${prompt}

Important:
- Make all changes directly in the worktree
- Ensure all changes are saved
- The changes will be automatically committed and pushed`;

      onLog?.('Starting Claude CLI...\n', 'claude_init');

      const claudeProcess = spawn('claude', [
        '--print',
        '--tools', 'default',
        '--dangerously-skip-permissions',
      ], {
        cwd: worktreePath,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';
      let fullLogs = 'Starting Claude CLI...\n';
      let hasReceivedData = false;
      let currentStage: ProgressStage = 'claude_init';
      let hasStartedThinking = false;
      let hasStartedExecuting = false;

      if (claudeProcess.stdin) {
        claudeProcess.stdin.write(fullPrompt);
        claudeProcess.stdin.end();
        onLog?.('Prompt sent to Claude, waiting for response...\n', 'claude_thinking');
        fullLogs += 'Prompt sent to Claude, waiting for response...\n';
        currentStage = 'claude_thinking';
      }

      claudeProcess.stdout?.on('data', (data) => {
        const chunk = data.toString();
        hasReceivedData = true;
        output += chunk;
        fullLogs += chunk;

        // Detect when Claude starts thinking (analyzing the task)
        if (!hasStartedThinking && chunk.trim().length > 0) {
          hasStartedThinking = true;
          currentStage = 'claude_thinking';
        }

        // Detect when Claude starts executing (making changes)
        // This is a heuristic - if we see tool usage or file operations
        if (!hasStartedExecuting && (
          chunk.includes('tool_use') ||
          chunk.includes('Writing') ||
          chunk.includes('Editing') ||
          chunk.includes('Reading') ||
          chunk.includes('Created') ||
          chunk.includes('Modified')
        )) {
          hasStartedExecuting = true;
          currentStage = 'claude_executing';
          onLog?.(chunk, 'claude_executing');
          return;
        }

        if (onLog) {
          onLog(chunk, currentStage);
        }
      });

      claudeProcess.stderr?.on('data', (data) => {
        const chunk = data.toString();
        hasReceivedData = true;
        errorOutput += chunk;
        fullLogs += `[stderr] ${chunk}`;
        if (onLog) {
          onLog(`[stderr] ${chunk}`, currentStage);
        }
      });

      claudeProcess.on('close', (code) => {
        if (code === 0 || output.length > 0) {
          resolve({
            content: fullLogs || output || 'Task completed successfully',
            usage: {
              inputTokens: 0,
              outputTokens: 0,
            },
          });
        } else {
          const errorMsg = `Claude execution failed (code ${code}): ${errorOutput || 'No output'}`;
          fullLogs += `\n${errorMsg}`;
          if (onLog) {
            onLog(`\n${errorMsg}`);
          }
          reject(new Error(errorMsg));
        }
      });

      claudeProcess.on('error', (error) => {
        const errorMsg = `Failed to start Claude CLI: ${error.message}`;
        fullLogs += `\n${errorMsg}`;
        if (onLog) {
          onLog(`\n${errorMsg}`);
        }
        reject(new Error(errorMsg));
      });
    });
  }
}
