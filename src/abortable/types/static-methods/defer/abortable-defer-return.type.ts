import { Abortable } from '../../../abortable.class';
import { IAbortFunction } from '../../init/abort-function.type';

/**
 * The return of the Abortable.defer() static method.
 */
export interface IAbortableDeferReturn {
  abortable: Abortable;
  abort: IAbortFunction;
}
