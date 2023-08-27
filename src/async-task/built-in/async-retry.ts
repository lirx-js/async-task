import { Abortable } from '../../abortable/abortable.class';
import { AsyncTask } from '../async-task.class';
import { IAsyncTaskConstraint } from '../types/async-task-constraint.type';
import { IAsyncTaskFactory } from '../types/factory/async-task-factory.type';

/**
 * Tries "count" times to create an AsyncTask from an IAsyncTaskFactory:
 *  (1) if "count" is zero or less, throw an error
 *  (2) else call factory:
 *    - in case of success return the result
 *    - else decrease count by one:
 *      - if zero or less, throw the received error
 *      - else repeat (1) with the new "count" value
 */
export function asyncRetry<GValue extends IAsyncTaskConstraint<GValue>>(
  factory: IAsyncTaskFactory<GValue>,
  count: number,
  abortable: Abortable,
): AsyncTask<GValue> {
  if (count <= 0) {
    return AsyncTask.error<GValue>(new Error(`Reached retry limit`), abortable);
  } else {
    return AsyncTask.fromFactory(factory, abortable)
      .errored((error: unknown, abortable: Abortable): AsyncTask<GValue> | never => {
        count--;
        if (count <= 0) {
          throw error;
        } else {
          return asyncRetry<GValue>(factory, count, abortable);
        }
      });
  }
}


