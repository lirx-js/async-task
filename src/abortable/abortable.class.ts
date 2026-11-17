import { cleanUnsubscribeSet, IUnsubscribeSet, unsubscribeSet } from '@lirx/unsubscribe';
import { TimeoutError } from '../errors/timeout-error.class';
import { noop } from '../helpers/noop.private';
import { SingleEventEmitter } from '../helpers/single-event-emitter.class.private';
import { IAbortFunction } from './types/init/abort-function.type';
import { IAbortableInit } from './types/init/abortable-init.type';
import { IAbortableUnsubscribe } from './types/methods/on-abort/abortable-unsubscribe.type';

export class Abortable {
  static readonly never: Abortable = new Abortable(noop);

  static fromAbortSignal(signal: AbortSignal): Abortable {
    return new Abortable((abort: IAbortFunction): void => {
      if (signal.aborted) {
        abort(signal.reason);
      } else {
        signal.addEventListener(
          'abort',
          (): void => {
            abort(signal.reason);
          },
          { once: true },
        );
      }
    });
  }

  static abort(reason?: unknown): Abortable {
    return new Abortable((abort: IAbortFunction): void => {
      abort(reason);
    });
  }

  static timeout(ms: number): Abortable {
    return new Abortable((abort: IAbortFunction): void => {
      setTimeout((): void => {
        abort(new TimeoutError());
      }, ms);
    });
  }

  static any(abortables: Iterable<Abortable>): Abortable {
    if (Array.isArray(abortables)) {
      if (abortables.length === 0) {
        return this.never;
      } else if (abortables.length === 1) {
        return abortables[0];
      }
    }
    return new Abortable((_abort: IAbortFunction): void => {
      const toUnsubscribe: IUnsubscribeSet = unsubscribeSet();

      const clean = (): void => {
        cleanUnsubscribeSet(toUnsubscribe);
      };

      const abort = (reason?: unknown): void => {
        clean();
        _abort(reason);
      };

      const iterator: Iterator<Abortable> = abortables[Symbol.iterator]();
      let result: IteratorResult<Abortable>;
      while (!(result = iterator.next()).done) {
        const abortable: Abortable = result.value;
        if (abortable.aborted) {
          abort(abortable.reason);
          break;
        } else {
          const unsubscribeOfOnAbort: IAbortableUnsubscribe = abortable.onAbort(
            (reason?: unknown): void => {
              unsubscribeOfOnAbort();
              toUnsubscribe.delete(unsubscribeOfOnAbort);
              abort(reason);
            },
          );

          toUnsubscribe.add(unsubscribeOfOnAbort);
        }
      }
    });
  }

  readonly #abortEventEmitter: SingleEventEmitter<unknown>;

  constructor(init: IAbortableInit) {
    this.#abortEventEmitter = new SingleEventEmitter<unknown>();

    init((reason?: unknown): void => {
      if (!this.aborted) {
        this.#abortEventEmitter.emit(reason);
      }
    });
  }

  get aborted(): boolean {
    return this.#abortEventEmitter.done;
  }

  get reason(): unknown {
    return this.#abortEventEmitter.value;
  }

  onAbort(onAbort: IAbortFunction): IAbortableUnsubscribe {
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
