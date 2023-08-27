import { AsyncTask } from '../async-task.class';
import { IEnsureAsyncTaskConstrained } from './async-task-constraint.type';

/**
 * Infers the GValue of an AsyncTask.
 */
export type InferAsyncTaskValue<GValue> = (
  GValue extends AsyncTask<infer GNewValue>
    ? GNewValue
    : (
      GValue extends Promise<infer GNewValue>
        ? InferAsyncTaskValue<GNewValue>
        : GValue
      )
  );

export type InferConstrainedAsyncTaskValue<GValue> = IEnsureAsyncTaskConstrained<InferAsyncTaskValue<GValue>>;
