import { Abortable } from '../../../abortable/abortable.class';
import { AsyncTask } from '../../async-task.class';

export type IAsyncFetchRequestInit = Omit<RequestInit, 'signal'> | undefined;

export function asyncFetch(
  input: RequestInfo | URL,
  init: IAsyncFetchRequestInit,
  abortable: Abortable,
): AsyncTask<Response> {
  return AsyncTask.fromFactory((
    abortable: Abortable,
  ): Promise<Response> => {
    return fetch(input, {
      ...init,
      signal: abortable.toAbortSignal(),
    });
  }, abortable);
}
