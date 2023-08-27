import { noop } from './noop.private';

export interface ISingleEventEmitterObserver<GValue> {
  (
    value: GValue,
  ): void;
}

export interface ISingleEventEmitterUnsubscribe {
  (): void;
}

export class SingleEventEmitter<GValue> {
  #emitFunctions: (ISingleEventEmitterObserver<GValue> | undefined)[];
  #done: boolean;
  #value!: GValue;
  #valueConsumed: boolean;

  constructor() {
    this.#emitFunctions = [];
    this.#done = false;
    this.#valueConsumed = false;
  }

  get done(): boolean {
    return this.#done;
  }

  get value(): GValue {
    if (this.#done) {
      this.#valueConsumed = true;
    }
    return this.#value;
  }

  get valueConsumed(): boolean {
    return this.#valueConsumed;
  }

  emit(
    value: GValue,
  ): void {
    if (this.#done) {
      throw new Error(`SingleEventEmitter is done.`);
    } else {
      this.#done = true;
      this.#value = value;
      queueMicrotask((): void => {
        for (let i = 0, l = this.#emitFunctions.length; i < l; i++) {
          const emitFunction: ISingleEventEmitterObserver<GValue> | undefined = this.#emitFunctions[i];
          if (emitFunction !== void 0) {
            this.#valueConsumed = true;
            emitFunction(this.#value);
          }
        }
        this.#emitFunctions = [];
      });
    }
  }

  subscribe(
    emit: ISingleEventEmitterObserver<GValue>,
  ): ISingleEventEmitterUnsubscribe {
    if (this.#done) {
      queueMicrotask((): void => {
        this.#valueConsumed = true;
        emit(this.#value);
      });
      return noop;
    } else {
      this.#emitFunctions.push(emit);
      let running: boolean = true;

      return (): void => {
        if (running) {
          running = false;
          const index: number = this.#emitFunctions.indexOf(emit);
          if (index !== -1) {
            if (this.#done) { // we are dispatching
              this.#emitFunctions[index] = void 0;
            } else {
              this.#emitFunctions.splice(index, 1);
            }
          }
        }
      };
    }
  }
}
