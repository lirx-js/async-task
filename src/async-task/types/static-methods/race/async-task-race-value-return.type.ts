import { IAsyncTaskConstraint } from '../../async-task-constraint.type';
import { IAsyncTaskValue } from '../../async-task-value.type';
import { IGenericAsyncTaskFactoriesList } from '../../factory/generic-async-task-factories-list.type';

export type IAsyncTaskRaceValueReturnWithoutConstraint<GFactories extends IGenericAsyncTaskFactoriesList> = ({
  [P in keyof GFactories]: IAsyncTaskValue<ReturnType<GFactories[P]>>;
})[number];

/**
 * Infers the returned values of the static method AsyncTask.race(...)
 */
export type IAsyncTaskRaceValueReturn<GFactories extends IGenericAsyncTaskFactoriesList> =
  IAsyncTaskRaceValueReturnWithoutConstraint<GFactories> extends IAsyncTaskConstraint<IAsyncTaskRaceValueReturnWithoutConstraint<GFactories>>
    ? IAsyncTaskRaceValueReturnWithoutConstraint<GFactories>
    : never;
