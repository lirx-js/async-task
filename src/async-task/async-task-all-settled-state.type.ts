import { IAsyncTaskConstraint } from './types/async-task-constraint.type';
import { IAsyncTaskErrorState } from './types/state/async-task-error-state.type';
import { IAsyncTaskSuccessState } from './types/state/async-task-success-state.type';

export type IAsyncTaskAllSettledState<GValue extends IAsyncTaskConstraint<GValue>> =
  | IAsyncTaskSuccessState<GValue>
  | IAsyncTaskErrorState
  ;
