import { IEnsureAsyncTaskConstrained } from '../../async-task-constraint.type';
import { IGenericAsyncTaskFactoriesList } from '../../factory/generic-async-task-factories-list.type';
import { InferConstrainedAsyncTaskValue } from '../../infer-async-task-value.type';
import { IAsyncTaskSettledState } from '../../state/async-task-settled-state.type.';

/**
 * Infers the returned values of the static method AsyncTask.allSettled(...)
 */
export type InferAsyncTaskAllSettledReturnedValueList<
  GFactories extends IGenericAsyncTaskFactoriesList,
> = IEnsureAsyncTaskConstrained<{
  -readonly [P in keyof GFactories]: IAsyncTaskSettledState<
    InferConstrainedAsyncTaskValue<ReturnType<GFactories[P]>>
  >;
}>;
