import { Abortable } from '../../abortable/abortable.class';
import { IAsyncTaskErrorFunction } from '../types/init/async-task-error-function.type';
import { IAsyncTaskSuccessFunction } from '../types/init/async-task-success-function.type';
import { AsyncTask } from '../async-task.class';

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

