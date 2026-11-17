import { Abortable } from '../../abortable/abortable.class';
import { TimeoutError } from '../../errors/timeout-error.class';
import { AsyncTask } from '../async-task.class';
import { IAsyncTaskConstraint } from '../types/async-task-constraint.type';
import { IAsyncTaskRejectFunction } from '../types/init/async-task-reject-function.type';
import { IAsyncTaskResolveFunction } from '../types/init/async-task-resolve-function.type';

export interface IAsyncTimeoutThrowErrorFactory {
  (): any;
}

export const DEFAULT_ASYNC_TIMEOUT_THROW_ERROR_FACTORY = () => {
  return new TimeoutError();
};

export function asyncTimeoutThrow<GValue extends IAsyncTaskConstraint<GValue> = any>(
  ms: number,
  abortable: Abortable,
  onTimeout: IAsyncTimeoutThrowErrorFactory = DEFAULT_ASYNC_TIMEOUT_THROW_ERROR_FACTORY,
): AsyncTask<GValue> {
  return new AsyncTask<GValue>(
    (
      success: IAsyncTaskResolveFunction<GValue>,
      error: IAsyncTaskRejectFunction,
      abortable: Abortable,
    ): void => {
      const timer: any = setTimeout((): void => {
        error(onTimeout());
      }, ms);
      abortable.onAbort((): void => {
        clearTimeout(timer);
      });
    },
    abortable,
  );
}
