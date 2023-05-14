import { AsyncTask } from '../async-task.class';

/**
 * Infers the GValue of an AsyncTask.
 */
export type IAsyncTaskValue<GValue> = (
  GValue extends AsyncTask<infer GNewValue>
    ? GNewValue
    : (
      GValue extends Promise<infer GNewValue>
        ? IAsyncTaskValue<GNewValue>
        : GValue
      )
  );
