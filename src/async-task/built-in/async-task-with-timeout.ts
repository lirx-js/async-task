import { Abortable } from '../../abortable/abortable.class';
import { IAsyncTaskFactory } from '../types/factory/async-task-factory.type';
import { IAsyncTaskConstraint } from '../types/async-task-constraint.type';
import { AsyncTask } from '../async-task.class';
import { asyncTimeoutThrow } from './async-timeout-throw';

export function asyncTaskWithTimeout<GValue extends IAsyncTaskConstraint<GValue>>(
  factory: IAsyncTaskFactory<GValue>,
  timeout: number,
  abortable: Abortable,
): AsyncTask<GValue> {
  if (timeout <= 0) {
    return AsyncTask.fromFactory(factory, abortable);
  } else {
    return AsyncTask.race(
      [
        factory,
        (abortable: Abortable): AsyncTask<GValue> => {
          return asyncTimeoutThrow<GValue>(timeout, abortable);
        },
      ],
      abortable,
    );
  }
}
