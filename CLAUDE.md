# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a Deno CLI tool that shows commits unique to the current Git branch
compared to its parent branch. It provides various formatting options for
displaying commit information.

## Development Commands

```bash
# Run in development mode with file watching
deno task dev

# Run the CLI directly
deno run --allow-run --allow-read main.ts [OPTIONS]

# Run with specific options
deno run --allow-run --allow-read main.ts --oneline --stat
```

## Architecture

The codebase consists of:

- `main.ts` - Contains all functionality including CLI parsing, Git operations,
  and parent branch detection logic
- `mod.ts` - Currently empty, intended as the public module API
- `deno.json` - Deno configuration with development task

Key functions in `main.ts`:

- `runGitCommand()` - Executes git commands and returns output
- `findParentBranch()` - Intelligent parent branch detection using multiple
  strategies
- `getBranchCommits()` - Gets commits between current branch and parent
- Main CLI entry point with argument parsing using Deno's parseArgs

## Parent Branch Detection Strategy

The tool uses a sophisticated approach to find the parent branch:

1. Checks for upstream tracking branch
2. Analyzes commit history to find the most likely parent
3. Falls back to finding the branch with minimum unique commits

## Output Formatting

The tool supports multiple output formats that can be combined:

- `--oneline/-o` - Compact single-line format
- `--stat/-s` - Show file statistics
- `--files/-f` - List changed files
- `--author/-a` - Include author information
- `--date/-d` - Show commit dates
- `--graph/-g` - ASCII commit graph
- `--number/-n` - Limit number of commits shown
