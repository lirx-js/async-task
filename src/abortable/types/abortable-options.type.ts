import { Abortable } from '../abortable.class';

export interface IAbortableOptions {
  readonly abortable: Abortable;
}

export type IOptionalAbortableOptions = Partial<IAbortableOptions>;

export function optionalAbortableOptionsToAbortable(
  options?: IOptionalAbortableOptions,
): Abortable {
  return (
    (options === void 0)
    || (options.abortable === void 0)
  )
    ? Abortable.never
    : options?.abortable;
}
