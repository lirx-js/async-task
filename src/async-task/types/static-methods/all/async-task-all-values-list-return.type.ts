import { IAsyncTaskConstraint } from '../../async-task-constraint.type';
import { IAsyncTaskValue } from '../../async-task-value.type';
import { IGenericAsyncTaskFactoriesList } from '../../factory/generic-async-task-factories-list.type';

export type IAsyncTaskAllValuesListReturnWithoutConstraint<GFactories extends IGenericAsyncTaskFactoriesList> = {
  -readonly [P in keyof GFactories]: IAsyncTaskValue<ReturnType<GFactories[P]>>;
};

/**
 * Infers the returned values of the static method AsyncTask.all(...)
 */
export type IAsyncTaskAllValuesListReturn<GFactories extends IGenericAsyncTaskFactoriesList> =
  IAsyncTaskAllValuesListReturnWithoutConstraint<GFactories> extends IAsyncTaskConstraint<IAsyncTaskAllValuesListReturnWithoutConstraint<GFactories>>
    ? IAsyncTaskAllValuesListReturnWithoutConstraint<GFactories>
    : never;
