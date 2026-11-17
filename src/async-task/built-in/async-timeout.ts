import { Abortable } from '../../abortable/abortable.class';
import { AsyncTask } from '../async-task.class';
import { IAsyncTaskRejectFunction } from '../types/init/async-task-reject-function.type';
import { IAsyncTaskResolveFunction } from '../types/init/async-task-resolve-function.type';

export function asyncTimeout(ms: number, abortable: Abortable): AsyncTask<void> {
  return new AsyncTask<void>(
    (
      success: IAsyncTaskResolveFunction<void>,
      error: IAsyncTaskRejectFunction,
      abortable: Abortable,
    ): void => {
      const timer: any = setTimeout(success, ms);
      abortable.onAbort((): void => {
        clearTimeout(timer);
      });
    },
    abortable,
  );
}
