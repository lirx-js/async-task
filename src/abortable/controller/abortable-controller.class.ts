import { Abortable } from '../abortable.class';
import { IAbortFunction } from '../types/init/abort-function.type';

export class AbortableController {
  readonly #abortable: Abortable;
  // readonly
  #abort!: IAbortFunction;

  constructor(abortables: Iterable<Abortable> = []) {
    const abortable: Abortable = new Abortable((abort: IAbortFunction): void => {
      this.#abort = abort;
    });

    this.#abortable = Abortable.any([abortable, ...abortables]);
  }

  get abortable(): Abortable {
    return this.#abortable;
  }

  get abort(): IAbortFunction {
    return this.#abort;
  }
}
