import { Abortable } from '../../../abortable/abortable.class';
import { AsyncTask } from '../../async-task.class';
import { IAsyncTaskConstraint } from '../../types/async-task-constraint.type';
import { IAsyncFetchRequestInit } from './async-fetch';
import { asyncFetchBody } from './async-fetch-body';

export function asyncFetchJSON<GData extends IAsyncTaskConstraint<GData>>(
  input: RequestInfo | URL,
  init: IAsyncFetchRequestInit,
  abortable: Abortable,
): AsyncTask<GData> {
  return asyncFetchBody(input, init, (response: Response) => response.json(), abortable);
}

export type IAsyncFetchJSONFunction = typeof asyncFetchJSON;
