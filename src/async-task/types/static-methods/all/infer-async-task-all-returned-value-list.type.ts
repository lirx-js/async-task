import { IEnsureAsyncTaskConstrained } from '../../async-task-constraint.type';
import { InferAsyncTaskValue } from '../../infer-async-task-value.type';
import { IGenericAsyncTaskFactoriesList } from '../../factory/generic-async-task-factories-list.type';

/**
 * Infers the returned values of the static method AsyncTask.all(...)
 */
export type InferAsyncTaskAllReturnedValueList<GFactories extends IGenericAsyncTaskFactoriesList> = IEnsureAsyncTaskConstrained<{
  -readonly [P in keyof GFactories]: InferAsyncTaskValue<ReturnType<GFactories[P]>>;
}>;
