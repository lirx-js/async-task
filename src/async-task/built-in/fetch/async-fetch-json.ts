import { Abortable } from '../../../abortable/abortable.class';
import { IAsyncTaskConstraint } from '../../types/async-task-constraint.type';
import { AsyncTask } from '../../async-task.class';
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

export type IAsyncFetchJSONFunction = typeof asyncFetchJSON;


