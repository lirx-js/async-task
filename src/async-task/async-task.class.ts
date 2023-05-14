import { Abortable } from '../abortable/abortable.class';
import { noop } from '../noop';
import { SingleEventEmitter } from '../single-event-emitter.class';
import { IAsyncTaskAllSettledState } from './async-task-all-settled-state.type';
import { IAsyncTaskAllSettledValuesListReturn } from './async-task-all-settled-values-list-return.type';
import { IAsyncTaskConstraint } from './types/async-task-constraint.type';
import { IAsyncTaskInput } from './types/async-task-input.type';
import { IAsyncTaskFactory } from './types/factory/async-task-factory.type';
import { IGenericAsyncTaskFactoriesList } from './types/factory/generic-async-task-factories-list.type';
import { IAsyncTaskErrorFunction } from './types/init/async-task-error-function.type';
import { IAsyncTaskInitFunction } from './types/init/async-task-init-function.type';
import { IAsyncTaskSuccessFunction } from './types/init/async-task-success-function.type';
import { IAsyncTaskOnAbortedFunction } from './types/methods/aborted/async-task-on-aborted-function.type';
import { IAsyncTaskOnErroredFunction } from './types/methods/errored/async-task-on-errored-function.type';
import { IAsyncTaskOnFinallyFunction } from './types/methods/finally/async-task-on-finally-function.type';
import { IAsyncTaskOnSuccessfulFunction } from './types/methods/successful/async-task-on-successful-function.type';
import { IAsyncTaskState } from './types/state/async-task-state.type';
import { IAsyncTaskAllValuesListReturn } from './types/static-methods/all/async-task-all-values-list-return.type';
import { IAsyncTaskRaceValueReturn } from './types/static-methods/race/async-task-race-value-return.type';

/*--------------------*/

export const ASYNC_TASK_SUCCESS = Symbol();

const PENDING_STATE = 0;
const RESOLVING_STATE = 1;
const RESOLVED_STATE = 2;

type IAsyncTaskPrivateState =
  | typeof PENDING_STATE
  | typeof RESOLVING_STATE
  | typeof RESOLVED_STATE
  ;

export class AsyncTask<GValue extends IAsyncTaskConstraint<GValue>> {
  /**
   * Creates an AsyncTask from an IAsyncTaskFactory.
   */
  static fromFactory<GValue extends IAsyncTaskConstraint<GValue>>(
    factory: IAsyncTaskFactory<GValue>,
    abortable: Abortable,
  ): AsyncTask<GValue> {
    if (abortable.aborted) {
      return this.never(abortable);
    } else {
      let input: IAsyncTaskInput<GValue>;

      try {
        input = factory(abortable);
      } catch (error: unknown) {
        return this.error<GValue>(error, abortable);
      }

      if (input instanceof AsyncTask) {
        if (input.#abortable === abortable) {
          return input;
        } else {
          throw new Error(`AsyncTask must have the same Abortable than the one provided.`);
        }
      } else {
        return this.success(input, abortable);
      }
    }
  }

  /**
   * Creates a "successful" AsyncTask.
   * If "value" is an AsyncTask or Promise, then the returned AsyncTask will take the same state when resolved.
   */
  static success<GValue extends IAsyncTaskConstraint<GValue>>(
    value: IAsyncTaskInput<GValue>,
    abortable: Abortable,
  ): AsyncTask<GValue> {
    return new AsyncTask<GValue>((
      success: IAsyncTaskSuccessFunction<GValue>,
    ): void => {
      success(value);
    }, abortable);
  }

  /**
   * Creates an "errored" AsyncTask.
   */
  static error<GValue extends IAsyncTaskConstraint<GValue> = any>(
    _error: any,
    abortable: Abortable,
  ): AsyncTask<GValue> {
    return new AsyncTask<GValue>((
      success: IAsyncTaskSuccessFunction<GValue>,
      error: IAsyncTaskErrorFunction,
    ): void => {
      error(_error);
    }, abortable);
  }

  /**
   * Creates an AsyncTask that never complete (never enter in a "success" or "error" state).
   * However, it can still be aborted.
   */
  static never<GValue extends IAsyncTaskConstraint<GValue> = any>(
    abortable: Abortable,
  ): AsyncTask<GValue> {
    return new AsyncTask<GValue>(noop, abortable);
  }

