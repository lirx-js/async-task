import { IAsyncTaskAbortState } from './async-task-abort-state.type';
import { IAsyncTaskConstraint } from '../async-task-constraint.type';
import { IAsyncTaskSettledState } from './async-task-settled-state.type.';

/**
 * The state of the AsyncTask when resolved.
 */
export type IAsyncTaskResolvedState<GValue extends IAsyncTaskConstraint<GValue>> =
  | IAsyncTaskSettledState<GValue>
  | IAsyncTaskAbortState
  ;
