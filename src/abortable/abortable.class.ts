import { noop } from '../noop';
import { SingleEventEmitter } from '../single-event-emitter.class';
import { IDeriveAbortableResult } from './types/static-methods/derive/derive-abortable-result.type';
import { IAbortFunction } from './types/init/abort-function.type';
import { IAbortableInit } from './types/init/abortable-init.type';
import { IAbortableUnsubscribe } from './types/methods/on-abort/abortable-unsubscribe.type';

let STATIC_ABORTABLE_NEVER: Abortable;

export class Abortable {

  static get never(): Abortable {
    if (STATIC_ABORTABLE_NEVER === void 0) {
      STATIC_ABORTABLE_NEVER = new Abortable(noop);
    }
    return STATIC_ABORTABLE_NEVER;
  }

  static fromAbortSignal(
    signal: AbortSignal,
  ): Abortable {
    return new Abortable((
      abort: IAbortFunction,
    ): void => {
      if (signal.aborted) {
        abort(signal.reason);
      } else {
        signal.addEventListener('abort', () => {
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

  static derive(
    ...abortables: Abortable[]
  ): IDeriveAbortableResult {
    let abort!: IAbortFunction;

    const abortable = new Abortable((
      _abort: IAbortFunction,
    ): void => {
      abort = (
        reason: any,
      ): void => {
        for (let i = 0, l = unsubscribeList.length; i < l; i++) {
          unsubscribeList[i]();
        }
        _abort(reason);
      };

      const unsubscribeList: IAbortableUnsubscribe[] = abortables.map((abortable: Abortable): IAbortableUnsubscribe => {
        return abortable.onAbort(abort);
      });
    });

    return [
      abort,
      abortable,
    ];
  }

  static merge(
    ...abortables: Abortable[]
  ): Abortable {
    return this.derive(...abortables)[1];
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

