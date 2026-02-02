import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface ProcessEvents {
  stdout: (data: string) => void;
  stderr: (data: string) => void;
  exit: (code: number | null) => void;
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
    // Split command string if no args provided, or execute as shell command
    const [cmd, ...cmdArgs] = this.args.length > 0 ? [this.command, ...this.args] : this.command.split(' ');
    
    // Use shell: true to handle complex command strings like "python script.py"
    this.child = spawn(this.command, this.args, {
      cwd: this.cwd,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (this.child.stdout) {
      this.child.stdout.on('data', (data: Buffer) => {
        this.emit('stdout', data.toString());
      });
    }

    if (this.child.stderr) {
      this.child.stderr.on('data', (data: Buffer) => {
        this.emit('stderr', data.toString());
      });
    }

    this.child.on('exit', (code: number | null) => {
      this.emit('exit', code);
    });

    this.child.on('error', (err) => {
        console.error('Process spawn error:', err);
        // Maybe emit exit with error code?
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