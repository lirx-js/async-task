import { Abortable } from '../../abortable/abortable.class';
import { IAsyncTaskErrorFunction } from '../types/init/async-task-error-function.type';
import { IAsyncTaskSuccessFunction } from '../types/init/async-task-success-function.type';
import { IAsyncTaskConstraint } from '../types/async-task-constraint.type';
import { AsyncTask } from '../async-task.class';

export interface IAsyncTimeoutThrowErrorFactory {
  (): any;
}

export const DEFAULT_ASYNC_TIMEOUT_THROW_ERROR_FACTORY = () => {
  return new Error(`Timeout`);
};

export function asyncTimeoutThrow<GValue extends IAsyncTaskConstraint<GValue> = any>(
  ms: number,
  abortable: Abortable,
  onTimeout: IAsyncTimeoutThrowErrorFactory = DEFAULT_ASYNC_TIMEOUT_THROW_ERROR_FACTORY,
): AsyncTask<GValue> {
  return new AsyncTask<GValue>((
    success: IAsyncTaskSuccessFunction<GValue>,
    error: IAsyncTaskErrorFunction,
    abortable: Abortable,
  ): void => {
    const timer: any = setTimeout((): void => {
      error(onTimeout());
    }, ms);
    abortable.onAbort((): void => {
      clearTimeout(timer);
    });
  }, abortable);
}
