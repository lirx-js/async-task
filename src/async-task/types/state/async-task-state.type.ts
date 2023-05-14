import { IAsyncTaskAbortState } from './async-task-abort-state.type';
import { IAsyncTaskErrorState } from './async-task-error-state.type';
import { IAsyncTaskSuccessState } from './async-task-success-state.type';
import { IAsyncTaskConstraint } from '../async-task-constraint.type';

export type IAsyncTaskState<GValue extends IAsyncTaskConstraint<GValue>> =
  | IAsyncTaskSuccessState<GValue>
  | IAsyncTaskErrorState
  | IAsyncTaskAbortState
  ;
