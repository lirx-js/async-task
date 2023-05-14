import { Abortable } from '../../../abortable/abortable.class';
import { IAsyncTaskConstraint } from '../async-task-constraint.type';
import { IAsyncTaskErrorFunction } from './async-task-error-function.type';
import { IAsyncTaskSuccessFunction } from './async-task-success-function.type';

/**
 * The function to provide when creating an AsyncTask.
 */
export interface IAsyncTaskInitFunction<GValue extends IAsyncTaskConstraint<GValue>> {
  (
    success: IAsyncTaskSuccessFunction<GValue>,
    error: IAsyncTaskErrorFunction,
    abortable: Abortable,
  ): void;
}
