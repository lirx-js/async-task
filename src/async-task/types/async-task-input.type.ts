import { IAsyncTaskConstraint } from './async-task-constraint.type';
import { AsyncTask } from '../async-task.class';

/**
 * An AsyncTask, Promise, or any other value.
 * Simplifies inputs and returns.
 * It is usually automatically converted to an AsyncTask.
 */
export type IAsyncTaskInput<GValue extends IAsyncTaskConstraint<GValue>> =
  | AsyncTask<GValue>
  | Promise<GValue>
  | GValue
  ;
