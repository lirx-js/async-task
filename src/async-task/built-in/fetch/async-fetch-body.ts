import { Abortable } from '../../../abortable/abortable.class';
import { AsyncTask } from '../../async-task.class';
import { IAsyncTaskConstraint } from '../../types/async-task-constraint.type';
import { IAsyncTaskInput } from '../../types/async-task-input.type';
import { asyncFetch, IAsyncFetchRequestInit } from './async-fetch';

export interface IAsyncFetchBodyFactory<GResult extends IAsyncTaskConstraint<GResult>> {
  (
    response: Response,
    abortable: Abortable,
  ): IAsyncTaskInput<GResult>;
}

export function asyncFetchBody<GResult extends IAsyncTaskConstraint<GResult>>(
  input: RequestInfo | URL,
  init: IAsyncFetchRequestInit,
  factory: IAsyncFetchBodyFactory<GResult>,
  abortable: Abortable,
): AsyncTask<GResult> {
  return asyncFetch(input, init, abortable)
    .successful((
      response: Response,
      abortable: Abortable,
    ): AsyncTask<GResult> => {
      if (response.ok) {
        return AsyncTask.fromFactory<GResult>((abortable: Abortable): IAsyncTaskInput<GResult> => {
          return factory(response, abortable);
        }, abortable);
      } else {
        throw new Error(`Failed to fetch '${response.url}': ${response.status}`);
      }
    });
}



