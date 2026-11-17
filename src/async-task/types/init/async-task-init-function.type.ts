import { Abortable } from '../../../abortable/abortable.class';
import { IAsyncTaskConstraint } from '../async-task-constraint.type';
import { IAsyncTaskRejectFunction } from './async-task-reject-function.type';
import { IAsyncTaskResolveFunction } from './async-task-resolve-function.type';

/**
 * The function to provide when creating an AsyncTask.
 */
export interface IAsyncTaskInitFunction<GValue extends IAsyncTaskConstraint<GValue>> {
  (
    resolve: IAsyncTaskResolveFunction<GValue>,
    reject: IAsyncTaskRejectFunction,
    abortable: Abortable,
  ): void;
}
