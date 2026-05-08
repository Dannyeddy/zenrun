import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const viteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const codexNode = path.join(
  process.env.USERPROFILE ?? '',
  '.cache',
  'codex-runtimes',
  'codex-primary-runtime',
  'dependencies',
  'node',
  'bin',
  'node.exe',
);

const preferredNode =
  process.platform === 'win32' && existsSync(codexNode) ? codexNode : process.execPath;

const result = spawnSync(preferredNode, [viteBin, 'build'], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
  windowsHide: true,
});

process.exit(result.status ?? 1);
