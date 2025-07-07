# git-branch-commits

A Deno CLI tool that shows commits unique to your current Git branch compared to
its parent branch. Perfect for reviewing changes before creating pull requests
or merging.

## Features

- **Smart Parent Branch Detection** - Automatically finds the most likely parent
  branch using multiple strategies
- **Multiple Output Formats** - Choose from various display options including
  oneline, stats, files, and more
- **Colorized Output** - Enhanced readability with ANSI color codes
- **Zero Dependencies** - Uses only Deno standard library and Git CLI

## Installation

### Using Deno

```bash
# Install globally
deno install -g --allow-run --allow-read -n git-branch-commits jsr:@wyattjoh/git-branch-commits

# Or run directly
deno run --allow-run --allow-read https://raw.githubusercontent.com/wyattjoh/git-branch-commits/main/main.ts
```

### From Source

```bash
# Clone the repository
git clone https://github.com/wyattjoh/git-branch-commits.git
cd git-branch-commits

# Run directly
./main.ts

# Or with Deno
deno run --allow-run --allow-read main.ts
```

## Usage

```bash
# Show commits unique to current branch
git-branch-commits

# Show commits in oneline format
git-branch-commits --oneline

# Show commits with file statistics
git-branch-commits --stat

# Combine multiple options
git-branch-commits --oneline --author --date

# Limit number of commits shown
git-branch-commits --number 10

# Show help
git-branch-commits --help
```

## Options

| Option         | Short | Description                                     |
| -------------- | ----- | ----------------------------------------------- |
| `--oneline`    | `-o`  | Display commits in a compact single-line format |
| `--stat`       | `-s`  | Show file change statistics for each commit     |
| `--files`      | `-f`  | List all files changed in each commit           |
| `--author`     | `-a`  | Include author information                      |
| `--date`       | `-d`  | Show commit dates                               |
| `--graph`      | `-g`  | Display ASCII commit graph                      |
| `--number <n>` | `-n`  | Limit output to n commits                       |
| `--help`       | `-h`  | Show help message                               |

## How It Works

The tool uses a smart algorithm to detect your branch's parent:

1. **Upstream Tracking** - First checks if your branch tracks a remote branch
2. **Commit Analysis** - Analyzes commit history to find the most likely parent
   branch
3. **Minimal Diff** - Falls back to finding the branch with the least unique
   commits

This ensures accurate results even in complex branching scenarios.

## Examples

### Review feature branch changes

```bash
$ git-branch-commits --oneline --author
● 7c3d4a2 (John Doe) Add user authentication
● 9f1e5b8 (John Doe) Update login form styles
● 2a6c9d1 (John Doe) Add password validation
```

### Check file changes before PR

```bash
$ git-branch-commits --stat
commit 7c3d4a2f8b9e1d3c5a7b9d2e4f6a8c0d2e4f6a8c
Author: John Doe <john@example.com>
Date:   Mon Oct 23 14:32:18 2023 -0700

    Add user authentication

 src/auth.ts    | 145 +++++++++++++++++++++++++++++++++
 src/routes.ts  |  12 ++-
 tests/auth.test.ts | 89 ++++++++++++++++++++
 3 files changed, 244 insertions(+), 2 deletions(-)
```

### Quick commit overview

```bash
$ git-branch-commits --oneline --number 5
● 7c3d4a2 Add user authentication
● 9f1e5b8 Update login form styles
● 2a6c9d1 Add password validation
● 4b7e3f9 Create user model
● 8d2a6c1 Setup authentication routes
```

## Development

```bash
# Clone the repository
git clone https://github.com/wyattjoh/git-branch-commits.git
cd git-branch-commits

# Run in development mode with file watching
deno task dev

# Run tests (when available)
deno test --allow-run --allow-read
```

## Requirements

- [Deno](https://deno.land/) 1.38 or higher
- Git 2.0 or higher
- Unix-like environment (macOS, Linux, WSL)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Wyatt Johnson
