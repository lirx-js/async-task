import { IAsyncTaskConstraint } from '../async-task-constraint.type';
import { IAsyncTaskInput } from '../async-task-input.type';

/**
 * A function to submit a value and probably enter a "success" state.
 */
export interface IAsyncTaskSuccessFunction<GValue extends IAsyncTaskConstraint<GValue>> {
  (
    value: IAsyncTaskInput<GValue>,
  ): void;
}
