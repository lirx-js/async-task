import { Abortable } from '../../../../abortable/abortable.class';
import { IAsyncTaskConstraint } from '../../async-task-constraint.type';
import { IAsyncTaskInput } from '../../async-task-input.type';
import { IAsyncTaskState } from '../../state/async-task-state.type';

/**
 * A function called when an AsyncTask enters in an "final" state (success, error, or abort) .
 * It receives the "state", and an Abortable used if the return is another AsyncTask.
 */
export interface IAsyncTaskOnFinallyFunction<GValue extends IAsyncTaskConstraint<GValue>> {
  (
    state: IAsyncTaskState<GValue>,
    abortable: Abortable,
  ): IAsyncTaskInput<void>;
}
