import { IAsyncTaskConstraint } from '../async-task-constraint.type';
import { IAsyncTaskSuccessState } from './async-task-success-state.type';
import { IAsyncTaskErrorState } from './async-task-error-state.type';

export type IAsyncTaskSettledState<GValue extends IAsyncTaskConstraint<GValue>> =
  | IAsyncTaskSuccessState<GValue>
  | IAsyncTaskErrorState
  ;
