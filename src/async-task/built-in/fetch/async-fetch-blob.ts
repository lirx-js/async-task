import { Abortable } from '../../../abortable/abortable.class';
import { AsyncTask } from '../../async-task.class';
import { IAsyncFetchRequestInit } from './async-fetch';
import { asyncFetchBody } from './async-fetch-body';

export function asyncFetchBlob(
  input: RequestInfo | URL,
  init: IAsyncFetchRequestInit,
  abortable: Abortable,
): AsyncTask<Blob> {
  return asyncFetchBody(
    input,
    init,
    (response: Response) => response.blob(),
    abortable,
  );
}

export type IAsyncFetchBlobFunction = typeof asyncFetchBlob;


