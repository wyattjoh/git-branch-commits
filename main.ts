#!/usr/bin/env -S deno run --allow-run --allow-read

interface GitLogOptions {
  oneline?: boolean;
  stat?: boolean;
  files?: boolean;
  author?: boolean;
  date?: boolean;
  graph?: boolean;
  number?: number;
}

async function runGitCommand(
  args: string[]
): Promise<{ success: boolean; output: string }> {
  try {
    const cmd = new Deno.Command("git", {
      args,
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await cmd.output();
    const output = new TextDecoder().decode(stdout).trim();

    if (code !== 0) {
      const error = new TextDecoder().decode(stderr).trim();
      return { success: false, output: error || output };
    }

    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      output: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getCurrentBranch(): Promise<string | null> {
  const result = await runGitCommand(["rev-parse", "--abbrev-ref", "HEAD"]);
  return result.success ? result.output : null;
}

export async function getUpstreamBranch(): Promise<string | null> {
  const result = await runGitCommand([
    "rev-parse",
    "--abbrev-ref",
    "--symbolic-full-name",
    "@{u}",
  ]);
  return result.success ? result.output : null;
}

export async function findParentBranch(
  currentBranch: string
): Promise<string | null> {
  // Method 1: Check if there's an upstream tracking branch
  const upstream = await getUpstreamBranch();
  if (upstream) {
    return upstream;
  }

  // Method 2: Find the branch that shares the most recent commit with current branch
  // Get the first parent commit of HEAD
  const firstParentResult = await runGitCommand(["rev-parse", "HEAD^"]);
  if (!firstParentResult.success) {
    return null;
  }
  const firstParent = firstParentResult.output;

  // Find which branches contain this commit
  const containingResult = await runGitCommand([
    "branch",
    "--contains",
    firstParent,
  ]);
  if (!containingResult.success) {
    return null;
  }

  const containingBranches = containingResult.output
    .split("\n")
    .map((line) => line.replace("*", "").trim())
    .filter((branch) => branch && branch !== currentBranch);

  if (containingBranches.length === 1) {
    return containingBranches[0];
  }

  if (containingBranches.length > 1) {
    // Find the one with fewest unique commits
    let bestBranch = "";
    let minCommits = 999999;

    for (const branch of containingBranches) {
      const countResult = await runGitCommand([
        "rev-list",
        "--count",
        `${branch}..${currentBranch}`,
      ]);
      if (countResult.success) {
        const count = parseInt(countResult.output);
        if (count < minCommits) {
          minCommits = count;
          bestBranch = branch;
        }
      }
    }

    if (bestBranch) {
      return bestBranch;
    }
  }

  // Method 3: Fallback - find branch with minimum unique commits
  const branchesResult = await runGitCommand([
    "for-each-ref",
    "--format=%(refname:short)",
    "refs/heads/",
  ]);
  if (!branchesResult.success) {
    return null;
  }

  const branches = branchesResult.output
    .split("\n")
    .filter((branch) => branch && branch !== currentBranch);

  let bestBranch = "";
  let minCommits = 999999;

  for (const branch of branches) {
    const countResult = await runGitCommand([
      "rev-list",
      "--count",
      `${branch}..${currentBranch}`,
    ]);
    if (countResult.success) {
      const count = parseInt(countResult.output);
      if (count > 0 && count < minCommits) {
        minCommits = count;
        bestBranch = branch;
      }
    }
  }

  return bestBranch || null;
}

export async function getCommitCount(
  parentBranch: string,
  currentBranch: string
): Promise<number> {
  const result = await runGitCommand([
    "rev-list",
    "--count",
    `${parentBranch}..${currentBranch}`,
  ]);
  return result.success ? parseInt(result.output) : 0;
}

export async function getFilesChanged(
  parentBranch: string,
  currentBranch: string
): Promise<number> {
  const result = await runGitCommand([
    "diff",
    "--name-only",
    `${parentBranch}..${currentBranch}`,
  ]);
  if (!result.success) return 0;
  const files = result.output.split("\n").filter((f) => f.trim());
  return files.length;
}

export async function getDiffStats(
  parentBranch: string,
  currentBranch: string
): Promise<string> {
  const result = await runGitCommand([
    "diff",
    "--shortstat",
    `${parentBranch}..${currentBranch}`,
  ]);
  return result.success ? result.output.trim() : "";
}

export async function showCommits(
  parentBranch: string,
  currentBranch: string,
  options: GitLogOptions
) {
  const args = ["--no-pager", "log"];

  if (options.oneline) {
    args.push("--oneline");
  } else if (options.author) {
    args.push("--pretty=format:%h - %an <%ae> - %s");
  } else if (options.date) {
    args.push("--pretty=format:%h - %ad - %s", "--date=short");
  } else {
    args.push("--pretty=format:%h - %ad - %s <%an>", "--date=relative");
  }

  if (options.stat) {
    args.push("--stat");
  }

  if (options.files) {
    args.push("--name-status");
  }

  if (options.graph) {
    args.push("--graph");
  }

  if (options.number) {
    args.push(`-n`, options.number.toString());
  }

  args.push(`${parentBranch}..${currentBranch}`);

  const result = await runGitCommand(args);
  if (result.success) {
    console.log(result.output.trim());
  }
}

function showUsage() {
  console.log(
    `Usage: deno run --allow-run --allow-read git-branch-commits.ts [OPTIONS]

Lists all commits that exist only in the current branch and not in its parent branch.

OPTIONS:
    -p, --parent BRANCH    Specify the parent branch explicitly
    -o, --oneline         Show commits in oneline format
    -s, --stat            Show file statistics for each commit
    -f, --files           Show list of changed files
    -a, --author          Show author information
    -d, --date            Show commit dates
    -g, --graph           Show ASCII graph of commits
    -n, --number NUM      Limit output to NUM commits
    -h, --help            Show this help message

EXAMPLES:
    deno run --allow-run --allow-read git-branch-commits.ts
    deno run --allow-run --allow-read git-branch-commits.ts -p main
    deno run --allow-run --allow-read git-branch-commits.ts -o -g
    deno run --allow-run --allow-read git-branch-commits.ts -s -n 10`
  );
}

async function main() {
  const args = Deno.args;
  const options: GitLogOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "-o":
      case "--oneline":
        options.oneline = true;
        break;
      case "-s":
      case "--stat":
        options.stat = true;
        break;
      case "-f":
      case "--files":
        options.files = true;
        break;
      case "-a":
      case "--author":
        options.author = true;
        break;
      case "-d":
      case "--date":
        options.date = true;
        break;
      case "-g":
      case "--graph":
        options.graph = true;
        break;
      case "-n":
      case "--number":
        options.number = parseInt(args[++i]);
        break;
      case "-h":
      case "--help":
        showUsage();
        Deno.exit(0);
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        showUsage();
        Deno.exit(1);
    }
  }

  // Check if we're in a git repository
  const gitCheck = await runGitCommand(["rev-parse", "--git-dir"]);
  if (!gitCheck.success) {
    console.error("Error: Not in a git repository");
    Deno.exit(1);
  }

  // Get current branch
  const currentBranch = await getCurrentBranch();
  if (!currentBranch) {
    console.error("Error: Could not determine current branch");
    Deno.exit(1);
  }

  if (currentBranch === "HEAD") {
    console.error("Error: You are in a detached HEAD state");
    Deno.exit(1);
  }

  console.log(`- Current branch: ${currentBranch}`);

  // Find parent branch
  const parentBranch = await findParentBranch(currentBranch);
  if (!parentBranch) {
    console.error("Error: Could not determine parent branch");
    Deno.exit(1);
  }

  console.log(`- Parent branch: ${parentBranch}`);

  // Check if parent branch exists
  const checkLocal = await runGitCommand([
    "show-ref",
    "--verify",
    "--quiet",
    `refs/heads/${parentBranch}`,
  ]);
  const checkRemote = await runGitCommand([
    "show-ref",
    "--verify",
    "--quiet",
    `refs/remotes/${parentBranch}`,
  ]);

  if (!checkLocal.success && !checkRemote.success) {
    console.error(`Error: Parent branch '${parentBranch}' does not exist`);
    Deno.exit(1);
  }

  // Count commits
  const commitCount = await getCommitCount(parentBranch, currentBranch);

  if (commitCount === 0) {
    console.warn(`- No commits found that are unique to ${currentBranch}`);
    console.log(`- Your branch is up to date with ${parentBranch}`);
    Deno.exit(0);
  }

  console.log(`- Found ${commitCount} commits unique to ${currentBranch}:\n`);

  // Show the commits
  await showCommits(parentBranch, currentBranch, options);

  // Show summary
  console.log("\nSummary:");
  console.log(`- Total unique commits: ${commitCount}`);

  const filesChanged = await getFilesChanged(parentBranch, currentBranch);
  console.log(`- Total files changed: ${filesChanged}`);

  const stats = await getDiffStats(parentBranch, currentBranch);
  if (stats) {
    console.log(`- Changes: ${stats}`);
  }
}

// Run the main function
if (import.meta.main) {
  main().catch((error) => {
    console.error(`Error: ${error.message}`);
    Deno.exit(1);
  });
}
