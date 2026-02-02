import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface ProcessEvents {
  stdout: (data: string) => void;
  stderr: (data: string) => void;
  exit: (code: number | null) => void;
  acp: (message: any) => void;
}

export class ProcessWrapper extends EventEmitter {
  private child?: ChildProcess;

  constructor(
    private command: string,
    private args: string[],
    private cwd: string
  ) {
    super();
  }

  start(): number | undefined {
    this.child = spawn(this.command, this.args, {
      cwd: this.cwd,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (this.child.stdout) {
      this.child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.trim().startsWith('ACP:')) {
            try {
              const jsonStr = line.trim().substring(4).trim();
              const message = JSON.parse(jsonStr);
              this.emit('acp', message);
              // T026: Filter out raw ACP lines
              continue; 
            } catch (e) {
              // Not valid JSON, treat as regular log
            }
          }
          if (line) {
            this.emit('stdout', line);
          }
        }
      });
    }

    if (this.child.stderr) {
      this.child.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        const lines = text.split('\n');
        for (const line of lines) {
          if (line) this.emit('stderr', line);
        }
      });
    }

    this.child.on('exit', (code: number | null) => {
      this.emit('exit', code);
    });

    this.child.on('error', (err) => {
        console.error('Process spawn error:', err);
        this.emit('exit', 1);
    });

    return this.child.pid;
  }

  write(input: string): void {
    if (this.child && this.child.stdin) {
      this.child.stdin.write(input);
      if (!input.endsWith('\n')) {
        this.child.stdin.write('\n');
      }
    } else {
      throw new Error('Process not running or stdin not available');
    }
  }

  kill(): void {
    if (this.child) {
      this.child.kill();
    }
  }
}
