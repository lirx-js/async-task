import { IAsyncTaskConstraint } from '../../async-task-constraint.type';
import { IAsyncTaskResolvedState } from '../../state/async-task-resolved-state.type';

/**
 * A function called when an AsyncTask reaches a "resolved" state (success, error, or abort).
 */
export interface IAsyncTaskWhenResolvedFunction<GValue extends IAsyncTaskConstraint<GValue>> {
  (
    state: IAsyncTaskResolvedState<GValue>,
  ): void;
}

