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

    if (this.child.stdin) {
        this.child.stdin.on('error', (err) => {
             // Handle EPIPE (process exited before write completed) or other errors
             // console.warn(`Process stdin error (likely exited): ${err.message}`);
        });
    }

    if (this.child.stdout) {
      let buffer = '';
      this.child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        console.log(`[DEBUG] STDOUT RAW: ${JSON.stringify(text)}`); 
        buffer += text;
        
        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
            const line = buffer.substring(0, boundary);
            buffer = buffer.substring(boundary + 1);
            
            const trimmed = line.trim();
            // Support legacy/test 'ACP:' prefix OR standard JSON-RPC 2.0 messages
            if (trimmed.startsWith('ACP:') || (trimmed.startsWith('{') && trimmed.includes('"jsonrpc"'))) {
                try {
                    let jsonStr = trimmed;
                    if (trimmed.startsWith('ACP:')) {
                        jsonStr = trimmed.substring(4).trim();
                    }
                    const message = JSON.parse(jsonStr);
                    console.log('[DEBUG] ACP Message:', JSON.stringify(message));
                    this.emit('acp', message);
                    // Filter out ACP from stdout
                    boundary = buffer.indexOf('\n');
                    continue;
                } catch (e) {
                   console.error('[DEBUG] ACP Parse Error:', e);
                }
            }
            
            console.log('[DEBUG] STDOUT Line:', JSON.stringify(line));
            this.emit('stdout', line);
            boundary = buffer.indexOf('\n');
        }
        
        // Handle remaining buffer (prompts) if it's not empty and doesn't look like incomplete ACP
        if (buffer.length > 0 && !buffer.trimStart().startsWith('ACP:')) {
             console.log('[DEBUG] STDOUT Partial:', JSON.stringify(buffer));
             this.emit('stdout', buffer);
             buffer = '';
        }
      });
    }

    if (this.child.stderr) {
      this.child.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        // console.log(`[DEBUG] STDERR RAW: ${JSON.stringify(text)}`);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line) this.emit('stderr', line);
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
