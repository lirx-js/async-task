import { AsyncTask } from '../async-task.class';

/**
 * A contraint on the value of an AsyncTask:
 * It cannot be another AsyncTask, and it cannot be a Promise.
 */
export type IAsyncTaskConstraint<GValue, GKind = any> = (
  0 extends (1 & GValue)
    ? any
    : (
      AsyncTask<any> extends GValue
        ? never
        : (
          Promise<any> extends GValue
            ? never
            : (
              // GKind extends GValue
              [GValue] extends [GKind]
                ? any
                : never
              )
          )
      )
  );


// export type IAsyncTaskConstraint<GValue, GKind = any> = (
//   [GValue] extends [AsyncTask<unknown>]
//     ? never
//     : (
//       [GValue] extends [Promise<unknown>]
//         ? never
//         : (
//           [GValue] extends [GKind]
//             ? any
//             : never
//           )
//       )
//   );


// export type IAsyncTaskConstraint<GValue> = (
//   [GValue] extends [null | undefined | void]
//     ? any
//     : (
//       [GValue] extends [AsyncTask<unknown>]
//         ? never
//         : (
//           [GValue] extends [Promise<unknown>]
//             ? never
//             : any
//           )
//       )
//   );

// export type IAsyncTaskConstraint<GValue> = (
//   [GValue] extends [AsyncTask<unknown>]
//     ? never
//     : (
//       [GValue] extends [Promise<unknown>]
//         ? never
//         : any
//       )
//   );

// export type IAsyncTaskConstraint<GValue, GKind = any> = (
//   0 extends (1 & GValue)
//     ? string
//     : (
//       [GValue] extends [AsyncTask<unknown>] ? never : ([
//         GValue
//       ] extends [Promise<unknown>] ? never : ([
//         GValue
//       ] extends [GKind] ? any : never))
//       )
//   );

// export type IAsyncTaskConstraint<GValue, GKind = any> = (
//   unknown extends GValue
//     ? boolean
//     : (
//       AsyncTask<unknown> extends GValue
//         ? never
//         : (
//           Promise<any> extends GValue
//             ? never
//             : (
//               GKind extends GValue
//                 ? any
//                 : never
//               )
//           )
//       )
//   );

// export type IAsyncTaskConstraint<GValue, GKind = any> = (
//   AsyncTask<unknown> extends GValue
//     ? never
//     : (
//       Promise<any> extends GValue
//         ? never
//         : (
//           GKind extends GValue
//             ? any
//             : never
//           )
//       )
//   );




// export type IAsyncTaskConstraint<GValue, GKind = any> = [GValue] extends [Promise<any>] ? never : string;
// export type IAsyncTaskConstraint<GValue, GKind = any> = Promise<any> extends GValue ? never : string;


// type IThingValue =
//   | null
//   | boolean
//   | number
//   | string
//   | object
//   | IThingValue[]
//   ;


// type A = IAsyncTaskConstraint<unknown>;
// type B = IAsyncTaskConstraint<string>;
// type C = IAsyncTaskConstraint<unknown | string | Promise<false> | any>;
// type C1 = IAsyncTaskConstraint<unknown | string | Promise<false>>;
// type D = IAsyncTaskConstraint<boolean | string>;
// type E = IAsyncTaskConstraint<any>;
// type F = IAsyncTaskConstraint<string, string | boolean>;
// type G = IAsyncTaskConstraint<string, number | boolean>;
// type H = IAsyncTaskConstraint<void>;
// type I = IAsyncTaskConstraint<string[], IThingValue>;

