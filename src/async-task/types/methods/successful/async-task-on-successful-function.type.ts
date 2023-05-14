import { Abortable } from '../../../../abortable/abortable.class';
import { IAsyncTaskConstraint } from '../../async-task-constraint.type';
import { IAsyncTaskInput } from '../../async-task-input.type';

/**
 * A function called when an AsyncTask enters in an "success" state.
 * It receives the "value", and an Abortable used if the return is another AsyncTask.
 */
export interface IAsyncTaskOnSuccessfulFunction<GValue extends IAsyncTaskConstraint<GValue>, GNewValue extends IAsyncTaskConstraint<GNewValue>> {
  (
    value: GValue,
    abortable: Abortable,
  ): IAsyncTaskInput<GNewValue>;
}
