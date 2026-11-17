/**
 * A function used to reject an AsyncTask.
 */
export interface IAsyncTaskRejectFunction {
  (reason?: unknown): void;
}
