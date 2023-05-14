import { Abortable } from '../../../abortable/abortable.class';
import { IAsyncTaskConstraint } from '../async-task-constraint.type';
import { IAsyncTaskInput } from '../async-task-input.type';

/**
 * A function which receives an Abortable and returns an AsyncTaskInput.
 * This is mostly used as an AsyncTask builder.
 */
export interface IAsyncTaskFactory<GValue extends IAsyncTaskConstraint<GValue>> {
  (
    abortable: Abortable,
  ): IAsyncTaskInput<GValue>;
}

