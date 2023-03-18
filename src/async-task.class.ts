import { Abortable } from './abortable.class';
import { noop } from './noop';
import { SingleEventEmitter } from './single-event-emitter.class';

/*--------------------*/

/*--------------------*/

// export type IAsyncTaskConstraint<GValue> = (
//   [GValue] extends [null | undefined | void]
//     ? any
//     : (
//       [GValue] extends [AsyncTask<unknown>]
//         ? never
//         : (
//           [GValue] extends [Promise<unknown>]
//             ? never
//             : any
//           )
//       )
//   );

export type IAsyncTaskConstraint<GValue, GKind = any> = (
  [GValue] extends [AsyncTask<unknown>]
    ? never
    : (
      [GValue] extends [Promise<unknown>]
        ? never
        : (
          [GValue] extends [GKind]
            ? any
            : never
          )
      )
  );

// export type IAsyncTaskConstraint<GValue> = (
//   [GValue] extends [AsyncTask<unknown>]
//     ? never
//     : (
//       [GValue] extends [Promise<unknown>]
//         ? never
//         : any
//       )
//   );

export type IAsyncTaskValue<GValue> = (
  GValue extends AsyncTask<infer GNewValue>
    ? GNewValue
    : (
      GValue extends Promise<infer GNewValue>
        ? IAsyncTaskValue<GNewValue>
        : GValue
      )
  );

export type IAsyncTaskInput<GValue extends IAsyncTaskConstraint<GValue>> =
  | AsyncTask<GValue>
  | Promise<GValue>
  | GValue
  ;

export interface IAsyncTaskSuccessFunction<GValue extends IAsyncTaskConstraint<GValue>> {
  (
    value: IAsyncTaskInput<GValue>,
  ): void;
}

export interface IAsyncTaskErrorFunction {
  (
    error: any,
  ): void;
}

export interface IAsyncTaskInitFunction<GValue extends IAsyncTaskConstraint<GValue>> {
  (
    success: IAsyncTaskSuccessFunction<GValue>,
    error: IAsyncTaskErrorFunction,
    abortable: Abortable,
  ): void;
}

export interface IAsyncTaskSuccessState<GValue extends IAsyncTaskConstraint<GValue>> {
  readonly state: 'success';
  readonly value: GValue;
}

export interface IAsyncTaskFinalErrorState {
  readonly state: 'error';
  readonly error: any;
}

export interface IAsyncTaskFinalAbortState {
  readonly state: 'abort';
  readonly reason: any;
}

export type IAsyncTaskState<GValue extends IAsyncTaskConstraint<GValue>> =
  | IAsyncTaskSuccessState<GValue>
  | IAsyncTaskFinalErrorState
  | IAsyncTaskFinalAbortState
  ;


export interface IAsyncTaskOnSuccessfulFunction<GValue extends IAsyncTaskConstraint<GValue>, GNewValue extends IAsyncTaskConstraint<GNewValue>> {
  (
    value: GValue,
    abortable: Abortable,
  ): IAsyncTaskInput<GNewValue>;
}

export interface IAsyncTaskOnErroredFunction<GNewValue extends IAsyncTaskConstraint<GNewValue>> {
  (
    error: any,
    abortable: Abortable,
  ): IAsyncTaskInput<GNewValue>;
}

export interface IAsyncTaskOnAbortedFunction<GNewValue extends IAsyncTaskConstraint<GNewValue>> {
  (
    reason: any,
    abortable: Abortable,
  ): IAsyncTaskInput<GNewValue>;
}

export interface IAsyncTaskOnFinallyFunction<GValue extends IAsyncTaskConstraint<GValue>> {
  (
    state: IAsyncTaskState<GValue>,
    abortable: Abortable,
  ): IAsyncTaskInput<void>;
}

export interface IAsyncTaskFactory<GValue extends IAsyncTaskConstraint<GValue>> {
  (
    abortable: Abortable,
  ): IAsyncTaskInput<GValue>;
}

export type IGenericAsyncTaskFactory =  (abortable: Abortable) => any;

export type IGenericAsyncTaskFactoriesList = readonly IGenericAsyncTaskFactory[] | [];

export type IAsyncTaskAllValuesListPartialReturn<GFactories extends IGenericAsyncTaskFactoriesList> = {
  -readonly [P in keyof GFactories]: IAsyncTaskValue<ReturnType<GFactories[P]>>;
};

export type IAsyncTaskAllValuesListReturn<GFactories extends IGenericAsyncTaskFactoriesList> =
  IAsyncTaskAllValuesListPartialReturn<GFactories> extends IAsyncTaskConstraint<IAsyncTaskAllValuesListPartialReturn<GFactories>>
    ? IAsyncTaskAllValuesListPartialReturn<GFactories>
    : never;

export type IAsyncTaskRaceValuesListPartialReturn<GFactories extends IGenericAsyncTaskFactoriesList> = ({
  -readonly [P in keyof GFactories]: IAsyncTaskValue<ReturnType<GFactories[P]>>;
})[number];

export type IAsyncTaskRaceValuesListReturn<GFactories extends IGenericAsyncTaskFactoriesList> =
  IAsyncTaskRaceValuesListPartialReturn<GFactories> extends IAsyncTaskConstraint<IAsyncTaskRaceValuesListPartialReturn<GFactories>>
    ? IAsyncTaskRaceValuesListPartialReturn<GFactories>
    : never;

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

  static error<GValue extends IAsyncTaskConstraint<GValue> = unknown>(
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

  static never<GValue extends IAsyncTaskConstraint<GValue> = unknown>(
    abortable: Abortable,
  ): AsyncTask<GValue> {
    return new AsyncTask<GValue>(noop, abortable);
  }

  static void(
    abortable: Abortable,
  ): AsyncTask<void> {
    return this.success<void>(void 0, abortable);
  }

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

  static race<GFactories extends IGenericAsyncTaskFactoriesList>(
    factories: GFactories,
    abortable: Abortable,
  ): AsyncTask<IAsyncTaskRaceValuesListReturn<GFactories>> {
    type GValue = IAsyncTaskRaceValuesListReturn<GFactories>;

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

  #state: IAsyncTaskPrivateState;
  readonly #stateEventEmitter: SingleEventEmitter<IAsyncTaskState<GValue>>;
  readonly #abortable: Abortable;

  constructor(
    init: IAsyncTaskInitFunction<GValue>,
    abortable: Abortable,
  ) {
    this.#state = PENDING_STATE;
    this.#stateEventEmitter = new SingleEventEmitter<IAsyncTaskState<GValue>>();
    this.#abortable = abortable;

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

    const _abort = (
      reason: any,
    ): void => {
      _resolve({
        state: 'abort',
        reason,
      });
    };

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
            error(new Error(`AsyncTask must have the same Abortable than the one provided.`));
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
          success(input);
        }
      };

      const _success = (
        value: GValue,
      ): void => {
        _resolve({
          state: 'success',
          value,
        });
      };

      const _error = (
        error: any,
      ): void => {
        _resolve({
          state: 'error',
          error,
        });
      };

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

