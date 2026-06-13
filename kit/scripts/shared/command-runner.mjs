import { spawn } from 'node:child_process';

export function createCommandRunner({ spawnImpl = spawn, now = () => Date.now() } = {}) {
  return {
    run(command, args = [], options = {}) {
      const startedAt = now();
      const cwd = options.cwd ?? process.cwd();
      const timeoutMs = options.timeoutMs ?? 60_000;

      return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        let settled = false;
        let timer;
        const child = spawnImpl(command, args, {
          cwd,
          env: options.env ?? process.env,
          shell: false,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        const finish = (exitCode, signal, error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (error) stderr = `${stderr}${stderr ? '\n' : ''}${error.message}`;
          resolve({
            ok: exitCode === 0 && !error,
            exitCode,
            signal,
            stdout,
            stderr,
            command,
            args: [...args],
            cwd,
            durationMs: now() - startedAt,
          });
        };

        child.stdout?.setEncoding('utf8');
        child.stderr?.setEncoding('utf8');
        child.stdout?.on('data', (chunk) => {
          stdout += chunk;
        });
        child.stderr?.on('data', (chunk) => {
          stderr += chunk;
        });
        child.on('error', (error) => finish(null, null, error));
        child.on('close', (code, signal) => finish(code, signal, null));

        timer = setTimeout(() => {
          child.kill('SIGTERM');
          finish(null, 'SIGTERM', new Error(`Command timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });
    },
  };
}
