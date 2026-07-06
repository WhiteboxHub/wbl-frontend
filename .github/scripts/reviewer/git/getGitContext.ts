import { execSync } from 'child_process';

export function getChangedLines(): Map<string, number[]> {
  const targetBranch = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
  const diffOutput = execSync(`git diff --unified=0 -w -B ${targetBranch}...HEAD`, { encoding: 'utf-8' });
  const lines = diffOutput.split('\n');
  const changes = new Map<string, number[]>();
  let currentFile = '';

  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.substring(6);
    } else if (line.startsWith('@@ ') && currentFile) {
      const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
      if (match) {
        const start = parseInt(match[1], 10);
        const count = match[2] ? parseInt(match[2], 10) : 1;
        if (!changes.has(currentFile)) changes.set(currentFile, []);
        for (let i = 0; i < count; i++) {
          changes.get(currentFile)!.push(start + i);
        }
      }
    }
  }
  return changes;
}

export function getGitContext() {
  const targetBranch = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
  let diffText = "";
  let addedFiles = new Set<string>();
  
  try {
    diffText = execSync(`git diff --unified=3 ${targetBranch}...HEAD`, { encoding: 'utf-8' });
    const addedFilesOut = execSync(`git diff --name-status ${targetBranch}...HEAD`, { encoding: 'utf-8' });
    addedFilesOut.split('\n').forEach(line => {
      if (line.startsWith('A\t')) {
        addedFiles.add(line.split('\t')[1].trim());
      }
    });
  } catch (e) {
    console.error("Failed to get git diff", e);
  }
  
  return { diffText, addedFiles };
}