  /**
   * Creates a "successful" AsyncTask, whose value is "undefined".
   */
  static void(
    abortable: Abortable,
  ): AsyncTask<void> {
    return this.success<void>(void 0, abortable);
  }

  /**
   * Creates a AsyncTask, whose Abortable is aborted when "success" or "error" is called.
   * This is sometimes useful to clear some resources.
   */
  static abortOnFinished<GValue extends IAsyncTaskConstraint<GValue>>(
    init: IAsyncTaskInitFunction<GValue>,
    abortable: Abortable,
  ): AsyncTask<GValue> {
    return new AsyncTask<GValue>((
      success: IAsyncTaskSuccessFunction<GValue>,
      error: IAsyncTaskErrorFunction,
      abortable: Abortable,
    ): void => {
      const [_abort, _abortable] = Abortable.derive(abortable);

      init(
        (
          value: IAsyncTaskInput<GValue>,
        ): void => {
          _abort(ASYNC_TASK_SUCCESS);
          success(value);
        },
        (
          __error: any,
        ): void => {
          _abort(__error);
          error(__error);
        },
        _abortable,
      );
    }, abortable);
  }

  /**
   * Returns an AsyncTask resolved with all the values returned by the factories (as an array).
   * If any of the AsyncTasks returned by the factories enters in an "error" state, the returned AsyncTask enters in an "error" state too,
   * add all other factories are aborted.
   */
  static all<GFactories extends IGenericAsyncTaskFactoriesList>(
    factories: GFactories,
    abortable: Abortable,
  ): AsyncTask<IAsyncTaskAllValuesListReturn<GFactories>> {
    type GValues = IAsyncTaskAllValuesListReturn<GFactories>;
    type GValue = GValues[number];

    return this.abortOnFinished<GValues>((
      success: IAsyncTaskSuccessFunction<GValues>,
      error: IAsyncTaskErrorFunction,
      abortable: Abortable,
    ): void => {
      let done: number = 0;
      let total: number = 0;
      let values: GValues;

      const successIfDone = (): void => {
        if (done === total) {
          success(values);
        }
      };

      const iterator: Iterator<IAsyncTaskFactory<GValue>> = factories[Symbol.iterator]();
      let result: IteratorResult<IAsyncTaskFactory<GValue>>;

      while (!(result = iterator.next()).done) {
        const i: number = total;
        total++;

        const task: AsyncTask<GValue> = this.fromFactory(result.value, abortable);
        task.#stateEventEmitter.subscribe((
          state: IAsyncTaskState<GValues>,
        ): void => {
          if (state.state === 'success') {
            done++;
            values[i] = state.value;
            successIfDone();
          } else if (state.state === 'error') {
            error(state.error);
          }
        });
      }

      values = new Array(total) as GValues;
      successIfDone();
    }, abortable);
  }

  /**
   * Returns an AsyncTask resolved with the first value or error returned by the factories.
   * When it appends, all the other factories are aborted.
   */
  static race<GFactories extends IGenericAsyncTaskFactoriesList>(
    factories: GFactories,
    abortable: Abortable,
  ): AsyncTask<IAsyncTaskRaceValueReturn<GFactories>> {
    type GValue = IAsyncTaskRaceValueReturn<GFactories>;

    return this.abortOnFinished<GValue>((
      success: IAsyncTaskSuccessFunction<GValue>,
      error: IAsyncTaskErrorFunction,
      abortable: Abortable,
    ): void => {
      const iterator: Iterator<IAsyncTaskFactory<GValue>> = factories[Symbol.iterator]();
      let result: IteratorResult<IAsyncTaskFactory<GValue>>;

      while (!(result = iterator.next()).done) {
        const task: AsyncTask<GValue> = this.fromFactory(result.value, abortable);
        task.#stateEventEmitter.subscribe((
          state: IAsyncTaskState<GValue>,
        ): void => {
          if (state.state === 'success') {
            success(state.value);
          } else if (state.state === 'error') {
            error(state.error);
          }
        });
      }
    }, abortable);
  }

  /**
   * Returns a "successful" AsyncTask when all the factories are resolved.
   * The result is an array with the state of each of these factories.
   */
  static allSettled<GFactories extends IGenericAsyncTaskFactoriesList>(
    factories: GFactories,
    abortable: Abortable,
  ): AsyncTask<IAsyncTaskAllSettledValuesListReturn<GFactories>> {
    type GValues = IAsyncTaskAllSettledValuesListReturn<GFactories>;
    type GValue = GValues[number];

    return new AsyncTask<GValues>((
      success: IAsyncTaskSuccessFunction<GValues>,
    ): void => {
      let done: number = 0;
      let total: number = 0;
      let values: IAsyncTaskAllSettledState<any>[];

      const successIfDone = (): void => {
        if (done === total) {
          success(values as GValues);
        }
      };

      const iterator: Iterator<IAsyncTaskFactory<GValue>> = factories[Symbol.iterator]();
      let result: IteratorResult<IAsyncTaskFactory<GValue>>;

      while (!(result = iterator.next()).done) {
        const i: number = total;
        total++;

        const task: AsyncTask<GValue> = this.fromFactory(result.value, abortable);
        task.#stateEventEmitter.subscribe((
          state: IAsyncTaskState<GValue>,
        ): void => {
          if (
            (state.state === 'success')
            || (state.state === 'error')
          ) {
            done++;
            values[i] = state;
            successIfDone();
          }
        });
      }

      values = new Array(total) as GValues;
      successIfDone();
    }, abortable);
  }

  // the internal state of this AsyncTask
  #state: IAsyncTaskPrivateState;
  // the state of this AsyncTask represented as an EventEmitter
  readonly #stateEventEmitter: SingleEventEmitter<IAsyncTaskState<GValue>>;
  // the abortable linked to this AsyncTask
  readonly #abortable: Abortable;

  constructor(
    init: IAsyncTaskInitFunction<GValue>,
    abortable: Abortable,
  ) {
    this.#state = PENDING_STATE;
    this.#stateEventEmitter = new SingleEventEmitter<IAsyncTaskState<GValue>>();
    this.#abortable = abortable;

    // leaves the "resolving" state, and enters in a "resolved" state.
    const _resolve = (
      state: IAsyncTaskState<GValue>,
    ): void => {
      if (this.#state === RESOLVING_STATE) {
        this.#state = RESOLVED_STATE;
        this.#stateEventEmitter.emit(state);
        if (
          (state.state === 'error')
          && this.#stateEventEmitter.isEmpty
        ) {
          console.error(`Uncaught (in AsyncTask)`, state.error);
        }
      }
    };

    // resolves this AsyncTask into an "abort" state
    const _abort = (
      reason: any,
    ): void => {
      _resolve({
        state: 'abort',
        reason,
      });
    };

    // aborts this AsyncTask
    const abort = (
      reason: any,
    ): void => {
      if (this.#state === PENDING_STATE) {
        this.#state = RESOLVING_STATE;
        _abort(reason);
      }
    };

    if (abortable.aborted) {
      abort(abortable.reason);
    } else {
      abortable.onAbort(abort);

      // resolves an IAsyncTaskInput:
      // it waits until the provided "input" is fully resolved, and calls the corresponding callback.
      // - a Promise: fulfilled => success(), rejected => error()
      // - a AsyncTask: successful => success(), errored => error(), aborted => abort()
      // - another value: success()
      // this garanties that the "value" given to this AsyncTask follows the IAsyncTaskConstraint.
      const _resolveInput = <GValue extends IAsyncTaskConstraint<GValue>>(
        input: IAsyncTaskInput<GValue>,
        abortable: Abortable,
        success: (
          value: GValue,
        ) => void,
        error: (
          error: any,
        ) => void,
        abort: (
          reason: any,
        ) => void,
      ): void => {
        if (input instanceof AsyncTask) {
          if (input.#abortable === abortable) {
            input.#stateEventEmitter.subscribe((
              state: IAsyncTaskState<GValue>,
            ): void => {
              if (state.state === 'success') {
                success(state.value);
              } else if (state.state === 'error') {
                error(state.error);
              } else if (state.state === 'abort') {
                abort(state.reason);
              }
            });
          } else {
            queueMicrotask(() => {
              error(new Error(`AsyncTask must have the same Abortable than the one provided.`));
            });
          }
        } else if (input instanceof Promise) {
          input.then(
            (
              value: GValue,
            ): void => {
              _resolveInput<GValue>(
                value,
                abortable,
                success,
                error,
                abort,
              );
            },
            (
              _error: any,
            ): any => {
              _resolveInput<GValue>(
                _error,
                abortable,
                error,
                error,
                abort,
              );
            },
          );
        } else {
          queueMicrotask(() => {
            success(input);
          });
        }
      };

      // resolves this AsyncTask into a "success" state
      const _success = (
        value: GValue,
      ): void => {
        _resolve({
          state: 'success',
          value,
        });
      };

      // resolves this AsyncTask into an "error" state
      const _error = (
        error: any,
      ): void => {
        _resolve({
          state: 'error',
          error,
        });
      };

      // resolves this AsyncTask with potentially a "success" state (it depends on the provided value).
      const success = (
        value: IAsyncTaskInput<GValue>,
      ): void => {
        if (this.#state === PENDING_STATE) {
          this.#state = RESOLVING_STATE;
          _resolveInput(
            value,
            abortable,
            _success,
            _error,
            _abort,
          );
        }
      };

      // resolves this AsyncTask with an "error" state.
      const error = (
        error: any,
      ): void => {
        if (this.#state === PENDING_STATE) {
          this.#state = RESOLVING_STATE;
          _resolveInput(
            error,
            abortable,
            _error,
            _error,
            _abort,
          );
        }
      };

      try {
        init(
          success,
          error,
          abortable,
        );
      } catch (_error: unknown) {
        error(_error);
      }
    }
  }

  then<GNewValue extends IAsyncTaskConstraint<GNewValue>>(
    onSuccessful: IAsyncTaskOnSuccessfulFunction<GValue, GNewValue>,
    onErrored: IAsyncTaskOnErroredFunction<GNewValue>,
  ): AsyncTask<GNewValue> {
    return new AsyncTask<GNewValue>((
      success: IAsyncTaskSuccessFunction<GNewValue>,
      error: IAsyncTaskErrorFunction,
      abortable: Abortable,
    ): void => {
      this.#stateEventEmitter.subscribe((
        state: IAsyncTaskState<GValue>,
      ): void => {
        if (state.state === 'success') {
          let result: IAsyncTaskInput<GNewValue>;
          try {
            result = onSuccessful(state.value, abortable);
          } catch (_error: unknown) {
            return error(_error);
          }
          return success(result);
        } else if (state.state === 'error') {
          let result: IAsyncTaskInput<GNewValue>;
          try {
            result = onErrored(state.error, abortable);
          } catch (_error: unknown) {
            return error(_error);
          }
          return success(result);
        }/* else if (state.state === 'abort') {
          error(new Error(`Aborted`));
        }*/
      });
    }, this.#abortable);
  }

  successful<GNewValue extends IAsyncTaskConstraint<GNewValue>>(
    onSuccessful: IAsyncTaskOnSuccessfulFunction<GValue, GNewValue>,
  ): AsyncTask<GNewValue> {
    return new AsyncTask<GNewValue>((
      success: IAsyncTaskSuccessFunction<GNewValue>,
      error: IAsyncTaskErrorFunction,
      abortable: Abortable,
    ): void => {
      this.#stateEventEmitter.subscribe((
        state: IAsyncTaskState<GValue>,
      ): void => {
        if (state.state === 'success') {
          let result: IAsyncTaskInput<GNewValue>;
          try {
            result = onSuccessful(state.value, abortable);
          } catch (_error: unknown) {
            return error(_error);
          }
          return success(result);
        } else if (state.state === 'error') {
          return error(state.error);
        }/* else if (state.state === 'abort') {
          error(new Error(`Aborted`));
        }*/
      });
    }, this.#abortable);
  }

  errored<GNewValue extends IAsyncTaskConstraint<GNewValue>>(
    onErrored: IAsyncTaskOnErroredFunction<GNewValue>,
  ): AsyncTask<GValue | GNewValue> {
    return new AsyncTask<GValue | GNewValue>((
      success: IAsyncTaskSuccessFunction<GValue | GNewValue>,
      error: IAsyncTaskErrorFunction,
      abortable: Abortable,
    ): void => {
      this.#stateEventEmitter.subscribe((
        state: IAsyncTaskState<GValue>,
      ): void => {
        if (state.state === 'success') {
          return success(state.value);
        } else if (state.state === 'error') {
          let result: IAsyncTaskInput<GNewValue>;
          try {
            result = onErrored(state.error, abortable);
          } catch (_error: unknown) {
            return error(_error);
          }
          return success(result);
        }/* else if (state.state === 'abort') {
          error(new Error(`Aborted`));
        }*/
      });
    }, this.#abortable);
  }

  aborted<GNewValue extends IAsyncTaskConstraint<GNewValue>>(
    onAborted: IAsyncTaskOnAbortedFunction<GNewValue>,
    abortable: Abortable = this.#abortable,
  ): AsyncTask<GValue | GNewValue> {
    return new AsyncTask<GValue | GNewValue>((
      success: IAsyncTaskSuccessFunction<GValue | GNewValue>,
      error: IAsyncTaskErrorFunction,
      abortable: Abortable,
    ): void => {
      this.#stateEventEmitter.subscribe((
        state: IAsyncTaskState<GValue>,
      ): void => {
        if (state.state === 'success') {
          return success(state.value);
        } else if (state.state === 'error') {
          return error(state.error);
        } else if (state.state === 'abort') {
          let result: IAsyncTaskInput<GNewValue>;
          try {
            result = onAborted(state.reason, abortable);
          } catch (_error: unknown) {
            return error(_error);
          }
          return success(result);
        }
      });
    }, abortable);
  }

  switchAbortable(
    abortable: Abortable,
  ): AsyncTask<GValue> {
    if (abortable === this.#abortable) {
      return this;
    } else {
      return new AsyncTask<GValue>((
        success: IAsyncTaskSuccessFunction<GValue>,
        error: IAsyncTaskErrorFunction,
      ): void => {
        this.#stateEventEmitter.subscribe((
          state: IAsyncTaskState<GValue>,
        ): void => {
          if (state.state === 'success') {
            return success(state.value);
          } else if (state.state === 'error') {
            return error(state.error);
          } else if (state.state === 'abort') {
            return error(state.reason);
          }
        });
      }, abortable);
    }
  }

  finally(
    onFinally: IAsyncTaskOnFinallyFunction<GValue>,
  ): AsyncTask<GValue> {
    return new AsyncTask<GValue>((
      success: IAsyncTaskSuccessFunction<GValue>,
      error: IAsyncTaskErrorFunction,
      abortable: Abortable,
    ): void => {
      this.#stateEventEmitter.subscribe((
        state: IAsyncTaskState<GValue>,
      ): void => {
        const end = (): void => {
          if (state.state === 'success') {
            success(state.value);
          } else if (state.state === 'error') {
            error(state.error);
          }
        };

        let result: IAsyncTaskInput<void>;
        try {
          result = onFinally(state, abortable);
        } catch (_error: unknown) {
          return error(_error);
        }

        if (result === void 0) {
          end();
        } else {
          const task: AsyncTask<void> = AsyncTask.fromFactory<void>(() => result, abortable);

          task.#stateEventEmitter.subscribe((
            state: IAsyncTaskState<void>,
          ): void => {
            if (state.state === 'success') {
              end();
            } else if (state.state === 'error') {
              error(state.error);
            }
          });
        }
      });
    }, this.#abortable);
  }

  toPromise(): Promise<GValue> {
    return new Promise<GValue>((
      resolve: (value: GValue) => void,
      reject: (reason?: any) => void,
    ): void => {
      this.#stateEventEmitter.subscribe((
        state: IAsyncTaskState<GValue>,
      ): void => {
        if (state.state === 'success') {
          resolve(state.value);
        } else if (state.state === 'error') {
          reject(state.error);
        } else if (state.state === 'abort') {
          reject(new Error(`Aborted`, { cause: state.reason }));
        }
      });
    });
  }
}

