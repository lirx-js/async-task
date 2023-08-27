import { IAsyncTaskSuccessFunction } from './types/init/async-task-success-function.type';
import { IAsyncTaskErrorFunction } from './types/init/async-task-error-function.type';
import { Abortable } from '../abortable/abortable.class';
import { AsyncTask } from './async-task.class';
import { IAsyncTaskSuccessState } from './types/state/async-task-success-state.type';
import { noop } from '../helpers/noop.private';
import { IAsyncTaskErrorState } from './types/state/async-task-error-state.type';
import { IAsyncTaskConstraint } from './types/async-task-constraint.type';
import { asyncTimeout } from './built-in/async-timeout';
import { IAsyncTaskSettledState } from './types/state/async-task-settled-state.type.';

describe('AsyncTask', () => {
  const sleep = (t: number) => {
    return new Promise(_ => setTimeout(_, t));
  };

  /** INIT **/

  const ABORTED_MESSAGE = 'Aborted';

  const VALUE = 2;

  async function expectSuccess(
    task: AsyncTask<number>,
  ): Promise<void>;
  async function expectSuccess<GValue extends IAsyncTaskConstraint<GValue>>(
    task: AsyncTask<GValue>,
    value: GValue,
  ): Promise<void>;
  async function expectSuccess(
    task: AsyncTask<any>,
    ...value: any[]
  ): Promise<void> {
    return expect(await task.toPromise()).toBe(value.length === 0 ? VALUE : value[0]);
  }

  const ERROR = new Error('Error');

  const expectError = async (task: AsyncTask<any>, error: any = ERROR) => {
    await expect(async () => {
      await task.toPromise();
    })
      .rejects
      .toThrow(error);
  };

  const expectAborted = async (task: AsyncTask<any>) => {
    await expect(async () => {
      await task.toPromise();
    })
      .rejects
      .toThrow(ABORTED_MESSAGE);
  };

  const expectInvalid = async (task: AsyncTask<any>) => {
    await expect(async () => {
      await task.toPromise();
    })
      .rejects
      .toThrow();
  };

  /** TESTS **/

  describe('new', () => {
    test('init function called', async () => {
      const init = jest.fn();
      new AsyncTask<any>(init, Abortable.never);
      expect(init).toBeCalled();
    });

    test('init function params', async () => {
      const _abortable = Abortable.never;

      new AsyncTask<any>((
        success: IAsyncTaskSuccessFunction<any>,
        error: IAsyncTaskErrorFunction,
        abortable: Abortable,
      ): void => {
        expect(typeof success).toBe('function');
        expect(typeof error).toBe('function');
        expect(abortable).toBeInstanceOf(Abortable);
        expect(abortable).toBe(_abortable);
      }, _abortable);
    });

    test('throw', async () => {
      await expectError(
        new AsyncTask<number>((): void => {
          throw ERROR;
        }, Abortable.never),
      );
    });

    describe('success(...)', () => {
      test('immediate', async () => {
        await expectSuccess(
          new AsyncTask<number>((
            success: IAsyncTaskSuccessFunction<any>,
          ): void => {
            success(VALUE);
          }, Abortable.never),
        );
      });

      test('timeout', async () => {
        await expectSuccess(
          new AsyncTask<number>((
            success: IAsyncTaskSuccessFunction<any>,
          ): void => {
            setTimeout(() => {
              success(VALUE);
            }, 100);
          }, Abortable.never),
        );
      });

      describe('Promise', () => {
        test('.resolve', async () => {
          await expectSuccess(
            new AsyncTask<number>((
              success: IAsyncTaskSuccessFunction<any>,
            ): void => {
              success(Promise.resolve(VALUE));
            }, Abortable.never),
          );
        });

        test('.reject', async () => {
          await expectError(
            new AsyncTask<number>((
              success: IAsyncTaskSuccessFunction<any>,
              error: IAsyncTaskErrorFunction,
            ): void => {
              success(Promise.reject(ERROR));
            }, Abortable.never),
          );
        });
      });

      describe('AsyncTask', () => {
        test('.success', async () => {
          await expectSuccess(
            new AsyncTask<number>((
              success: IAsyncTaskSuccessFunction<any>,
              error: IAsyncTaskErrorFunction,
              abortable: Abortable,
            ): void => {
              success(AsyncTask.success(VALUE, abortable));
            }, Abortable.never),
          );
        });

        test('.error', async () => {
          await expectError(
            new AsyncTask<number>((
              success: IAsyncTaskSuccessFunction<any>,
              error: IAsyncTaskErrorFunction,
              abortable: Abortable,
            ): void => {
              success(AsyncTask.error(ERROR, abortable));
            }, Abortable.never),
          );
        });

        test('invalid', async () => {
          await expectInvalid(
            new AsyncTask<number>((
              success: IAsyncTaskSuccessFunction<any>,
            ): void => {
              // provide different Abortable
              success(AsyncTask.success(VALUE, Abortable.timeout(10)));
            }, Abortable.never),
          );
        });
      });
    });

    describe('error(...)', () => {
      test('immediate', async () => {
        await expectError(
          new AsyncTask<number>((
            success: IAsyncTaskSuccessFunction<any>,
            error: IAsyncTaskErrorFunction,
          ): void => {
            error(ERROR);
          }, Abortable.never),
        );
      });

      test('timeout', async () => {
        await expectError(
          new AsyncTask<number>((
            success: IAsyncTaskSuccessFunction<any>,
            error: IAsyncTaskErrorFunction,
          ): void => {
            setTimeout(() => {
              error(ERROR);
            }, 100);
          }, Abortable.never),
        );
      });

      describe('Promise', () => {
        test('.resolve', async () => {
          await expectError(
            new AsyncTask<number>((
              success: IAsyncTaskSuccessFunction<any>,
              error: IAsyncTaskErrorFunction,
            ): void => {
              error(Promise.resolve(ERROR));
            }, Abortable.never),
          );
        });

        test('.reject', async () => {
          await expectError(
            new AsyncTask<number>((
              success: IAsyncTaskSuccessFunction<any>,
              error: IAsyncTaskErrorFunction,
            ): void => {
              error(Promise.reject(ERROR));
            }, Abortable.never),
          );
        });
      });

      describe('AsyncTask', () => {
        test('.success', async () => {
          await expectError(
            new AsyncTask<number>((
              success: IAsyncTaskSuccessFunction<any>,
              error: IAsyncTaskErrorFunction,
              abortable: Abortable,
            ): void => {
              error(AsyncTask.success(ERROR, abortable));
            }, Abortable.never),
          );
        });

        test('.error', async () => {
          await expectError(
            new AsyncTask<number>((
              success: IAsyncTaskSuccessFunction<any>,
              error: IAsyncTaskErrorFunction,
              abortable: Abortable,
            ): void => {
              error(AsyncTask.error(ERROR, abortable));
            }, Abortable.never),
          );
        });

        test('invalid', async () => {
          await expectInvalid(
            new AsyncTask<number>((
              success: IAsyncTaskSuccessFunction<any>,
              error: IAsyncTaskErrorFunction,
            ): void => {
              // provide different Abortable
              error(AsyncTask.success(VALUE, Abortable.timeout(10)));
            }, Abortable.never),
          );
        });
      });
    });

    describe('abort', () => {
      test('immediate', async () => {
        await expectAborted(
          new AsyncTask<number>((
            success: IAsyncTaskSuccessFunction<any>,
          ): void => {
            success(1);
          }, Abortable.abort('aborted')),
        );
      });

      test('timeout', async () => {
        await expectAborted(
          new AsyncTask<number>(noop, Abortable.timeout(100)),
        );
      });
    });
  });

  describe('create', () => {
    test('success', async () => {
      await expectSuccess(AsyncTask.success(VALUE, Abortable.never));
    });

    test('error', async () => {
      await expectError(AsyncTask.error(ERROR, Abortable.never));
    });

    test('void', async () => {
      await expectSuccess(AsyncTask.void(Abortable.never), undefined);
    });

    describe('defer', () => {
      test('success', async () => {
        const { task, success } = AsyncTask.defer<number>(Abortable.never);
        success(VALUE);
        await expectSuccess(task);
      });

      test('error', async () => {
        const { task, error } = AsyncTask.defer<number>(Abortable.never);
        error(ERROR);
        await expectError(task);
      });
    });
  });

  describe('methods', () => {

    describe('toPromise', () => {
      test('success', async () => {
        expect(await AsyncTask.success(VALUE, Abortable.never).toPromise()).toBe(VALUE);
      });

      test('error', async () => {
        await expect(async () => {
          await AsyncTask.error(ERROR, Abortable.never).toPromise();
        })
          .rejects
          .toThrow(ERROR);
      });

      test('abort', async () => {
        await expect(async () => {
          await AsyncTask.success(undefined, Abortable.abort('aborted')).toPromise();
        })
          .rejects
          .toThrow(ABORTED_MESSAGE);

        await expect(async () => {
          await AsyncTask.never(Abortable.timeout(10)).toPromise();
        })
          .rejects
          .toThrow(ABORTED_MESSAGE);
      });
    });

    describe('settled', () => {
      describe('onSettled function properly called', () => {
        test('success', async () => {
          const spy = jest.fn();
          const task = AsyncTask.success(undefined, Abortable.never).settled(spy);
          expect(spy).not.toBeCalled();

          await task.toPromise();
          expect(spy).toHaveBeenCalledTimes(1);
        });

        test('error', async () => {
          const spy = jest.fn();
          const task = AsyncTask.error(ERROR, Abortable.never).settled(spy);
          expect(spy).not.toBeCalled();

          await task.toPromise();
          expect(spy).toHaveBeenCalledTimes(1);
        });

        test('abort', async () => {
          const abortable = Abortable.abort('abort');
          expect(abortable.aborted).toBe(true);

          const spy = jest.fn();
          const task = AsyncTask.success(undefined, abortable).settled(spy);
          expect(spy).not.toBeCalled();
          expect(task.abortable).toBe(abortable);

          await expectAborted(task);
          expect(spy).not.toBeCalled();
        });
      });

      describe('correct value received', () => {
        test('success', async () => {
          await AsyncTask.success(VALUE, Abortable.never)
            .settled(
              (state: IAsyncTaskSettledState<number>): void => {
                expect(state.state).toBe('success');
                expect((state as IAsyncTaskSuccessState<number>).value).toBe(VALUE);
              },
            )
            .toPromise()
          ;
        });

        test('error', async () => {
          await AsyncTask.error(ERROR, Abortable.never)
            .settled(
              (state: IAsyncTaskSettledState<number>): void => {
                expect(state.state).toBe('error');
                expect((state as IAsyncTaskErrorState).error).toBe(ERROR);
              },
            )
            .toPromise()
          ;
        });
      });

      describe('correct value returned', () => {
        describe('success', () => {
          const successfulTask = AsyncTask.void(Abortable.never);

          test('throw', async () => {
            await expectError(
              successfulTask
                .settled(
                  (): number => {
                    throw ERROR;
                  },
                ),
            );
          });

          test('value', async () => {
            await expectSuccess(
              successfulTask
                .settled(
                  (): number => {
                    return VALUE;
                  },
                ),
            );
          });

          describe('Promise', () => {
            test('.resolve', async () => {
              await expectSuccess(
                successfulTask
                  .settled(
                    (): Promise<number> => {
                      return Promise.resolve(VALUE);
                    },
                  ),
              );
            });

            test('.reject', async () => {
              await expectError(
                successfulTask
                  .settled(
                    (): Promise<number> => {
                      return Promise.reject(ERROR);
                    },
                  ),
              );
            });
          });

          describe('AsyncTask', () => {
            test('.success', async () => {
              await expectSuccess(
                successfulTask
                  .settled(
                    (_, abortable: Abortable): AsyncTask<number> => {
                      return AsyncTask.success(VALUE, abortable);
                    },
                  ),
              );
            });

            test('.error', async () => {
              await expectError(
                successfulTask
                  .settled(
                    (_, abortable: Abortable): AsyncTask<number> => {
                      return AsyncTask.error(ERROR, abortable);
                    },
                  ),
              );
            });

            test('invalid', async () => {
              await expectInvalid(
                successfulTask
                  .settled(
                    (): AsyncTask<number> => {
                      const task = AsyncTask.error(ERROR, Abortable.timeout(10));
                      task.errored(noop);
                      return task;
                    },
                  ),
              );
            });
          });
        });

        describe('error', () => {
          const erroredTask = AsyncTask.error(ERROR, Abortable.never);
          erroredTask.errored(noop);

          test('throw', async () => {
            await expectError(
              erroredTask
                .settled(
                  (): number => {
                    throw ERROR;
                  },
                ),
            );
          });

          test('value', async () => {
            await expectSuccess(
              erroredTask
                .settled(
                  (): number => {
                    return VALUE;
                  },
                ),
            );
          });

          describe('Promise', () => {
            test('.resolve', async () => {
              await expectSuccess(
                erroredTask
                  .settled(
                    (): Promise<number> => {
                      return Promise.resolve(VALUE);
                    },
                  ),
              );
            });

            test('.reject', async () => {
              await expectError(
                erroredTask
                  .settled(
                    (): Promise<number> => {
                      return Promise.reject(ERROR);
                    },
                  ),
              );
            });
          });

          describe('AsyncTask', () => {
            test('.success', async () => {
              await expectSuccess(
                erroredTask
                  .settled(
                    (_, abortable: Abortable): AsyncTask<number> => {
                      return AsyncTask.success(VALUE, abortable);
                    },
                  ),
              );
            });

            test('.error', async () => {
              await expectError(
                erroredTask
                  .settled(
                    (_, abortable: Abortable): AsyncTask<number> => {
                      return AsyncTask.error(ERROR, abortable);
                    },
                  ),
              );
            });

            test('invalid', async () => {
              await expectInvalid(
                erroredTask
                  .settled(
                    (): AsyncTask<number> => {
                      const task = AsyncTask.error(ERROR, Abortable.timeout(10));
                      task.errored(noop);
                      return task;
                    },
                  ),
              );
            });
          });
        });
      });
    });

    describe('then', () => {
      describe('onSuccess and onError functions properly called', () => {
        test('success', async () => {
          const spy1 = jest.fn();
          const spy2 = jest.fn();
          const task = AsyncTask.success(undefined, Abortable.never).then(spy1, spy2);
          expect(spy1).not.toBeCalled();
          expect(spy2).not.toBeCalled();

          await task.toPromise();
          expect(spy1).toHaveBeenCalledTimes(1);
          expect(spy2).not.toBeCalled();
        });

        test('error', async () => {
          const spy1 = jest.fn();
          const spy2 = jest.fn();
          const task = AsyncTask.error(ERROR, Abortable.never).then(spy1, spy2);
          expect(spy1).not.toBeCalled();
          expect(spy2).not.toBeCalled();

          await task.toPromise();
          expect(spy1).not.toBeCalled();
          expect(spy2).toHaveBeenCalledTimes(1);
        });

        test('abort', async () => {
          const abortable = Abortable.abort('abort');
          expect(abortable.aborted).toBe(true);

          const spy1 = jest.fn();
          const spy2 = jest.fn();
          const task = AsyncTask.success(undefined, abortable).then(spy1, spy2);
          expect(spy1).not.toBeCalled();
          expect(spy2).not.toBeCalled();
          expect(task.abortable).toBe(abortable);

          await expectAborted(task);
          expect(spy1).not.toBeCalled();
          expect(spy2).not.toBeCalled();
        });
      });

      describe('correct value received', () => {
        test('onSuccessful', async () => {
          await AsyncTask.success(VALUE, Abortable.never)
            .then(
              (value: number): void => {
                expect(value).toBe(VALUE);
              },
              noop,
            )
            .toPromise()
          ;
        });

        test('onError', async () => {
          await AsyncTask.error(ERROR, Abortable.never)
            .then(
              noop,
              (error: any): void => {
                expect(error).toBe(ERROR);
              },
            )
            .toPromise()
          ;
        });
      });

      describe('correct value returned', () => {
        describe('onSuccessful', () => {
          const successfulTask = AsyncTask.void(Abortable.never);

          test('throw', async () => {
            await expectError(
              successfulTask
                .then(
                  (): number => {
                    throw ERROR;
                  },
                  noop as any,
                ),
            );
          });

          test('value', async () => {
            await expectSuccess(
              successfulTask
                .then(
                  (): number => {
                    return VALUE;
                  },
                  noop as any,
                ),
            );
          });

          describe('Promise', () => {
            test('.resolve', async () => {
              await expectSuccess(
                successfulTask
                  .then(
                    (): Promise<number> => {
                      return Promise.resolve(VALUE);
                    },
                    noop as any,
                  ),
              );
            });

            test('.reject', async () => {
              await expectError(
                successfulTask
                  .then(
                    (): Promise<number> => {
                      return Promise.reject(ERROR);
                    },
                    noop as any,
                  ),
              );
            });
          });

          describe('AsyncTask', () => {
            test('.success', async () => {
              await expectSuccess(
                successfulTask
                  .then(
                    (_, abortable: Abortable): AsyncTask<number> => {
                      return AsyncTask.success(VALUE, abortable);
                    },
                    noop as any,
                  ),
              );
            });

            test('.error', async () => {
              await expectError(
                successfulTask
                  .then(
                    (_, abortable: Abortable): AsyncTask<number> => {
                      return AsyncTask.error(ERROR, abortable);
                    },
                    noop as any,
                  ),
              );
            });

            test('invalid', async () => {
              await expectInvalid(
                successfulTask
                  .then(
                    (): AsyncTask<number> => {
                      const task = AsyncTask.error(ERROR, Abortable.timeout(10));
                      task.errored(noop);
                      return task;
                    },
                    noop as any,
                  ),
              );
            });
          });
        });

        describe('onError', () => {
          const erroredTask = AsyncTask.error(ERROR, Abortable.never);
          erroredTask.errored(noop);

          test('throw', async () => {
            await expectError(
              erroredTask
                .then(
                  noop as any,
                  (): number => {
                    throw ERROR;
                  },
                ),
            );
          });

          test('value', async () => {
            await expectSuccess(
              erroredTask
                .then(
                  noop as any,
                  (): number => {
                    return VALUE;
                  },
                ),
            );
          });

          describe('Promise', () => {
            test('.resolve', async () => {
              await expectSuccess(
                erroredTask
                  .then(
                    noop as any,
                    (): Promise<number> => {
                      return Promise.resolve(VALUE);
                    },
                  ),
              );
            });

            test('.reject', async () => {
              await expectError(
                erroredTask
                  .then(
                    noop as any,
                    (): Promise<number> => {
                      return Promise.reject(ERROR);
                    },
                  ),
              );
            });
          });

          describe('AsyncTask', () => {
            test('.success', async () => {
              await expectSuccess(
                erroredTask
                  .then(
                    noop as any,
                    (_, abortable: Abortable): AsyncTask<number> => {
                      return AsyncTask.success(VALUE, abortable);
                    },
                  ),
              );
            });

            test('.error', async () => {
              await expectError(
                erroredTask
                  .then(
                    noop as any,
                    (_, abortable: Abortable): AsyncTask<number> => {
                      return AsyncTask.error(ERROR, abortable);
                    },
                  ),
              );
            });

            test('invalid', async () => {
              await expectInvalid(
                erroredTask
                  .then(
                    noop as any,
                    (): AsyncTask<number> => {
                      const task = AsyncTask.error(ERROR, Abortable.timeout(10));
                      task.errored(noop);
                      return task;
                    },
                  ),
              );
            });
          });
        });
      });
    });

    describe('successful', () => {
      test.todo('successful');
    });

    describe('errored', () => {
      test.todo('errored');
    });

    describe('finally', () => {
      test.todo('finally');
    });
  });

  describe('static methods', () => {
    test.todo('fromFactory');

    describe('all', () => {
      describe('all successful', () => {
        test('result', async () => {
          const result = await AsyncTask.all([
            () => 1,
            () => Promise.resolve(true),
            (abortable: Abortable) => AsyncTask.success('a', abortable),
          ], Abortable.never)
            .toPromise();

          expect(result.length).toBe(3);
          expect(result[0]).toBe(1);
          expect(result[1]).toBe(true);
          expect(result[2]).toBe('a');
        });

        test('abortable', async () => {
          const abortables: Abortable[] = [];

          const task = AsyncTask.all([
            (abortable: Abortable) => {
              abortables.push(abortable);
            },
            (abortable: Abortable) => {
              abortables.push(abortable);
            },
          ], Abortable.never);

          expect(abortables[0].aborted).toBe(false);
          expect(abortables[1].aborted).toBe(false);

          await task.toPromise();

          expect(abortables[0].aborted).toBe(true);
          expect(abortables[1].aborted).toBe(true);
        });

        test('aborted', async () => {
          const abortables: Abortable[] = [];

          await expectAborted(
            AsyncTask.all([
              (abortable: Abortable) => {
                expect(abortable.aborted).toBe(false);
                abortables.push(abortable);
                return asyncTimeout(100, abortable);
              },
              (abortable: Abortable) => {
                expect(abortable.aborted).toBe(false);
                abortables.push(abortable);
                return asyncTimeout(100, abortable);
              },
            ], Abortable.timeout(10)),
          );

          expect(abortables[0].aborted).toBe(true);
          expect(abortables[1].aborted).toBe(true);
        });
      });

      describe('one or more errored', () => {
        test('result', async () => {
          await expectError(
            AsyncTask.all([
              () => 1,
              () => Promise.reject(ERROR),
              (abortable: Abortable) => AsyncTask.success('a', abortable),
            ], Abortable.never),
          );
        });

        test('abortable', async () => {
          const abortables: Abortable[] = [];

          const task = AsyncTask.all([
            (abortable: Abortable) => {
              abortables.push(abortable);
              throw ERROR;
            },
            (abortable: Abortable) => {
              abortables.push(abortable);
            },
          ], Abortable.never);

          expect(abortables[0].aborted).toBe(false);
          expect(abortables[1].aborted).toBe(false);

          await expectError(task);

          expect(abortables[0].aborted).toBe(true);
          expect(abortables[1].aborted).toBe(true);
        });
      });

    });

    describe('race', () => {
      describe('one or more successful', () => {
        test('result', async () => {
          const result = await AsyncTask.race([
            (abortable: Abortable) => asyncTimeout(100, abortable).successful(() => 1),
            (abortable: Abortable) => asyncTimeout(200, abortable).successful(() => 2),
          ], Abortable.never)
            .toPromise();

          expect(result).toBe(1);
        });

        test('abortable', async () => {
          const abortables: Abortable[] = [];

          const task = AsyncTask.race([
            (abortable: Abortable) => {
              abortables.push(abortable);
              return asyncTimeout(100, abortable);
            },
            (abortable: Abortable) => {
              abortables.push(abortable);
              return asyncTimeout(200, abortable);
            },
          ], Abortable.never);

          expect(abortables[0].aborted).toBe(false);
          expect(abortables[1].aborted).toBe(false);

          await task.toPromise();

          expect(abortables[0].aborted).toBe(true);
          expect(abortables[1].aborted).toBe(true);
        });

        test('aborted', async () => {
          const abortables: Abortable[] = [];

          await expectAborted(
            AsyncTask.all([
              (abortable: Abortable) => {
                expect(abortable.aborted).toBe(false);
                abortables.push(abortable);
                return asyncTimeout(100, abortable);
              },
              (abortable: Abortable) => {
                expect(abortable.aborted).toBe(false);
                abortables.push(abortable);
                return asyncTimeout(200, abortable);
              },
            ], Abortable.timeout(10)),
          );

          expect(abortables[0].aborted).toBe(true);
          expect(abortables[1].aborted).toBe(true);
        });
      });

      // describe('one or more errored', () => {
      //   test('result', async () => {
      //     await expectError(
      //       AsyncTask.all([
      //         () => 1,
      //         () => Promise.reject(ERROR),
      //         (abortable: Abortable) => AsyncTask.success('a', abortable),
      //       ], Abortable.never)
      //     );
      //   });
      //
      //   test('abortable', async () => {
      //     const abortables: Abortable[] = [];
      //
      //     const task = AsyncTask.all([
      //       (abortable: Abortable) => {
      //         abortables.push(abortable);
      //         throw ERROR;
      //       },
      //       (abortable: Abortable) => {
      //         abortables.push(abortable);
      //       },
      //     ], Abortable.never);
      //
      //     expect(abortables[0].aborted).toBe(false);
      //     expect(abortables[1].aborted).toBe(false);
      //
      //     await expectError(task);
      //
      //     expect(abortables[0].aborted).toBe(true);
      //     expect(abortables[1].aborted).toBe(true);
      //   });
      // });

    });

    test.todo('allSettled');

    describe('switchAbortable', () => {
      describe('AsyncTask.never', () => {
        describe('Abortable.never (first)', () => {
          test('Abortable.never (second)', async () => {
            const abortable = new Abortable(() => {
            });

            const task = AsyncTask.switchAbortable(
              AsyncTask.success(VALUE, Abortable.never),
              abortable,
            );

            expect(task.abortable).toBe(abortable);

            await expectSuccess(task);
          });

          test('Abortable.abort (second)', async () => {
            await expectAborted(
              AsyncTask.switchAbortable(
                AsyncTask.success(VALUE, Abortable.never),
                Abortable.abort('abort'),
              ),
            );
          });
        });

        describe('Abortable.abort (first)', () => {
          test('Abortable.never (second)', async () => {
            const error = new Error('abort');
            await expectError(
              AsyncTask.switchAbortable(
                AsyncTask.never(Abortable.abort(error)),
                Abortable.never,
              ),
              error,
            );
          });

          describe('Abortable.abort (second)', () => {
            test('first immediate, second immediate', async () => {
              await expectAborted(
                AsyncTask.switchAbortable(
                  AsyncTask.never(Abortable.abort('a')),
                  Abortable.abort('b'),
                ),
              );
            });

            test('first 200, second 100', async () => {
              await expectAborted(
                AsyncTask.switchAbortable(
                  AsyncTask.never(Abortable.timeout(200)),
                  Abortable.timeout(100),
                ),
              );
            });

            test('first 100, second 200', async () => {
              await expectError(
                AsyncTask.switchAbortable(
                  AsyncTask.never(Abortable.timeout(100)),
                  Abortable.timeout(200),
                ),
                'Timeout',
              );
            });
          });

        });
      });

    });
  });

});
