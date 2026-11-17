import { AsyncTask } from '../../../async-task.class';
import { IAsyncTaskConstraint } from '../../async-task-constraint.type';
import { IAsyncTaskRejectFunction } from '../../init/async-task-reject-function.type';
import { IAsyncTaskResolveFunction } from '../../init/async-task-resolve-function.type';

export interface IAsyncTaskWithResolvers<GValue extends IAsyncTaskConstraint<GValue>> {
  task: AsyncTask<GValue>;
  resolve: IAsyncTaskResolveFunction<GValue>;
  reject: IAsyncTaskRejectFunction;
}
