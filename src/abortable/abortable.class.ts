import { noop } from '../helpers/noop.private';
import { SingleEventEmitter } from '../helpers/single-event-emitter.class.private';
import { IAbortFunction } from './types/init/abort-function.type';
import { IAbortableInit } from './types/init/abortable-init.type';
import { IAbortableUnsubscribe } from './types/methods/on-abort/abortable-unsubscribe.type';

export class Abortable {
  static readonly never: Abortable = new Abortable(noop);

  static fromAbortSignal(
    signal: AbortSignal,
  ): Abortable {
    return new Abortable((
      abort: IAbortFunction,
    ): void => {
      if (signal.aborted) {
        abort(signal.reason);
      } else {
        signal.addEventListener('abort', (): void => {
          abort(signal.reason);
        }, { once: true });
      }
    });
  }

  static abort(
    reason: any,
  ): Abortable {
    return new Abortable((
      abort: IAbortFunction,
    ): void => {
      abort(reason);
    });
  }

  static timeout(
    ms: number,
  ): Abortable {
    return new Abortable((
      abort: IAbortFunction,
    ): void => {
      setTimeout(() => {
        abort(new Error(`Timeout`));
      }, ms);
    });
  }

  readonly #abortEventEmitter: SingleEventEmitter<any>;

  constructor(
    init: IAbortableInit,
  ) {
    this.#abortEventEmitter = new SingleEventEmitter<any>();

    init((
      reason: any,
    ): void => {
      if (!this.aborted) {
        this.#abortEventEmitter.emit(reason);
      }
    });
  }

  get aborted(): boolean {
    return this.#abortEventEmitter.done;
  }

  get reason(): any {
    return this.#abortEventEmitter.value;
  }

  onAbort(
    onAbort: IAbortFunction,
  ): IAbortableUnsubscribe {
    return this.#abortEventEmitter.subscribe(onAbort);
  }

  throwIfAborted(): void {
    if (this.aborted) {
      throw this.reason;
    }
  }

  toAbortSignal(): AbortSignal {
    const controller: AbortController = new AbortController();
    if (this.aborted) {
      controller.abort(this.reason);
    } else {
      this.onAbort((): void => {
        controller.abort(this.reason);
      });
    }
    return controller.signal;
  }
}
