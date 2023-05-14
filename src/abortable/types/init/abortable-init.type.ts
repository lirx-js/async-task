import { IAbortFunction } from './abort-function.type';

/**
 * The function to provide when creating an Abortable.
 */
export interface IAbortableInit {
  (
    abort: IAbortFunction,
  ): void;
}
