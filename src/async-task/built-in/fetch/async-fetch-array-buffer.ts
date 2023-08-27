import { Abortable } from '../../../abortable/abortable.class';
import { AsyncTask } from '../../async-task.class';
import { IAsyncFetchRequestInit } from './async-fetch';
import { asyncFetchBody } from './async-fetch-body';

export function asyncFetchArrayBuffer(
  input: RequestInfo | URL,
  init: IAsyncFetchRequestInit,
  abortable: Abortable,
): AsyncTask<ArrayBuffer> {
  return asyncFetchBody(
    input,
    init,
    (response: Response) => response.arrayBuffer(),
    abortable,
  );
}

export type IAsyncFetchArrayBufferFunction = typeof asyncFetchArrayBuffer;


