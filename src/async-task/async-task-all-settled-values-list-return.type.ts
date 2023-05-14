import { IAsyncTaskAllSettledState } from './async-task-all-settled-state.type';
import { IAsyncTaskConstraint } from './types/async-task-constraint.type';
import { IAsyncTaskValue } from './types/async-task-value.type';
import { IGenericAsyncTaskFactoriesList } from './types/factory/generic-async-task-factories-list.type';

export type IAsyncTaskAllSettledStateWithConstraint<GValue> =
  GValue extends IAsyncTaskConstraint<GValue>
    ? IAsyncTaskAllSettledState<GValue>
    : never;

export type IAsyncTaskAllSettledValuesListReturnWithoutConstraint<GFactories extends IGenericAsyncTaskFactoriesList> = {
  -readonly [P in keyof GFactories]: IAsyncTaskAllSettledStateWithConstraint<IAsyncTaskValue<ReturnType<GFactories[P]>>>;
};

/**
 * Infers the returned values of the static method AsyncTask.allSettled(...)
 */
export type IAsyncTaskAllSettledValuesListReturn<GFactories extends IGenericAsyncTaskFactoriesList> =
  IAsyncTaskAllSettledValuesListReturnWithoutConstraint<GFactories> extends IAsyncTaskConstraint<IAsyncTaskAllSettledValuesListReturnWithoutConstraint<GFactories>>
    ? IAsyncTaskAllSettledValuesListReturnWithoutConstraint<GFactories>
    : never;
