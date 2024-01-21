import { Abortable } from '../abortable/abortable.class';
import { AbortError } from '../errors/abort-error.class';
import { isPromise } from '../helpers/is-promise.private';
import { noop } from '../helpers/noop.private';
import { SingleEventEmitter, ISingleEventEmitterUnsubscribe } from '../helpers/single-event-emitter.class.private';
import { IAsyncTaskConstraint } from './types/async-task-constraint.type';
import { IAsyncTaskInput } from './types/async-task-input.type';
import { IAsyncTaskFactory } from './types/factory/async-task-factory.type';
import { IGenericAsyncTaskFactoriesList } from './types/factory/generic-async-task-factories-list.type';
import { IAsyncTaskErrorFunction } from './types/init/async-task-error-function.type';
import { IAsyncTaskInitFunction } from './types/init/async-task-init-function.type';
import { IAsyncTaskSuccessFunction } from './types/init/async-task-success-function.type';
import { IAsyncTaskOnErroredFunction } from './types/methods/errored/async-task-on-errored-function.type';
import { IAsyncTaskOnFinallyFunction } from './types/methods/finally/async-task-on-finally-function.type';
import { IAsyncTaskOnSuccessfulFunction } from './types/methods/successful/async-task-on-successful-function.type';
import { IAsyncTaskResolvedState } from './types/state/async-task-resolved-state.type';
import { InferAsyncTaskAllReturnedValueList } from './types/static-methods/all/infer-async-task-all-returned-value-list.type';
import { IAsyncTaskDeferReturn } from './types/static-methods/defer/async-task-defer-return.type';
import { InferAsyncTaskRaceReturnedValue } from './types/static-methods/race/infer-async-task-race-returned-value.type';
import { IAsyncTaskWhenResolvedFunction } from './types/static-methods/when-resolved/async-task-when-resolved-function.type';
import { IAbortableUnsubscribe } from '../abortable/types/methods/on-abort/abortable-unsubscribe.type';
import { IAsyncTaskWhenResolvedUnsubscribe } from './types/static-methods/when-resolved/async-task-when-resolved-unsubscribe.type';
import { IGenericAsyncTaskFactory } from './types/factory/generic-async-task-factory.type';
import { AbortableController } from '../abortable/controller/abortable-controller.class';
import { unsubscribeSet, IUnsubscribeSet, cleanUnsubscribeSet } from '@lirx/unsubscribe';
import { IAsyncTaskOnSettledFunction } from './types/methods/settled/async-task-on-settled-function.type';
import { IAsyncTaskSettledState } from './types/state/async-task-settled-state.type.';
import {
  InferAsyncTaskAllSettledReturnedValueList,
} from './types/static-methods/all-settled/async-task-all-settled-values-list-return.type';

/*--------------------*/

/** TYPES **/

export const ASYNC_TASK_SUCCESS = Symbol();

const PENDING_STATE = 0;
const RESOLVING_STATE = 1;
const RESOLVED_STATE = 2;

type IAsyncTaskState =
  | typeof PENDING_STATE
  | typeof RESOLVING_STATE
  | typeof RESOLVED_STATE
  ;

