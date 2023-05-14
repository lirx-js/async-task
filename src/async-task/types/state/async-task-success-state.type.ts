import { IAsyncTaskConstraint } from '../async-task-constraint.type';

export interface IAsyncTaskSuccessState<GValue extends IAsyncTaskConstraint<GValue>> {
  readonly state: 'success';
  readonly value: GValue;
}
