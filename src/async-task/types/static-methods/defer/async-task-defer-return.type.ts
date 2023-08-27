import { AsyncTask } from '../../../async-task.class';
import { IAsyncTaskConstraint } from '../../async-task-constraint.type';
import { IAsyncTaskErrorFunction } from '../../init/async-task-error-function.type';
import { IAsyncTaskSuccessFunction } from '../../init/async-task-success-function.type';

export interface IAsyncTaskDeferReturn<GValue extends IAsyncTaskConstraint<GValue>> {
  task: AsyncTask<GValue>;
  success: IAsyncTaskSuccessFunction<GValue>;
  error: IAsyncTaskErrorFunction;
}