/** CLASS **/

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
   * Creates an AsyncTask with exposed "success" and "error" functions.
   */
  static defer<GValue extends IAsyncTaskConstraint<GValue>>(
    abortable: Abortable,
  ): IAsyncTaskDeferReturn<GValue> {
    let success!: IAsyncTaskSuccessFunction<GValue>;
    let error!: IAsyncTaskErrorFunction;

    const task = new AsyncTask<GValue>((
      _success: IAsyncTaskSuccessFunction<GValue>,
      _error: IAsyncTaskErrorFunction,
    ): void => {
      success = _success;
      error = _error;
    }, abortable);

    return {
      task,
      success,
      error,
    };
  }

  // static abc(): any {
  //   const toUnsubscribe: IUnsubscribeSet = unsubscribeSet();
  //
  //   const clean = (): void => {
  //     cleanUnsubscribeSet(toUnsubscribe);
  //   };
  //
  //   const sharedAbortableController: AbortableController = new AbortableController([abortable]);
  //   const sharedAbortable: Abortable = sharedAbortableController.abortable;
  //
  //   const success = (
  //     value: GValues,
  //   ): void => {
  //     sharedAbortableController.abort(ASYNC_TASK_SUCCESS);
  //     _success(value);
  //   };
  //
  //   const error = (
  //     error: any,
  //   ): void => {
  //     sharedAbortableController.abort(error);
  //     _error(error);
  //   };
  //
  //   toUnsubscribe.add(sharedAbortable.onAbort(clean));
  // }

  /**
   * Returns an AsyncTask resolved with all the values returned by the factories (as an array of values).
   * If any of the AsyncTasks returned by the factories reaches an "error" state, the returned AsyncTask gets in an "error" state too,
   * add all the factories are aborted.
   */
  static all<GFactories extends IGenericAsyncTaskFactoriesList>(
    factories: GFactories,
    abortable: Abortable,
  ): AsyncTask<InferAsyncTaskAllReturnedValueList<GFactories>>;
  static all<GValue extends IAsyncTaskConstraint<GValue>>(
    factories: Iterable<IAsyncTaskFactory<GValue>>,
    abortable: Abortable,
  ): AsyncTask<GValue[]>;
  static all(
    factories: Iterable<IGenericAsyncTaskFactory>,
    abortable: Abortable,
  ): AsyncTask<any[]> {
    type GValue = any;
    type GValues = GValue[];

    return new AsyncTask<GValues>((
      _success: IAsyncTaskSuccessFunction<GValues>,
      _error: IAsyncTaskErrorFunction,
      abortable: Abortable,
    ): void => {
      const toUnsubscribe: IUnsubscribeSet = unsubscribeSet();

      const clean = (): void => {
        cleanUnsubscribeSet(toUnsubscribe);
      };

      const sharedAbortableController: AbortableController = new AbortableController([abortable]);
      const sharedAbortable: Abortable = sharedAbortableController.abortable;

      const success = (
        value: GValues,
      ): void => {
        sharedAbortableController.abort(ASYNC_TASK_SUCCESS);
        _success(value);
      };

      const error = (
        error: any,
      ): void => {
        sharedAbortableController.abort(error);
        _error(error);
      };

      toUnsubscribe.add(sharedAbortable.onAbort(clean));

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

        const task: AsyncTask<GValue> = this.fromFactory(result.value, sharedAbortable);

        const unsubscribeOfResolvedState: ISingleEventEmitterUnsubscribe = task.#resolvedStateEventEmitter.subscribe((
          state: IAsyncTaskResolvedState<GValue>,
        ): void => {
          unsubscribeOfResolvedState();
          toUnsubscribe.delete(unsubscribeOfResolvedState);

          if (state.state === 'success') {
            done++;
            values[i] = state.value;
            successIfDone();
          } else if (state.state === 'error') {
            error(state.error);
          }
        });

        toUnsubscribe.add(unsubscribeOfResolvedState);
      }

      values = new Array<GValue>(total);
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
  ): AsyncTask<InferAsyncTaskRaceReturnedValue<GFactories>>;
  static race<GValue extends IAsyncTaskConstraint<GValue>>(
    factories: Iterable<IAsyncTaskFactory<GValue>>,
    abortable: Abortable,
  ): AsyncTask<GValue>;
  static race(
    factories: Iterable<IGenericAsyncTaskFactory>,
    abortable: Abortable,
  ): AsyncTask<any> {
    type GValue = any;

    return new AsyncTask<GValue>((
      _success: IAsyncTaskSuccessFunction<GValue>,
      _error: IAsyncTaskErrorFunction,
      abortable: Abortable,
    ): void => {
      const toUnsubscribe: IUnsubscribeSet = unsubscribeSet();

      const clean = (): void => {
        cleanUnsubscribeSet(toUnsubscribe);
      };

      const sharedAbortableController: AbortableController = new AbortableController([abortable]);
      const sharedAbortable: Abortable = sharedAbortableController.abortable;

      const success = (
        value: GValue,
      ): void => {
        sharedAbortableController.abort(ASYNC_TASK_SUCCESS);
        _success(value);
      };

      const error = (
        error: any,
      ): void => {
        sharedAbortableController.abort(error);
        _error(error);
      };

      toUnsubscribe.add(sharedAbortable.onAbort(clean));

      const iterator: Iterator<IAsyncTaskFactory<GValue>> = factories[Symbol.iterator]();
      let result: IteratorResult<IAsyncTaskFactory<GValue>>;

      while (!(result = iterator.next()).done) {

        const task: AsyncTask<GValue> = this.fromFactory(result.value, sharedAbortable);

        const unsubscribeOfResolvedState: ISingleEventEmitterUnsubscribe = task.#resolvedStateEventEmitter.subscribe((
          state: IAsyncTaskResolvedState<GValue>,
        ): void => {
          unsubscribeOfResolvedState();
          toUnsubscribe.delete(unsubscribeOfResolvedState);

          if (state.state === 'success') {
            success(state.value);
          } else if (state.state === 'error') {
            error(state.error);
          }
        });

        toUnsubscribe.add(unsubscribeOfResolvedState);
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
  ): AsyncTask<InferAsyncTaskAllSettledReturnedValueList<GFactories>>;
  static allSettled<GValue extends IAsyncTaskConstraint<GValue>>(
    factories: Iterable<IAsyncTaskFactory<GValue>>,
    abortable: Abortable,
  ): AsyncTask<IAsyncTaskSettledState<GValue>[]>;
  static allSettled(
    factories: Iterable<IGenericAsyncTaskFactory>,
    abortable: Abortable,
  ): AsyncTask<IAsyncTaskSettledState<any>[]> {
    type GValue = any;
    type GValues = IAsyncTaskSettledState<GValue>[];

    return new AsyncTask<GValues>((
      _success: IAsyncTaskSuccessFunction<GValues>,
    ): void => {
      const toUnsubscribe: IUnsubscribeSet = unsubscribeSet();

      const clean = (): void => {
        cleanUnsubscribeSet(toUnsubscribe);
      };

      const success = (
        value: GValues,
      ): void => {
        clean();
        _success(value);
      };

      toUnsubscribe.add(abortable.onAbort(clean));

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

        const unsubscribeOfResolvedState: ISingleEventEmitterUnsubscribe = task.#resolvedStateEventEmitter.subscribe((
          state: IAsyncTaskResolvedState<GValue>,
        ): void => {
          unsubscribeOfResolvedState();
          toUnsubscribe.delete(unsubscribeOfResolvedState);

          if (
            (state.state === 'success')
            || (state.state === 'error')
          ) {
            done++;
            values[i] = state;
            successIfDone();
          }
        });

        toUnsubscribe.add(unsubscribeOfResolvedState);
      }

      values = new Array<GValue>(total);
      successIfDone();
    }, abortable);
  }

  static switchAbortable<GValue extends IAsyncTaskConstraint<GValue>>(
    asyncTask: AsyncTask<GValue>,
    abortable: Abortable,
  ): AsyncTask<GValue> {
    if (abortable === asyncTask.#abortable) {
      return asyncTask;
    } else {
      return new AsyncTask<GValue>((
        success: IAsyncTaskSuccessFunction<GValue>,
        error: IAsyncTaskErrorFunction,
        abortable: Abortable,
      ): void => {
        const clean = (): void => {
          unsubscribeOfOnAbort();
          unsubscribeOfResolvedState();
        };

        const unsubscribeOfOnAbort: IAbortableUnsubscribe = abortable.onAbort(clean);

        const unsubscribeOfResolvedState: ISingleEventEmitterUnsubscribe = asyncTask.#resolvedStateEventEmitter.subscribe((
          state: IAsyncTaskResolvedState<GValue>,
        ): void => {
          clean();

          if (state.state === 'success') {
            success(state.value);
          } else if (state.state === 'error') {
            error(state.error);
          } else /*if (state.state === 'abort')*/ {
            error(state.reason);
          }
        });

      }, abortable);
    }
  }

  /**
   * Creates a listener calling `whenResolved` when the `asyncTask` reaches a "resolved" state.
   */
  static whenResolved<GValue extends IAsyncTaskConstraint<GValue>>(
    asyncTask: AsyncTask<GValue>,
    whenResolved: IAsyncTaskWhenResolvedFunction<GValue>,
  ): IAsyncTaskWhenResolvedUnsubscribe {
    return asyncTask.#resolvedStateEventEmitter.subscribe(whenResolved);
  }

  // the internal state of this AsyncTask
  #state: IAsyncTaskState;
  // the state of this AsyncTask represented as an EventEmitter
  readonly #resolvedStateEventEmitter: SingleEventEmitter<IAsyncTaskResolvedState<GValue>>;
  // the abortable linked to this AsyncTask
  readonly #abortable: Abortable;

  constructor(
    init: IAsyncTaskInitFunction<GValue>,
    abortable: Abortable,
  ) {
    this.#state = PENDING_STATE;
    this.#resolvedStateEventEmitter = new SingleEventEmitter<IAsyncTaskResolvedState<GValue>>();
    this.#abortable = abortable;

    // list of function to clean some resources
    const toUnsubscribe: IUnsubscribeSet = unsubscribeSet();

    const clean = (): void => {
      cleanUnsubscribeSet(toUnsubscribe);
    };

    // leaves the "resolving" state to enter in a "resolved" state.
    const resolved = (
      resolvedState: IAsyncTaskResolvedState<GValue>,
    ): void => {
      if (this.#state === RESOLVING_STATE) {
        clean();

        this.#state = RESOLVED_STATE;
        this.#resolvedStateEventEmitter.emit(resolvedState);

        setTimeout((): void => {
          if (
            (resolvedState.state === 'error')
            && !this.#resolvedStateEventEmitter.valueConsumed
          ) {
            console.error(`Uncaught (in AsyncTask)`, resolvedState.error);
          }
        }, 0);
      }
    };

    // resolves this AsyncTask into an "abort" state
    const resolvedWithAbort = (
      reason: any,
    ): void => {
      resolved({
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
        resolvedWithAbort(reason);
      }
    };

    if (abortable.aborted) {
      abort(abortable.reason);
    } else {
      toUnsubscribe.add(abortable.onAbort(abort));

      // resolves an IAsyncTaskInput:
      // it waits until the provided "input" is fully resolved, and calls the corresponding callback.
      // - a Promise: fulfilled => resolvedWithSuccess(), rejected => resolvedWithError()
      // - a AsyncTask: successful => resolvedWithSuccess(), errored => resolvedWithError(), aborted => resolvedWithAbort()
      // - another value: resolvedWithSuccess()
      // this garanties that the "value" given to this AsyncTask follows the IAsyncTaskConstraint.
      const resolve = <GValue extends IAsyncTaskConstraint<GValue>>(
        input: IAsyncTaskInput<GValue>,
        abortable: Abortable,
        resolvedWithSuccess: (
          value: GValue,
        ) => void,
        resolvedWithError: (
          error: any,
        ) => void,
        resolvedWithAbort: (
          reason: any,
        ) => void,
      ): void => {
        if (abortable.aborted) {
          resolvedWithAbort(abortable.reason);
        } else {
          if (input instanceof AsyncTask) {
            if (input.#abortable === abortable) {
              const unsubscribeOfResolvedState: ISingleEventEmitterUnsubscribe = input.#resolvedStateEventEmitter.subscribe((
                state: IAsyncTaskResolvedState<GValue>,
              ): void => {
                unsubscribeOfResolvedState();
                toUnsubscribe.delete(unsubscribeOfResolvedState);

                if (state.state === 'success') {
                  resolvedWithSuccess(state.value);
                } else if (state.state === 'error') {
                  resolvedWithError(state.error);
                } else/* if (state.state === 'abort')*/ {
                  resolvedWithAbort(state.reason);
                }
              });

              toUnsubscribe.add(unsubscribeOfResolvedState);
            } else {
              resolvedWithError(new Error(`AsyncTask must have the same Abortable than the one provided.`));
            }
          } else if (isPromise(input)) {
            input.then(
              (
                value: GValue,
              ): void => {
                resolve<GValue>(
                  value,
                  abortable,
                  resolvedWithSuccess,
                  resolvedWithError,
                  resolvedWithAbort,
                );
              },
              (
                error: any,
              ): any => {
                resolve<GValue>(
                  error,
                  abortable,
                  resolvedWithError,
                  resolvedWithError,
                  resolvedWithAbort,
                );
              },
            );
          } else {
            resolvedWithSuccess(input);
          }
        }
      };

      // resolves this AsyncTask into a "success" state
      const resolvedWithSuccess = (
        value: GValue,
      ): void => {
        resolved({
          state: 'success',
          value,
        });
      };

      // resolves this AsyncTask into an "error" state
      const resolvedWithError = (
        error: any,
      ): void => {
        resolved({
          state: 'error',
          error,
        });
      };

      // starts resolving this AsyncTask with a "success" state as target (however, the resolved state may differ depending on the given value).
      const success = (
        value: IAsyncTaskInput<GValue>,
      ): void => {
        if (this.#state === PENDING_STATE) {
          this.#state = RESOLVING_STATE;
          resolve(
            value,
            abortable,
            resolvedWithSuccess,
            resolvedWithError,
            resolvedWithAbort,
          );
        }
      };

      // starts resolving this AsyncTask with an "error" state as target.
      const error = (
        error: any,
      ): void => {
        if (this.#state === PENDING_STATE) {
          this.#state = RESOLVING_STATE;
          resolve(
            error,
            abortable,
            resolvedWithError,
            resolvedWithError,
            resolvedWithAbort,
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

  get abortable(): Abortable {
    return this.#abortable;
  }

  settled<GNewValue extends IAsyncTaskConstraint<GNewValue>>(
    onSettled: IAsyncTaskOnSettledFunction<GValue, GNewValue>,
  ): AsyncTask<GNewValue> {
    return new AsyncTask<GNewValue>((
      success: IAsyncTaskSuccessFunction<GNewValue>,
      error: IAsyncTaskErrorFunction,
      abortable: Abortable,
    ): void => {
      this.#resolvedStateEventEmitter.subscribe((
        state: IAsyncTaskResolvedState<GValue>,
      ): void => {
        try {
          if (
            (state.state === 'success')
            || (state.state === 'error')
          ) {
            success(onSettled(state, abortable));
          } else /*if (state.state === 'abort')*/ {
            error(state.reason);
          }
        } catch (_error: unknown) {
          return error(_error);
        }
      });
    }, this.#abortable);
  }

  then<GNewValue extends IAsyncTaskConstraint<GNewValue>>(
    onSuccessful: IAsyncTaskOnSuccessfulFunction<GValue, GNewValue>,
    onErrored: IAsyncTaskOnErroredFunction<GNewValue>,
  ): AsyncTask<GNewValue> {
    return this.settled<GNewValue>((
      state: IAsyncTaskSettledState<GValue>,
      abortable: Abortable,
    ): IAsyncTaskInput<GNewValue> => {
      if (state.state === 'success') {
        return onSuccessful(state.value, abortable);
      } else {
        return onErrored(state.error, abortable);
      }
    });
  }

  successful<GNewValue extends IAsyncTaskConstraint<GNewValue>>(
    onSuccessful: IAsyncTaskOnSuccessfulFunction<GValue, GNewValue>,
  ): AsyncTask<GNewValue> {
    return this.then(
      onSuccessful,
      (error: unknown): never => {
        throw error;
      },
    );
  }

  errored<GNewValue extends IAsyncTaskConstraint<GNewValue>>(
    onErrored: IAsyncTaskOnErroredFunction<GNewValue>,
  ): AsyncTask<GValue | GNewValue> {
    return this.then(
      (value: GValue): GValue => {
        return value;
      },
      onErrored,
    );
  }

  finally(
    onFinally: IAsyncTaskOnFinallyFunction<GValue>,
  ): AsyncTask<GValue> {
    return this.then(
      (value: GValue, abortable: Abortable): AsyncTask<GValue> => {
        return AsyncTask.fromFactory(onFinally, abortable)
          .successful((): GValue => {
            return value;
          });
      },
      (error: unknown, abortable: Abortable): AsyncTask<never> => {
        return AsyncTask.fromFactory(onFinally, abortable)
          .successful((): never => {
            throw error;
          });
      },
    );
  }

  toPromise(): Promise<GValue> {
    return new Promise<GValue>((
      resolve: (value: GValue) => void,
      reject: (reason?: any) => void,
    ): void => {
      this.#resolvedStateEventEmitter.subscribe((
        state: IAsyncTaskResolvedState<GValue>,
      ): void => {
        if (state.state === 'success') {
          resolve(state.value);
        } else if (state.state === 'error') {
          reject(state.error);
        } else if (state.state === 'abort') {
          reject(new AbortError(`Aborted`, { cause: state.reason }));
        }
      });
    });
  }
}
