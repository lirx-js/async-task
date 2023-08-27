import { Abortable } from '../../../../abortable/abortable.class';
import { IAsyncTaskConstraint } from '../../async-task-constraint.type';
import { IAsyncTaskInput } from '../../async-task-input.type';

/**
 * A function called when an AsyncTask reaches an "error" state.
 * It receives the "error", and an Abortable used if the return is another AsyncTask.
 */
export interface IAsyncTaskOnErroredFunction<GNewValue extends IAsyncTaskConstraint<GNewValue>> {
  (
    error: any,
    abortable: Abortable,
  ): IAsyncTaskInput<GNewValue>;
}
