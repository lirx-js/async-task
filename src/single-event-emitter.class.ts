import { noop } from './noop';

export interface ISingleEventEmitterObserver<GValue> {
  (
    value: GValue,
  ): void;
}

export interface ISingleEventEmitterUnsubscribe {
  (): void;
}

export class SingleEventEmitter<GValue> {
  #emitFunctions: ISingleEventEmitterObserver<GValue>[];
  #done: boolean;
  #value!: GValue;

  constructor() {
    this.#emitFunctions = [];
    this.#done = false;
  }

  get done(): boolean {
    return this.#done;
  }

  get value(): GValue {
    return this.#value;
  }

  get isEmpty(): boolean {
    return this.#emitFunctions.length === 0;
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
          this.#emitFunctions[i](value);
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
              this.#emitFunctions[index] = noop;
            } else {
              this.#emitFunctions.splice(index, 1);
            }
          }
        }
      };
    }
  }
}
