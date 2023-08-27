import { Abortable } from '../../../../abortable/abortable.class';
import { IAsyncTaskConstraint } from '../../async-task-constraint.type';
import { IAsyncTaskInput } from '../../async-task-input.type';
import { IAsyncTaskSettledState } from '../../state/async-task-settled-state.type.';

/**
 * A function called when an AsyncTask reaches a "success" or "error" state.
 * It receives the "state", and an Abortable used if the return is another AsyncTask.
 */
export interface IAsyncTaskOnSettledFunction<GValue extends IAsyncTaskConstraint<GValue>, GNewValue extends IAsyncTaskConstraint<GNewValue>> {
  (
    state: IAsyncTaskSettledState<GValue>,
    abortable: Abortable,
  ): IAsyncTaskInput<GNewValue>;
}
