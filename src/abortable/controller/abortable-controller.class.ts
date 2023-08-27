import { IAbortFunction } from '../types/init/abort-function.type';
import { IAbortableUnsubscribe } from '../types/methods/on-abort/abortable-unsubscribe.type';
import { unsubscribeSet, IUnsubscribeSet, cleanUnsubscribeSet } from '@lirx/unsubscribe';
import { Abortable } from '../abortable.class';

export class AbortableController {
  readonly #abortable: Abortable;
  // readonly
  #abort!: IAbortFunction;

  constructor(
    abortables: Abortable[] = [],
  ) {
    this.#abortable = new Abortable((
      _abort: IAbortFunction,
    ): void => {
      const toUnsubscribe: IUnsubscribeSet = unsubscribeSet();

      const clean = (): void => {
        cleanUnsubscribeSet(toUnsubscribe);
      };

      this.#abort = (
        reason: any,
      ): void => {
        clean();
        _abort(reason);
      };

      for (let i = 0, l = abortables.length; i < l; i++) {
        const abortable: Abortable = abortables[i];
        if (abortable.aborted) {
          this.#abort(abortable.reason);
          break;
        } else {
          const unsubscribeOfOnAbort: IAbortableUnsubscribe = abortable.onAbort((reason: any): void => {
            unsubscribeOfOnAbort();
            toUnsubscribe.delete(unsubscribeOfOnAbort);
            this.#abort(reason);
          });

          toUnsubscribe.add(unsubscribeOfOnAbort);
        }
      }
    });
  }

  get abortable(): Abortable {
    return this.#abortable;
  }

  get abort(): IAbortFunction {
    return this.#abort;
  }
}
