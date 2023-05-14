import { Abortable } from '../../../../abortable/abortable.class';
import { IAsyncTaskConstraint } from '../../async-task-constraint.type';
import { IAsyncTaskInput } from '../../async-task-input.type';

/**
 * A function called when an AsyncTask enters in an "abort" state.
 * It receives the abort "reason", and an Abortable used if the return is another AsyncTask.
 */
export interface IAsyncTaskOnAbortedFunction<GNewValue extends IAsyncTaskConstraint<GNewValue>> {
  (
    reason: any,
    abortable: Abortable,
  ): IAsyncTaskInput<GNewValue>;
}
