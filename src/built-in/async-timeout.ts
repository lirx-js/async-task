import { Abortable } from '../abortable.class';
import { AsyncTask, IAsyncTaskErrorFunction, IAsyncTaskSuccessFunction } from '../async-task.class';

export function asyncTimeout(
  ms: number,
  abortable: Abortable,
): AsyncTask<void> {
  return new AsyncTask<void>((
    success: IAsyncTaskSuccessFunction<void>,
    error: IAsyncTaskErrorFunction,
    abortable: Abortable,
  ): void => {
    const timer = setTimeout(success, ms);
    abortable.onAbort(() => {
      clearTimeout(timer);
    });
  }, abortable);
}

