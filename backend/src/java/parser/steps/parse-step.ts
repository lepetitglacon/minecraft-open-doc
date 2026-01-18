export type StepStatus = 'pending' | 'running' | 'completed' | 'error';

export interface StepProgress {
  current: number;
  total: number;
}

export interface StepEvent {
  name: string;
  status: StepStatus;
  progress?: StepProgress;
  message?: string;
}

export type StepCallback = (event: StepEvent) => void;

export abstract class ParseStep<TInput = unknown, TOutput = unknown> {
  abstract readonly name: string;
  protected callback?: StepCallback;

  setCallback(callback: StepCallback): this {
    this.callback = callback;
    return this;
  }

  protected emit(
    status: StepStatus,
    progress?: StepProgress,
    message?: string,
  ): void {
    if (this.callback) {
      this.callback({
        name: this.name,
        status,
        progress,
        message,
      });
    }
  }

  protected start(message?: string): void {
    this.emit('running', undefined, message);
  }

  protected progress(current: number, total: number, message?: string): void {
    this.emit('running', { current, total }, message);
  }

  protected complete(message?: string): void {
    this.emit('completed', undefined, message);
  }

  protected error(message: string): void {
    this.emit('error', undefined, message);
  }

  abstract execute(input: TInput): Promise<TOutput>;
}
