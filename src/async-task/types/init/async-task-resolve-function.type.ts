import { IAsyncTaskConstraint } from '../async-task-constraint.type';
import { IAsyncTaskInput } from '../async-task-input.type';

/**
 * A function used to resolve the value of an AsyncTask:
 * A `Promise`, an `AsyncTask`, or a raw value are accepted. This value is fully resolved before resolving this AsyncTask.
 */
export interface IAsyncTaskResolveFunction<GValue extends IAsyncTaskConstraint<GValue>> {
  (value: IAsyncTaskInput<GValue>): void;
}
