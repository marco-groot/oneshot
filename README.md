# oneshot

A CLI tool for managing parallel AI-powered development tasks with Claude. Each task runs in its own git worktree, allowing you to work on multiple features simultaneously without conflicts.

## Prerequisites

1. **Claude CLI** - Oneshot uses Claude CLI for authentication
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **Authenticate with Claude**
   ```bash
   claude
   ```
   Follow the web authentication prompts. This uses your company's authentication flow (no API key needed).

3. **GitHub CLI** (for automatic PR creation)
   ```bash
   brew install gh
   gh auth login
   ```

## Installation

```bash
npm install
npm run build
npm link
```

## Configuration

Run the interactive setup (only needed once):

```bash
oneshot
> config
```

You'll be prompted for:
- **API Key Setup** (optional) - Skip this if using Claude CLI authentication
- **Branch Prefix** - Your branch naming prefix (e.g., `marco` creates branches like `marco/fix-login-bug`)

## Usage

### Launch the TUI

```bash
oneshot
```

This opens an interactive terminal interface with:
- **Task List** (top) - Shows all tasks with status, task numbers, and branch names
- **Output Area** (middle) - Shows command results and progress
- **Command Input** (bottom) - Type commands here

### Create a Task

```
> task
Task name: fix login bug
Task prompt: Fix the authentication issue where special characters in passwords cause login failures
```

Oneshot will automatically:
1. Create a git worktree at `~/.oneshot/worktrees/<task-id>`
2. Create a branch: `<prefix>/fix-login-bug`
3. Execute Claude agentically to make changes in that worktree
4. Commit and push changes
5. Create a pull request on GitHub
6. Update task status to `completed`

### Navigate Tasks

```
> cd 1              # Enter task #1 to see details and interact
> cd ..             # Go back to main view
```

When inside a task view, you can see:
- Task status and progress
- Worktree location
- Claude's current state
- Any actions needed

### Available Commands

| Command | Description |
|---------|-------------|
| `task` | Create and execute a new task (interactive) |
| `cd <number>` | Navigate into a specific task |
| `cd ..` | Go back to main task list view |
| `switch <number>` | Show worktree path for a task |
| `tasks` | Refresh the task list |
| `config` | Interactive configuration |
| `clear` | Clear output area |
| `help` | Show available commands |
| `exit` / `quit` | Exit the application |

## Task Statuses

Tasks are color-coded by status:

- 🔵 **in_progress** - Claude is actively working
- ⚠️ **needs_action** - Requires user intervention (yellow)
- ✓ **completed** - Successfully finished and PR created (green)
- ✗ **failed** - Encountered an error (red)
- ○ **pending** - Queued but not started (gray)

## How It Works

### Git Worktrees

Each task runs in an isolated git worktree:
- Worktrees are stored at `~/.oneshot/worktrees/<task-id>`
- All worktrees branch off `main`/`master` independently
- Multiple tasks can run in parallel without conflicts
- Changes are isolated until pushed

### Claude Execution

Claude runs agentically in each worktree:
- Makes file changes directly
- Follows your task prompt instructions
- Works within the worktree context
- Automatically commits changes when done

### PR Workflow

When a task completes:
1. Changes are committed with your task name
2. Branch is pushed to origin
3. GitHub PR is created automatically
4. PR URL is saved to the task
5. Task status updates to `completed`

## Features

- 🎯 **Parallel Tasks** - Run multiple tasks simultaneously in separate worktrees
- 🤖 **Agentic Claude** - Claude makes real code changes automatically
- 🔀 **Git Integration** - Automatic worktree, branch, commit, and push
- 📝 **Auto PR Creation** - Creates GitHub PRs when tasks complete
- 🔢 **Task Numbers** - Easy navigation with task numbers
- 📊 **Status Tracking** - Real-time visual feedback on task progress
- 🔐 **Web Auth** - Uses Claude CLI authentication (no API key needed)

## Architecture

- **src/index.ts** - CLI entry point and TUI launcher
- **src/commands/** - Command implementations (config, etc.)
- **src/components/** - Ink TUI components (MainTUI, TaskList, etc.)
- **src/services/claude.ts** - Claude CLI integration
- **src/services/task.ts** - Task workflow orchestration
- **src/store/tasks.ts** - Task persistence with sequential numbering
- **src/utils/git.ts** - Git worktree and branch management
- **src/types.ts** - TypeScript interfaces

## Example Workflow

```bash
# Launch TUI
oneshot

# Create first task
> task
Task name: add dark mode
Task prompt: Implement dark mode toggle in the settings page

# Create second task while first is running
> task
Task name: fix typos
Task prompt: Fix typos in the README file

# Check task #1 details
> cd 1
# See Claude's progress, worktree location, etc.

# Go back to main view
> cd ..

# See all tasks
> tasks

# Exit
> exit
```

## Troubleshooting

**"Claude CLI not found"**
- Install Claude CLI: `npm install -g @anthropic-ai/claude-code`
- Authenticate: `claude`

**"Not in a git repository"**
- Run `oneshot` from within a git repository

**"No changes to commit"**
- Task status will update to `needs_action`
- Claude may need more specific instructions
- Check the task prompt and try again

**PR creation fails**
- Install GitHub CLI: `brew install gh`
- Authenticate: `gh auth login`
