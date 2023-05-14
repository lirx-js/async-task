import { Abortable } from '../../../abortable.class';
import { IAbortFunction } from '../../init/abort-function.type';

/**
 * The return of the Abortable.derive(...) static method.
 */
export type IDeriveAbortableResult = [
  abort: IAbortFunction,
  aborbale: Abortable,
];
