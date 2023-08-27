import { Abortable } from '../../../abortable/abortable.class';
import { AsyncTask } from '../../async-task.class';
import { IAsyncFetchRequestInit } from './async-fetch';
import { asyncFetchBody } from './async-fetch-body';

export function asyncFetchText(
  input: RequestInfo | URL,
  init: IAsyncFetchRequestInit,
  abortable: Abortable,
): AsyncTask<string> {
  return asyncFetchBody(
    input,
    init,
    (response: Response) => response.text(),
    abortable,
  );
}

export type IAsyncFetchTextFunction = typeof asyncFetchText;


