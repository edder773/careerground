import { spawn, type ChildProcess } from 'node:child_process';

const packageManagerPath = process.env.npm_execpath;
const children: ChildProcess[] = [];
let stopping = false;

const stop = (signal: NodeJS.Signals, exitCode = 0) => {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  }
};

const start = (command: string, args: string[]) => {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
  children.push(child);

  child.once('error', (error) => {
    process.stderr.write(`${error.message}\n`);
    stop('SIGTERM', 1);
  });
  child.once('exit', (code, signal) => {
    if (stopping) return;
    stop('SIGTERM', code ?? (signal ? 1 : 0));
  });
};

process.once('SIGINT', () => stop('SIGINT', 130));
process.once('SIGTERM', () => stop('SIGTERM', 143));

start(process.execPath, ['--import', 'tsx', 'deployment/sites/local-d1-server.ts']);

if (packageManagerPath) {
  start(process.execPath, [packageManagerPath, '--filter', '@careerground/web', 'dev']);
} else {
  start('pnpm', ['--filter', '@careerground/web', 'dev']);
}
