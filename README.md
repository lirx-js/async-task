

<p align="center">
  Abortable Promises for everyone !
</p>


[![npm (scoped)](https://img.shields.io/npm/v/@lirx/async-task.svg)](https://www.npmjs.com/package/@lirx/async-task)
![npm](https://img.shields.io/npm/dm/@lirx/async-task.svg)
![NPM](https://img.shields.io/npm/l/@lirx/async-task.svg)
![npm type definitions](https://img.shields.io/npm/types/@lirx/async-task.svg)


# @lirx/async-task

## 📦 Installation

```bash
yarn add @lirx/async-task
# or
npm install @lirx/async-task --save
```


## 🤕 The problem


Promises are great but they lack of `cancellation`.

Usually, aborting a promise is done though an AbortSignal, but only a few APIs support it:

```ts
const controller = new AbortController();

fetch('https://example.com', {
  signal: controller.signal,
})
  .then((response: Response): Promise<any> => {
    return response.json(); // sadly, it's not possible to abort this operation
  })
  .then((data: any): void => {
    console.log(data);
  });

setTimeout(() => {
  controller.abort(new Error('Timeout'));
}, 1000);
```

When chaining Promises, the lack of a simple cancellation becomes frustrating, or conducts to errors or unwanted behaviours.

In the previous example, if the signal is aborted during the fetch, then the promise is cancelled as expected (rejected with an error),
however, if this happens during the conversion to JSON, then it is resolved as usual **which is an unwanted behaviour**.

To solve this problem, we propose a new PromiseLike class called `AsyncTask`, which natively supports cancellation.

## 🔧 Example

[//]: # (```ts)

[//]: # (const abortable = Abortable.timeout&#40;1000&#41;;)

[//]: # ()
[//]: # (asyncFetchJSON&#40;'https://example.com', undefined, abortable&#41;)

[//]: # (  .successful&#40;&#40;data: any&#41;: void => {)

[//]: # (    console.log&#40;data&#41;;)

[//]: # (  }&#41;;)

[//]: # (```)

```ts
const abortable = Abortable.timeout(1000);

const asyncTask = doAsyncTaskA(abortable)
  .successful((data: string, abortable: Abortable):AsyncTask<string> => {
    return doAsyncTaskB(data, abortable);
  })
  .errored((error: unknown, abortable: Abortable): AsyncTask<string> => {
    return doAsyncTaskC(error, abortable);
  })
  .successful((data: string, abortable: Abortable): void => {
    console.log(data);
  });
```

It's possible to `await` an `AsyncTask` (`await asyncTask;`), or to convert it into a regular Promise (`await asyncTask.toPromise();`)

**An AsyncTask is compatible with a Promise.**

## 📑 Documentation

[//]: # (TOC https://ecotrust-canada.github.io/markdown-toc/)

- [Abortable](#abortable)
- [AsyncTask](#asynctask)
- [Built-in functions](#built-in-functions)

---

### Abortable

This represents a "token" able to cancel an `AsyncTask`.

It replaces the classes `AbortControler` and `AbortSignal` as one entity.

#### table of content:

- [constructor](#constructor)
- properties:
  - [get aborted](#get-aborted)
  - [get reason](#get-reason)
- methods:
  - [onAbort](#onabort)
  - [toAbortSignal](#toabortsignal)
- static methods:
  - [static get never](#static-get-never)
  - [static fromAbortSignal](#static-fromabortsignal)
  - [static abort](#static-abort)
  - [static timeout](#static-timeout)
  - [static derive](#static-derive)
  - [static merge](#static-merge)
    


#### constructor

```ts
class Abortable {
  constructor(init: (abort: IAbortFunction) => void);
}
```

```ts
type IAbortFunction = (reason: any) => void;
```

##### parameters

- `init`: a function to be executed by the constructor.
It receives one function as parameter (`abort`).
When `abort` is called, the Abortable is aborted.

##### return value

When called via `new`, the `Abortable` constructor returns an abortable object.
The abortable object will become *aborted* with a specific *reason* when the functions `abort` is invoked.


##### example

Creates an `Abortable` aborted after 1000ms:

```ts
const abortable = new Abortable((abort: IAbortFunction): void => {
  setTimeout(() => abort(new Error('Timeout'), 1000));
});
```

#### get aborted

```ts
get aborted(): boolean;
```

Returns true if the `Abortable` is aborted.

#### get reason

```ts
get reason(): any;
```

Returns the abort reason of the `Abortable`.
If the `Abortable` is not aborted, it returns `undefined`.


#### onAbort

This method is used to subscribe to the *abort* event.

```ts
onAbort(onAbort: IAbortFunction): IAbortableUnsubscribe;
```

```ts
type type IAbortableUnsubscribe = () => void;
```

##### parameters

- `onAbort`: a function to be executed when the Abortable is aborted, **or immediately** if the Abortable is already aborted.
  It receives the abort `reason`.

##### return value

A function to call when we want to unsubscribe of this event.

##### example

Subscribes to the `abort` event:

```ts
const unsubscribe = abortable.onAbort((reason: any): void => {
  console.log('aborted', reason);
});
```

#### toAbortSignal

This method is used to convert an `Abortable` to an `AbortSignal`.

```ts
toAbortSignal(): AbortSignal
```

This is useful when dealing with APIs supporting `AbortSignal`.

##### return value

An `AbortSignal` aborted when the `Abortable` is aborted.

##### example

```ts
fetch(url, {
  signal: abortable.toAbortSignal(),
})
```


#### static get never

```ts
static get never(): Abortable;
```

Returns an `Abortable`, which is never aborted.
Useful in some situations where you never want to cancel an `AsyncTask`.


#### static fromAbortSignal

Creates an `Abortable` from an `AbortSignal`.

```ts
static fromAbortSignal(signal: AbortSignal): Abortable
```

##### parameters

- `signal`: the `AbortSignal` to create the `Abortable` from.

##### return value

An `Abortable` aborted when the `AbortSignal` is aborted.


#### static abort

Creates an aborted `Abortable`.

```ts
static abort(reason: any): Abortable
```

##### parameters

- `reason`: the reason why the operation was aborted.

##### return value

An `Abortable` aborted with `reason`.


#### static timeout

Creates an `Abortable` aborted after a specified time.

```ts
static timeout(ms: number): Abortable
```

##### parameters

- `ms`: the time in milliseconds before the returned `Abortable` will abort.

##### return value

An `Abortable` aborted after `ms` milliseconds.

##### example

A simple example showing a fetch operation that will timeout if unsuccessful after 5 seconds:

```ts
fetch(url, {
  signal: Abortable.timeout(5000).toAbortSignal(),
})
```


#### static derive

```ts
static derive(...abortables: Abortable[]): IDeriveAbortableResult;
```

```ts
type IDeriveAbortableResult = [
  abort: IAbortFunction,
  aborbale: Abortable,
];
```

##### parameters

- `...abortables`: a list of `Abortable` to build the returned `Abortable` from.
If any of these `Abortable` is aborted, the returned `Abortable` is aborted too.

##### return value

A tuple composed of :

- `abort`: which is a function having the same type and properties than the one received as parameter from the `init` function provided in the constructor.
It may be used to abort the returned `Abortable`
- `aborbale`: an `Abortable` aborted if any of the provided `Abortable` is aborted, or if `abort` is called.

##### example

A simple example showing a fetch operation that will be aborted immediately:

```ts
const [abort, abortable] = Abortable.derive();

const request = fetch(url, {
  signal: abortable.toAbortSignal(),
});

abort();
```


#### static merge

```ts
static merge(...abortables: Abortable[]): Abortable;
```

##### parameters

- `...abortables`: a list of `Abortable` to build the returned `Abortable` from.
  If any of these `Abortable` is aborted, the returned `Abortable` is aborted too.

##### return value

An `Abortable` aborted if any of the provided `Abortable` is aborted.

##### example

A simple example showing a fetch operation that will be aborted after 1000ms:

```ts
const abortableA = Abortable.timeout(5000);
const abortableB = Abortable.timeout(1000);
const abortable = Abortable.merge(abortableA, abortableB);

const request = fetch(url, {
  signal: abortable.toAbortSignal(),
});
```

--------------------------------------------------------------------------------


### AsyncTask

The `AsyncTask` object represents the eventual completion, failure, or cancellation of an asynchronous operation and its resulting value.

It's an alternative to a `Promise`, supporting *cancellation*.
It has a similar constructor, similar methods, and similar behaviour.
It simply completes the `Promise` with a native support for `cancellation`.

#### table of content:

- [constructor](#constructor)
- methods:
  - [settled](#settled)
  - [then](#then)
  - [successful](#successful)
  - [errored](#errored)
  - [aborted](#aborted)
  - [switchAbortable](#switchabortable)
  - [finally](#finally)
  - [toPromise](#topromise)
- static methods:
  - [static fromFactory](#static-fromfactory)
  - [static retry](#static-retry)
  - [static success](#static-success)
  - [static error](#static-error)
  - [static never](#static-never)
  - [static void](#static-void)
  - [static all](#static-all)
  - [static race](#static-race)
  

#### constructor

```ts
class AsyncTask<GValue extends IAsyncTaskConstraint<GValue>> {
  constructor(
    init: IAsyncTaskInitFunction<GValue>,
    abortable: Abortable,
  );
}
````

```ts
type IAsyncTaskInitFunction<GValue extends IAsyncTaskConstraint<GValue>> = (
  success: IAsyncTaskSuccessFunction<GValue>,
  error: IAsyncTaskErrorFunction,
  abortable: Abortable,
) => void;

type IAsyncTaskSuccessFunction<GValue extends IAsyncTaskConstraint<GValue>> = (value: IAsyncTaskInput<GValue>) => void;

type IAsyncTaskErrorFunction = (error: any) => void;

type IAsyncTaskInput<GValue extends IAsyncTaskConstraint<GValue>> =
  | AsyncTask<GValue>
  | Promise<GValue>
  | GValue
  ;
```

**INFO**: `IAsyncTaskConstraint` is just a type constrain. It ensures that `GValue`cannot be a `Promise` nor an `AsyncTask`.
This fixes some Promise's issues with typing.

##### parameters

- `init`: a function to be executed by the constructor.
It receives two functions as parameters: `success` and `error`; and a third parameter `abortable`.
Any errors thrown in this function will cause the `AsyncTask` to switch in an *error* state.
- `abortable`: an `Abortable` signaling the `AsyncTask` to stop when aborted.

##### return value

When called via `new`, the `AsyncTask` constructor returns an asyncTask object.
The asyncTask object will become *resolving* when either of the functions `success` or `error` are invoked; or when the 
provided `Abortable` is *aborted*.
Note that if you call `success` or `error` and pass another `AsyncTask` or `Promise` object as an argument,
it can be said to be *resolving*, but still not *resolved*.

##### description

An `Asynctask` is extremely similar to a Promise in its behaviour,
but it accepts an `Abortable` as input to be able to *cancel* the operation.

Let's break down the parameters received by the `init` function:

###### success

```ts
success: (value: IAsyncTaskInput<GValue>) => void
```

If the `value` parameter passed to the `success` function is:

- another `AsyncTask` or `Promise` object: the newly constructed `AsyncTask`'s state will be "locked in"
  to the value passed. When this last one *resolves*, the `AsyncTask` is resolved with the same state (a success or an error).
- another value: the newly constructed `AsyncTask` switches to a *success* state with this value. 

###### error

```ts
error: (error: any) => void
```

Similar to `success`, the `error` parameter passed to the `error` function can be another `AsyncTask` or `Promise` object.
In this case, the `AsyncTask`'s state is locked in until this "value" is resolved, at which point, it switches to an *error* state with the provided `error`.
If the provided `error` is not an `AsyncTask` or `Promise`, then the `AsyncTask` switches to an *error* state with this error.

###### abortable

```ts
abortable: Abortable
```

This is the `Abortable` bound to this `AsyncTask`.
If this `Abortable` is aborted, then the `AsyncTask` is automatically aborted.
This parameter is useful to clean an async operation using for example its `onAbort` method.

##### example

Creates an `AsyncTask` becoming successful after a specific period of time:

```ts
function asyncTimeout(
  ms: number,
  abortable: Abortable,
): AsyncTask<void> {
  return new AsyncTask<void>((
    success: IAsyncTaskSuccessFunction<void>,
    error: IAsyncTaskErrorFunction,
    abortable: Abortable,
  ): void => {
    const timer = setTimeout(success, ms);
    abortable.onAbort(() => {
      clearTimeout(timer);
    });
  }, abortable);
}
```

#### settled

This is the main method to handle the *resolved* state of an `AsyncTask`.

It immediately returns an equivalent `AsyncTask` object, allowing you to chain calls to other asyncTask methods.

```ts
settled<GNewValue extends IAsyncTaskConstraint<GNewValue>>(
  onSettled: IAsyncTaskOnSettledFunction<GValue, GNewValue>,
  abortable: Abortable = this.#abortable,
): AsyncTask<GNewValue>
```

```ts
interface IAsyncTaskOnSettledFunction<GValue extends IAsyncTaskConstraint<GValue>, GNewValue extends IAsyncTaskConstraint<GNewValue>> {
  (
    state: IAsyncTaskState<GValue>,
    abortable: Abortable,
  ): IAsyncTaskInput<GNewValue>;
}

interface IAsyncTaskSuccessState<GValue extends IAsyncTaskConstraint<GValue>> {
  readonly state: 'success';
  readonly value: GValue;
}

interface IAsyncTaskFinalErrorState {
  readonly state: 'error';
  readonly error: any;
}

interface IAsyncTaskFinalAbortState {
  readonly state: 'abort';
  readonly reason: any;
}

type IAsyncTaskState<GValue extends IAsyncTaskConstraint<GValue>> =
  | IAsyncTaskSuccessState<GValue>
  | IAsyncTaskFinalErrorState
  | IAsyncTaskFinalAbortState
  ;
```

##### parameters

- `onSettled`: a function **asynchronously** called when the `AsyncTask` is *resolved*. It happens when the `AsyncTask` is fully resolved with a *success*, *error*, or *abort* state.
  This function receives two parameters, the state of the `AsyncTask` (including its value or reason) and the `Abortable` provided as input.
  This function may return a value, an `AsyncTask` or a `Promise`.
- `abortable`: this optional parameters gives us the opportunity to create a new `AsyncTask` with a different `Abortable`.
  If omitted, the current `AsyncTask`'s `Abortable` is used instead.
  If the current `AsyncTask` switches to an *aborted* state, this parameter gives us the opportunity to create a new `AsyncTask` with a different `Abortable`.
  If omitted, the current `AsyncTask`'s `Abortable` is used instead.

##### return value

Returns a new `AsyncTask` immediately.

This new `AsyncTask` is always pending when returned, regardless of the current `AsyncTask`'s status.

`onSettled` will be executed to handle the current `AsyncTask`'s state.
The call always happens asynchronously, even when the current `AsyncTask` is already resolved.
The behavior of the returned `AsyncTask` (call it `asyncTask`) depends on the handler's execution result, following a specific set of rules.
If the handler function:

- returns a value: `asyncTask` switches to a *success* state with the returned value as its value.
- doesn't return anything: `asyncTask` switches to a *success* state with `undefined` as its value.
- throws an error: `asyncTask` switches to an *error* state with the thrown error as its value.
- returns an already *successful* `AsyncTask`: `asyncTask` switches to a *success* state with that `AsyncTask`'s value as its value.
- returns an already *errored* `AsyncTask`: `asyncTask` switches to an *error* state with that `AsyncTask`'s value as its value.
- returns another *pending* `AsyncTask`: `asyncTask` is pending and switches to a *success/error* state with that `AsyncTask`'s value as its value immediately after that `AsyncTask` becomes *success/error*.

If an `AsyncTask` is returned, it **MUST** have the same abortable as the one provided as second argument (`abortable`).

##### example

```ts
const abortable = Abortable.never;

new AsyncTask<number>((success) => {
  success(Math.random() * 1000);
}, abortable)
  .settled(
    (state: IAsyncTaskState<number>, abortable: Abortable): AsynTask<void> => {
      switch (state.state) {
        case 'success':
          return asyncTimeout(value, abortable);
        case 'error':
          console.error(error);
          throw error;
        case 'aborted':
          console.log('aborted');
      }
      
    },
    (error: unknown, abortable: Abortable): never => {
     
    },
  );
```

#### then

The `then()` method of an `AsyncTask` object takes two arguments:
the callback functions for the *success* and *error* cases of the `AsyncTask`.
It immediately returns an equivalent `AsyncTask` object, allowing you to chain calls to other asyncTask methods.

```ts
then<GNewValue extends IAsyncTaskConstraint<GNewValue>>(
  onSuccessful: IAsyncTaskOnSuccessfulFunction<GValue, GNewValue>,
  onErrored: IAsyncTaskOnErroredFunction<GNewValue>,
): AsyncTask<GNewValue>
```

```ts
type IAsyncTaskOnSuccessfulFunction<GValue extends IAsyncTaskConstraint<GValue>, GNewValue extends IAsyncTaskConstraint<GNewValue>> = (
  value: GValue,
  abortable: Abortable,
) => IAsyncTaskInput<GNewValue>;


type IAsyncTaskOnErroredFunction<GNewValue extends IAsyncTaskConstraint<GNewValue>> = (
  error: any,
  abortable: Abortable,
) => IAsyncTaskInput<GNewValue>;
```

##### parameters

- `onSuccessful`: a function **asynchronously** called if the `AsyncTask` is successful.
This function has two parameters, the success value and the `Abortable` linked to this `AsyncTask`.
This function may return a value, an `AsyncTask` or a `Promise`.
- `onRejected`: a function **asynchronously** called if the `AsyncTask` is errored.
This function has two parameters, the rejection reason and the `Abortable` linked to this `AsyncTask`.
  This function may return a value, an `AsyncTask` or a `Promise`.

Unlike Promises, **the two functions are mandatory**. They can't be omitted nor null or undefined.

##### return value

Returns a new `AsyncTask` immediately.

This new `AsyncTask` is always pending when returned, regardless of the current `AsyncTask`'s status.

One of the `onSuccessful` and `onRejected` handlers will be executed to handle the current `AsyncTask`'s success or error.
The call always happens asynchronously, even when the current `AsyncTask` is already resolved.
The behavior of the returned `AsyncTask` (call it `asyncTask`) depends on the handler's execution result, following a specific set of rules.
If the handler function:

- returns a value: `asyncTask` switches to a *success* state with the returned value as its value.
- doesn't return anything: `asyncTask` switches to a *success* state with `undefined` as its value.
- throws an error: `asyncTask` switches to an *error* state with the thrown error as its value.
- returns an already *successful* `AsyncTask`: `asyncTask` switches to a *success* state with that `AsyncTask`'s value as its value.
- returns an already *errored* `AsyncTask`: `asyncTask` switches to an *error* state with that `AsyncTask`'s value as its value.
- returns another *pending* `AsyncTask`: `asyncTask` is pending and becomes switches to a *success/error* state with that `AsyncTask`'s value as its value immediately after that `AsyncTask` becomes *success/error*.

If an `AsyncTask` is returned, it **MUST** have the same abortable as the one provided as second argument (`abortable`).

##### description

This function is compatible with the [Thenable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#thenables) object.

In consequence, it's possible to `await` an `AsyncTask`.

##### example

```ts
const abortable = Abortable.never;

new AsyncTask<number>((success) => {
  success(Math.random() * 1000);
}, abortable)
  .then(
    (value: number, abortable: Abortable): AsynTask<void> => {
      return asyncTimeout(value, abortable);
    },
    (error: unknown, abortable: Abortable): never => {
      console.error(error);
      throw error;
    },
  );
```


#### successful

The `successful()` method of an `AsyncTask` is equivalent to the `then()` method, but only with the `onSuccessful` callback function.

```ts
successful<GNewValue extends IAsyncTaskConstraint<GNewValue>>(
  onSuccessful: IAsyncTaskOnSuccessfulFunction<GValue, GNewValue>,
): AsyncTask<GNewValue>
```

If the current `AsyncTask` switches to an *error* state, then the returned `AsyncTask` switches to an *error* state too,
else the behaviour is the same as the one using the `then()` method.

##### example

```ts
const abortable = Abortable.never;

new AsyncTask<number>((success) => {
  success(Math.random() * 1000);
}, abortable)
  .successful((value: number, abortable: Abortable): AsynTask<void> => {
    return asyncTimeout(value, abortable);
  })
  .successful((): void => {
    console.log('done !');
  });
```

#### errored

The `errored()` method of an `AsyncTask` is equivalent to the `then()` method, but only with the `onErrored` callback function.

```ts
errored<GNewValue extends IAsyncTaskConstraint<GNewValue>>(
  onErrored: IAsyncTaskOnErroredFunction<GNewValue>,
): AsyncTask<GValue | GNewValue>
```

If the current `AsyncTask` switches to a *success* state, then the returned `AsyncTask` switches to a *success* state too,
else the behaviour is the same as the one using the `then()` method.

##### example

```ts
const abortable = Abortable.never;

new AsyncTask<number>((success) => {
  error(new Error('Error !'));
}, abortable)
  .errored((error: unknown, abortable: Abortable): AsynTask<void> => {
    console.log('error catched', error);
    return asyncTimeout(500, abortable);
  })
  .successful((): void => {
    console.log('done !');
  });
```


#### aborted

The `aborted()` method is tricky and must be used with caution:

```ts
aborted<GNewValue extends IAsyncTaskConstraint<GNewValue>>(
  onAborted: IAsyncTaskOnAbortedFunction<GNewValue>,
  abortable?: Abortable,
): AsyncTask<GValue | GNewValue>
```

```ts
type IAsyncTaskOnAbortedFunction<GNewValue extends IAsyncTaskConstraint<GNewValue>> = (
  reason: any,
  abortable: Abortable,
) => IAsyncTaskInput<GNewValue>;
```

##### parameters

- `onAborted`: a function **asynchronously** called if the `AsyncTask` is aborted.
  This function has two parameters, the abort reason value and an `Abortable` to use if an `AsyncTask` is returned.
  This function may return a value, an `AsyncTask` or a `Promise`.
- `abortable`: this optional parameters, allows us to "switch" of `Abortable`.
Indeed, the current `AsyncTask` is in an *aborted* state, so this parameter gives us the opportunity to create a new `AsyncTask` with a different `Abortable`.
If omitted, the current `AsyncTask`'s `Abortable` is used instead.

##### return value

Returns a new `AsyncTask` immediately, with `abortable` as its own `Abortable`.

This new `AsyncTask` is always pending when returned, regardless of the current `AsyncTask`'s status.

The `onAborted` handler will be executed to handle the current `AsyncTask`'s *abort* state.
The call always happens asynchronously, even when the current `AsyncTask` is already resolved.
The behavior of the returned `AsyncTask` is similar to the `then()` method.

##### example

```ts
const abortable = Abortable.never;

new AsyncTask<number>((success) => {
  success(Math.random() * 1000);
}, abortable)
  .successful((ms: number, abortable: Abortable): never => {
    // let's create an abortable which "races" between the received abortable ('abortable') and a timeout of 500ms
    const sharedAbortable = Abortable.merge([
      abortable,
      Abortable.timeout(500),
    ]);
    
    // in 50% of the time, it will abort before the following AsyncTask resolves

    // we cannot return an AsyncTask with a different Abortable, because only one controller must exists
    return asyncTimeout(ms, sharedAbortable)
      // so we use the 'aborted()' method, with the original Abortable
      .aborted((reason: unknown): never => {
        // in which we throw an error
        throw new Error(`Oops child AsyncTask aborted with: ${reason}`);
      }, abortable);
  });
```

#### switchAbortable

```ts
switchAbortable(abortable: Abortable): AsyncTask<GValue>
```

This is equivalent to:

```ts
return this.aborted<GValue>((reason: any): never => {
  throw reason;
}, abortable);
```

##### example

```ts
const abortable = Abortable.never;

new AsyncTask<number>((success) => {
  success(Math.random() * 1000);
}, abortable)
  .successful((ms: number, abortable: Abortable): never => {
    const sharedAbortable = Abortable.merge([
      abortable,
      Abortable.timeout(500),
    ]);

    return asyncTimeout(ms, sharedAbortable)
      .switchAbortable(abortable);
  });
```


#### finally

```ts
finally(
  onFinally: IAsyncTaskOnFinallyFunction<GValue>,
): AsyncTask<GValue>
```

```ts
type IAsyncTaskOnFinallyFunction<GValue extends IAsyncTaskConstraint<GValue>> = (
  state: IAsyncTaskState<GValue>,
  abortable: Abortable,
) => IAsyncTaskInput<void>
```


##### parameters

- `onFinally`: a function **asynchronously** called if the `AsyncTask` is resolved (successful/errored/aborted).
  This function has two parameters, the state of the `AsyncTask` and an `Abortable` to use if an `AsyncTask` is returned.
  This function may return a value, an `AsyncTask` or a `Promise`.

##### return value

Returns a new `AsyncTask` immediately.

The `onFinally` handler will be executed when the current `AsyncTask` is resolved.
The call always happens asynchronously, even when the current `AsyncTask` is already resolved.

If an error is thrown in the `onFinally`, a rejected Promised is returned or an *errored* `AsyncTask` is returned,
then the newly created `AsyncTask` will error too with this error.
Else, the newly created `AsyncTask` will success, error or abort according to the current `AsyncTask` state.

##### example

```ts
const readAll = (
  reader: ReadableStreamDefaultReader<string>,
  abortable: Abortable,
): AsyncTask<string> => {
  return AsyncTask.fromFactory(() => reader.read(), abortable)
    .successful((result: ReadableStreamReadResult<string>, abortable: Abortable) => {
      if (result.done) {
        return '';
      } else {
        return readAll(reader, abortable)
          .successful((output: string): string => {
            return result.value + output;
          });
      }
    });
};

const decoder = new TextDecoderStream();

const reader = encoder.readable.getReader();
const writer = encoder.writable.getWriter();

const abortable = Abortable.never;

readAll(reader, abortable)
  .successful((output: string): void => {
    console.log('decoder', output);
  })
  .finally((): void => {
    reader.releaseLock();
  });

writer.write(new TextEncoder().encode('Hello world !'));
writer.close();
```



#### toPromise

Creates a Promise from an `AsyncTask`.

```ts
toPromise(): Promise<GValue>
```

##### return value

Returns a Promise.

If the `AsyncTask` resolves with the state:

- *success*: fulfill the promise with the result value.
- *error*: reject the promise with the result error.
- *abort*: reject the promise with an "Abort" error.

##### example

```ts
const abortable = Abortable.never;

asyncTimeout(1000, abortable)
  .toPromise()
  .then(() => {
    console.log('done !');
  });
```



[//]: # (#### static from)

[//]: # ()
[//]: # (```ts)

[//]: # (static from<GValue extends IAsyncTaskConstraint<GValue>>&#40;)

[//]: # (  input: IAsyncTaskInput<GValue>,)

[//]: # (  abortable: Abortable,)

[//]: # (&#41;: AsyncTask<GValue>)

[//]: # (```)

[//]: # ()
[//]: # (##### parameters)

[//]: # ()
[//]: # (- `input`: a value, an `AsyncTask` or a `Promise`.)

[//]: # (- `abortable`: the `Abortable` linked to the returned `AsyncTask`.)

[//]: # ()
[//]: # (##### return value)

[//]: # ()
[//]: # (Returns an `AsyncTask` resolved with `input`.)

[//]: # ()
[//]: # (This is equivalent to:)

[//]: # ()
[//]: # (```ts)

[//]: # (return new AsyncTask<GValue>&#40;&#40;success: IAsyncTaskSuccessFunction<GValue>&#41;: void => {)

[//]: # (  success&#40;input&#41;;)

[//]: # (}, abortable&#41;;)

[//]: # (```)

[//]: # ()
[//]: # (Usually, you'll prefer to use `fromfactory` instead.)

[//]: # ()
[//]: # (##### example)

[//]: # ()
[//]: # (```ts)

[//]: # (AsyncTask.from<number>&#40;45, Abortable.never&#41;;)

[//]: # (```)

[//]: # ()

#### static fromFactory

```ts
static fromFactory<GValue extends IAsyncTaskConstraint<GValue>>(
  factory: IAsyncTaskFactory<GValue>,
  abortable: Abortable,
): AsyncTask<GValue>
```

```ts
type IAsyncTaskFactory<GValue extends IAsyncTaskConstraint<GValue>> = (abortable: Abortable) => IAsyncTaskInput<GValue>;
```

##### parameters

- `factory`: a function returning a value, an `AsyncTask` or a `Promise`.
It receives an `Abortable`.
- `abortable`: the `Abortable` linked to the returned `AsyncTask`.

##### return value

- if `abortable` is aborted, returns an *aborted* `AsyncTask`
- else, calls `factory`:
  - if an error is thrown from the factory, returns an *error* `AsyncTask`
  - if an `AsyncTask` is returned, returns this `AsyncTask`
  - else, returns an `AsyncTask` resolved with this the return of the `factory`.

##### examples

```ts
AsyncTask.fromFactory<number>(() => 45, Abortable.never); // resolved with 45
AsyncTask.fromFactory<void>(() => console.log('never happend'), Abortable.abort('a')); // the factory function is never called
AsyncTask.fromFactory<number>(() => Promise.resolve(45), Abortable.never); // resolved with 45
AsyncTask.fromFactory<number>(() => Promise.reject('error !'), Abortable.never); // rejected with 'error !'
AsyncTask.fromFactory<number>(() => AsyncTask.success(45), Abortable.never); // returns the AsyncTask generated by the factory
```

#### static retry

```ts
static retry<GValue extends IAsyncTaskConstraint<GValue>>(
  factory: IAsyncTaskFactory<GValue>,
  count: number,
  abortable: Abortable,
): AsyncTask<GValue>
```

##### definition

Tries `count` times to create an AsyncTask from an IAsyncTaskFactory:

1) if `count` is zero or less, throw an error
2) else call factory:
   - in case of success return the result
   - else decrease count by one:
     - if zero or less, throw the received error
     - else repeat (1) with the new `count` value

##### examples

```ts
AsyncTask.retry(() => fetch('https://example.com'), 5, Abortable.never);
```


#### static success

```ts
static success<GValue extends IAsyncTaskConstraint<GValue>>(
  value: IAsyncTaskInput<GValue>,
  abortable: Abortable,
): AsyncTask<GValue>
```

##### parameters

- `value`: a value, an `AsyncTask` or a `Promise`
- `abortable`: the `Abortable` linked to the returned `AsyncTask`.

##### return value

Returns an `AsyncTask` resolved with `value`.

This is equivalent to:

```ts
return new AsyncTask<GValue>((success: IAsyncTaskSuccessFunction<GValue>): void => {
  success(input);
}, abortable);
```

##### example

```ts
AsyncTask.success<number>(45, Abortable.never);
```


#### static error

```ts
static error<GValue extends IAsyncTaskConstraint<GValue> = unknown>(
  error: any,
  abortable: Abortable,
): AsyncTask<GValue>
```

##### parameters

- `error`: a value, an `AsyncTask` or a `Promise`
- `abortable`: the `Abortable` linked to the returned `AsyncTask`.

##### return value

Returns an `AsyncTask` rejected with `error`.

This is equivalent to:

```ts
return new AsyncTask<GValue>((
  success: IAsyncTaskSuccessFunction<GValue>,
  _error: IAsyncTaskErrorFunction,
): void => {
  _error(error);
}, abortable)
```

##### example

```ts
AsyncTask.error(new Error('Errored !'), Abortable.never);
```


#### static never

```ts
static never<GValue extends IAsyncTaskConstraint<GValue> = unknown>(
  abortable: Abortable,
): AsyncTask<GValue>
```

##### parameters

- `abortable`: the `Abortable` linked to the returned `AsyncTask`.

##### return value

Returns an `AsyncTask` which never resolves (may only be aborted).

This is equivalent to:

```ts
return new AsyncTask<GValue>(() => {}, abortable);
```


#### static void

```ts
static void(
  abortable: Abortable,
): AsyncTask<void>
```

##### parameters

- `abortable`: the `Abortable` linked to the returned `AsyncTask`.

##### return value

Returns an `AsyncTask` resolved with `undefined`.

This is equivalent to:

```ts
return this.success<void>(void 0, abortable);
```

##### example

```ts
AsyncTask.void(Abortable.never);
```


#### static all

```ts
static all<GFactories extends IGenericAsyncTaskFactoriesList>(
  factories: GFactories,
  abortable: Abortable,
): AsyncTask<IAsyncTaskAllValuesListReturn<GFactories>>
```

##### parameters

- `factories`: an iterable of `IAsyncTaskFactory`.
- `abortable`: the `Abortable` linked to the returned `AsyncTask`.

##### return value

Returns an `AsyncTask` resolved with all the values returned by the factories.

##### definition

Calls all the factories with an `Abortable` derived from the provided `abortable` called `factoriesAbortable`.

Awaits on all the results to be resolved, and stores their returning values in an array called `values`.

If all the results are in a *success* state **OR** the provided iterable is empty,
then the returned `AsyncTask` is resolved with `values`.

If any of the result is rejected, then the returned `AsyncTask` is rejected too.
Moreover, `factoriesAbortable` is aborted, meaning that other factories **MUST** be aborted.

This is extremely similar to `Promise.all`, but works with factories instead.
If one of the factories rejects, then the other factories are cancelled, optimizing resources.


##### example

```ts
const abortable = Abortable.never;

const asyncTask = AsyncTask.all([
  (abortableA: Abortable) => asyncTimeout(1000, abortableA),
  (abortableB: Abortable) => AsyncTask.error(new Error('Error !'), abortableB),
], abortable);
```

In this example, all the factories are called.
The second one returns an *errored* `AsyncTask`, so `asyncTask` switches to an *error* state,
and `abortableA` is aborted, effectively cleaning the pending timeout.


#### static race

```ts
static race<GFactories extends IGenericAsyncTaskFactoriesList>(
  factories: GFactories,
  abortable: Abortable,
): AsyncTask<IAsyncTaskRaceValueReturn<GFactories>>
```

##### parameters

- `factories`: an iterable of `IAsyncTaskFactory`.
- `abortable`: the `Abortable` linked to the returned `AsyncTask`.

##### return value

Returns an `AsyncTask` resolved with the first value or error returned by the factories.

##### definition

Calls all the factories with an `Abortable` derived from the provided `abortable` called `factoriesAbortable`.

Awaits on the first result to be resolved:

- if the result is in a *success* state, then the returned `AsyncTask` is resolved with this value.
- if the result is in an *error* state, then the returned `AsyncTask` is rejected with this error.

Moreover, `factoriesAbortable` is aborted, meaning that other factories **MUST** be aborted.

If the provided iterable is empty, the `AsyncTask` never resolves.

This is extremely similar to `Promise.race`, but works with factories instead.
If one of the factories succeeds or rejects, then the other factories are cancelled, optimizing resources.


##### example

```ts
const abortable = Abortable.never;

const asyncTask = AsyncTask.race([
  (abortableA: Abortable) => asyncTimeout(1000, abortableA),
  (abortableB: Abortable) => asyncTimeout(2000, abortableA),
], abortable);
```

In this example, all the factories are called.

The return of the first one finishes first with `undefined`, so `asyncTask` switches to a *success* state with `undefined` as value.
`abortableB` is aborted, effectively cleaning the pending second timeout.


#### static allSettled

[//]: # (TODO)

-------------------------------------

### Built-in functions

#### table of content:

- [asyncTimeout](#asynctimeout)
- [asyncFetch](#asyncfetch)


#### asyncTimeout

```ts
function asyncTimeout(
  ms: number,
  abortable: Abortable,
): AsyncTask<void>
```

##### parameters

- `ms`: the number of milliseconds to wait until the AsyncTask resolves.
- `abortable`: the `Abortable` linked to the returned `AsyncTask`.

##### return value

Returns an `AsyncTask` resolved after a specific amount of time.

##### example

```ts
const abortable = Abortable.never;

const asyncTask = AsyncTask.asyncTimeout(1000, abortable);
```


#### asyncFetch

```ts
function asyncFetch(
  input: RequestInfo | URL,
  init: IAsyncFetchRequestInit,
  abortable: Abortable,
): AsyncTask<Response>
```

##### definition

Similar to the `fetch()` function, but works with `AsyncTask` instead.

##### example

```ts
const abortable = Abortable.timeout(2000);

asyncFetch('https://example.com', void 0, abortable)
  .successful((response: Response, abortable: Abortable): AsyncTask<string> => {
    if (response.ok) {
      return AsyncTask.fromFactory<GData>(() => response.json(), abortable);
    } else {
      throw new Error(`Failed to fetch '${response.url}': ${response.status}`);
    }
  })
  .successful((result: string) => {
    console.log(result);
  });
```



-------------------------------------


## FAQ

> Why not using AbortController and AbortSignal ?

Because I wasn't totally satisfied of these classes.
I wanted an object able to do both but keeping the principle of *controller/worker*.
Moreover, I wanted more static methods, helping developers to rapidly construct such an object.
This is where the idea of `Abortable` came from.

Just like a Promise, after created, only the "creator" of the `Abortable` can abort it.
And the same if true for an `AsyncTask`. It simply cannot cancel itself, only the controller can do it.
This prevents bad patterns and undefined behaviours, even if it wasn't clear from the start. 

> Why not using Promise with AbortSignal ?

Because chaining promises with a common `AbortSignal` is a nightmare and is prone to errors.
Using `AsyncTask` gives you a robust framework to work with cancellable async operations.
