import { Abortable } from '../abortable.class';
import { AsyncTask, IAsyncTaskConstraint, IAsyncTaskErrorFunction, IAsyncTaskSuccessFunction } from '../async-task.class';

export interface IAsyncTimeoutThrowErrorFactory {
  (): any;
}

export const DEFAULT_ASYNC_TIMEOUT_THROW_ERROR_FACTORY = () => {
  return new Error(`Timeout`);
};

export function asyncTimeoutThrow<GValue extends IAsyncTaskConstraint<GValue> = unknown>(
  ms: number,
  abortable: Abortable,
  onTimeout: IAsyncTimeoutThrowErrorFactory = DEFAULT_ASYNC_TIMEOUT_THROW_ERROR_FACTORY,
): AsyncTask<GValue> {
  return new AsyncTask<GValue>((
    success: IAsyncTaskSuccessFunction<GValue>,
    error: IAsyncTaskErrorFunction,
    abortable: Abortable,
  ): void => {
    const timer = setTimeout(() => {
      error(onTimeout());
    }, ms);
    abortable.onAbort(() => {
      clearTimeout(timer);
    });
  }, abortable);
}
