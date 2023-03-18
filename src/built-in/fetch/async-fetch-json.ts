import { Abortable } from '../../abortable.class';
import { AsyncTask, IAsyncTaskConstraint } from '../../async-task.class';
import { asyncFetch, IAsyncFetchRequestInit } from './async-fetch';

export function asyncFetchJSON<GData extends IAsyncTaskConstraint<GData>>(
  input: RequestInfo | URL,
  init: IAsyncFetchRequestInit,
  abortable: Abortable,
): AsyncTask<GData> {
  return asyncFetch(input, init, abortable)
    .successful((
      response: Response,
      abortable: Abortable,
    ): AsyncTask<GData> => {
      if (response.ok) {
        return AsyncTask.fromFactory<GData>(() => response.json(), abortable);
      } else {
        throw new Error(`Failed to fetch '${response.url}': ${response.status}`);
      }
    });
}
