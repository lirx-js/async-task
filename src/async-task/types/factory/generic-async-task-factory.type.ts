import { Abortable } from '../../../abortable/abortable.class';

/**
 * A generic IAsyncTaskFactory
 * @see IAsyncTaskFactory
 */
export type IGenericAsyncTaskFactory = (abortable: Abortable) => any;
