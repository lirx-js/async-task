import { Abortable } from '../../../../abortable/abortable.class';
import { IAsyncTaskConstraint } from '../../async-task-constraint.type';
import { IAsyncTaskInput } from '../../async-task-input.type';

/**
 * A function called when an AsyncTask reaches a "success" or "error" state.
 * It receives an Abortable used if the return is another AsyncTask.
 */
export interface IAsyncTaskOnFinallyFunction<GValue extends IAsyncTaskConstraint<GValue>> {
  (
    abortable: Abortable,
  ): IAsyncTaskInput<void>;
}
