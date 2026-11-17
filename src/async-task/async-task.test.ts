import { Abortable } from '../abortable/abortable.class';
import { AbortError } from '../errors/abort-error.class';
import { noop } from '../helpers/noop.private';
import { AsyncTask } from './async-task.class';
import { asyncTimeout } from './built-in/async-timeout';
import { IAsyncTaskConstraint } from './types/async-task-constraint.type';
import { IAsyncTaskRejectFunction } from './types/init/async-task-reject-function.type';
import { IAsyncTaskResolveFunction } from './types/init/async-task-resolve-function.type';
import { IAsyncTaskErrorState } from './types/state/async-task-error-state.type';
import { IAsyncTaskSettledState } from './types/state/async-task-settled-state.type.';
import { IAsyncTaskSuccessState } from './types/state/async-task-success-state.type';

describe('AsyncTask', () => {
  const sleep = (t: number) => {
    return new Promise((_) => setTimeout(_, t));
  };

  /** INIT **/

  const ABORTED_MESSAGE = 'Aborted';

  const VALUE = 2;

  async function expectSuccess(task: AsyncTask<number>): Promise<void>;
  async function expectSuccess<GValue extends IAsyncTaskConstraint<GValue>>(
    task: AsyncTask<GValue>,
    value: GValue,
  ): Promise<void>;
  async function expectSuccess(task: AsyncTask<any>, ...value: any[]): Promise<void> {
    return expect(await task.toPromise()).toBe(value.length === 0 ? VALUE : value[0]);
  }

  const ERROR = new Error('Error');

  const expectError = async (task: AsyncTask<any>, error: any = ERROR) => {
    await expect(async () => {
      await task.toPromise();
    }).rejects.toThrow(error);
  };

  const expectTypedError = async (task: AsyncTask<any>, errorType: any) => {
    await expect(
      task.toPromise().then(
        (): void => {
          throw new Error('Should have errored');
        },
        (error: unknown): 'OK' => {
          if (error instanceof errorType) {
            return 'OK';
          } else {
            throw error;
          }
        },
      ),
    ).resolves.toBe('OK');
  };

  const expectAborted = async (task: AsyncTask<any>) => {
    await expect(async () => {
      await task.toPromise();
    }).rejects.toThrow(ABORTED_MESSAGE);
  };

  const expectInvalid = async (task: AsyncTask<any>) => {
    await expect(async () => {
      await task.toPromise();
    }).rejects.toThrow();
  };

  /** TESTS **/

  describe('new', () => {
    test('init function called', async () => {
      const init = jest.fn();
      new AsyncTask<any>(init, Abortable.never);
      expect(init).toHaveBeenCalled();
    });

    test('init function params', async () => {
      const _abortable = Abortable.never;

      new AsyncTask<any>(
        (
          resolve: IAsyncTaskResolveFunction<any>,
          reject: IAsyncTaskRejectFunction,
          abortable: Abortable,
        ): void => {
          expect(typeof resolve).toBe('function');
          expect(typeof reject).toBe('function');
          expect(abortable).toBeInstanceOf(Abortable);
          expect(abortable).toBe(_abortable);
        },
        _abortable,
      );
    });

    test('throw', async () => {
      await expectError(
        new AsyncTask<number>((): void => {
          throw ERROR;
        }, Abortable.never),
      );
    });

    describe('resolve(...)', () => {
      test('immediate', async () => {
        await expectSuccess(
          new AsyncTask<number>((resolve: IAsyncTaskResolveFunction<any>): void => {
            resolve(VALUE);
          }, Abortable.never),
        );
      });

      test('timeout', async () => {
        await expectSuccess(
          new AsyncTask<number>((resolve: IAsyncTaskResolveFunction<any>): void => {
            setTimeout(() => {
              resolve(VALUE);
            }, 100);
          }, Abortable.never),
        );
      });

      describe('Promise', () => {
        test('.resolve', async () => {
          await expectSuccess(
            new AsyncTask<number>((resolve: IAsyncTaskResolveFunction<any>): void => {
              resolve(Promise.resolve(VALUE));
            }, Abortable.never),
          );
        });

        test('.reject', async () => {
          await expectError(
            new AsyncTask<number>((resolve: IAsyncTaskResolveFunction<any>): void => {
              resolve(Promise.reject(ERROR));
            }, Abortable.never),
          );
        });
      });

      describe('AsyncTask', () => {
        describe('same abortable', () => {
          test('.resolve', async () => {
            await expectSuccess(
              new AsyncTask<number>(
                (
                  resolve: IAsyncTaskResolveFunction<any>,
                  reject: IAsyncTaskRejectFunction,
                  abortable: Abortable,
                ): void => {
                  resolve(AsyncTask.resolve(VALUE, abortable));
                },
                Abortable.never,
              ),
            );
          });

          test('.reject', async () => {
            await expectError(
              new AsyncTask<number>(
                (
                  resolve: IAsyncTaskResolveFunction<any>,
                  reject: IAsyncTaskRejectFunction,
                  abortable: Abortable,
                ): void => {
                  resolve(AsyncTask.reject(ERROR, abortable));
                },
                Abortable.never,
              ),
            );
          });
        });

        describe('different abortable', () => {
          test('immediate', async () => {
            await expectInvalid(
              new AsyncTask<number>((resolve: IAsyncTaskResolveFunction<any>): void => {
                resolve(AsyncTask.resolve(VALUE, Abortable.timeout(10)));
              }, Abortable.never),
            );
          });

          test('timeout', async () => {
            await expectInvalid(
              new AsyncTask<number>((resolve: IAsyncTaskResolveFunction<any>): void => {
                resolve(
                  new AsyncTask<number>((resolve: IAsyncTaskResolveFunction<any>): void => {
                    setTimeout(() => {
                      resolve(VALUE);
                    }, 100);
                  }, Abortable.timeout(10)),
                );
              }, Abortable.never),
            );
          });
        });
      });
    });

    describe('reject(...)', () => {
      test('immediate', async () => {
        await expectError(
          new AsyncTask<number>(
            (resolve: IAsyncTaskResolveFunction<any>, reject: IAsyncTaskRejectFunction): void => {
              reject(ERROR);
            },
            Abortable.never,
          ),
        );
      });

      test('timeout', async () => {
        await expectError(
          new AsyncTask<number>(
            (resolve: IAsyncTaskResolveFunction<any>, reject: IAsyncTaskRejectFunction): void => {
              setTimeout(() => {
                reject(ERROR);
              }, 100);
            },
            Abortable.never,
          ),
        );
      });
    });

    describe('abort', () => {
      test('immediate', async () => {
        await expectAborted(
          new AsyncTask<number>((resolve: IAsyncTaskResolveFunction<any>): void => {
            resolve(1);
          }, Abortable.abort('aborted')),
        );
      });

      test('timeout', async () => {
        await expectAborted(new AsyncTask<number>(noop, Abortable.timeout(100)));
      });
    });
  });

  describe('create', () => {
    test('resolve', async () => {
      await expectSuccess(AsyncTask.resolve(VALUE, Abortable.never));
    });

    test('reject', async () => {
      await expectError(AsyncTask.reject(ERROR, Abortable.never));
    });

    test('void', async () => {
      await expectSuccess(AsyncTask.void(Abortable.never), undefined);
    });

    describe('withResolvers', () => {
      test('resolve', async () => {
        const { task, resolve } = AsyncTask.withResolvers<number>(Abortable.never);
        resolve(VALUE);
        await expectSuccess(task);
      });

      test('reject', async () => {
        const { task, reject } = AsyncTask.withResolvers<number>(Abortable.never);
        reject(ERROR);
        await expectError(task);
      });
    });
  });

  describe('methods', () => {
    describe('toPromise', () => {
      test('resolve', async () => {
        expect(await AsyncTask.resolve(VALUE, Abortable.never).toPromise()).toBe(VALUE);
      });

      test('reject', async () => {
        await expect(async () => {
          await AsyncTask.reject(ERROR, Abortable.never).toPromise();
        }).rejects.toThrow(ERROR);
      });

      test('abort', async () => {
        await expect(async () => {
          await AsyncTask.resolve(undefined, Abortable.abort('aborted')).toPromise();
        }).rejects.toThrow(ABORTED_MESSAGE);

        await expect(async () => {
          await AsyncTask.never(Abortable.timeout(10)).toPromise();
        }).rejects.toThrow(ABORTED_MESSAGE);
      });
    });

    describe('settled', () => {
      describe('onSettled function properly called', () => {
        test('resolve', async () => {
          const spy = jest.fn();
          const task = AsyncTask.resolve(undefined, Abortable.never).settled(spy);
          expect(spy).not.toHaveBeenCalled();

          await task.toPromise();
          expect(spy).toHaveBeenCalledTimes(1);
        });

        test('reject', async () => {
          const spy = jest.fn();
          const task = AsyncTask.reject(ERROR, Abortable.never).settled(spy);
          expect(spy).not.toHaveBeenCalled();

          await task.toPromise();
          expect(spy).toHaveBeenCalledTimes(1);
        });

        test('abort', async () => {
          const abortable = Abortable.abort('abort');
          expect(abortable.aborted).toBe(true);

          const spy = jest.fn();
          const task = AsyncTask.resolve(undefined, abortable).settled(spy);
          expect(spy).not.toHaveBeenCalled();
          expect(task.abortable).toBe(abortable);

          await expectAborted(task);
          expect(spy).not.toHaveBeenCalled();
        });
      });

      describe('correct value received', () => {
        test('resolve', async () => {
          await AsyncTask.resolve(VALUE, Abortable.never)
            .settled((state: IAsyncTaskSettledState<number>): void => {
              expect(state.state).toBe('success');
              expect((state as IAsyncTaskSuccessState<number>).value).toBe(VALUE);
            })
            .toPromise();
        });

        test('reject', async () => {
          await AsyncTask.reject(ERROR, Abortable.never)
            .settled((state: IAsyncTaskSettledState<number>): void => {
              expect(state.state).toBe('error');
              expect((state as IAsyncTaskErrorState).reason).toBe(ERROR);
            })
            .toPromise();
        });
      });

      describe('correct value returned', () => {
        describe('success', () => {
          const successfulTask = AsyncTask.void(Abortable.never);

          test('throw', async () => {
            await expectError(
              successfulTask.settled((): number => {
                throw ERROR;
              }),
            );
          });

          test('value', async () => {
            await expectSuccess(
              successfulTask.settled((): number => {
                return VALUE;
              }),
            );
          });

          describe('Promise', () => {
            test('.resolve', async () => {
              await expectSuccess(
                successfulTask.settled((): Promise<number> => {
                  return Promise.resolve(VALUE);
                }),
              );
            });

            test('.reject', async () => {
              await expectError(
                successfulTask.settled((): Promise<number> => {
                  return Promise.reject(ERROR);
                }),
              );
            });
          });

          describe('AsyncTask', () => {
            test('.resolve', async () => {
              await expectSuccess(
                successfulTask.settled((_, abortable: Abortable): AsyncTask<number> => {
                  return AsyncTask.resolve(VALUE, abortable);
                }),
              );
            });

            test('.reject', async () => {
              await expectError(
                successfulTask.settled((_, abortable: Abortable): AsyncTask<number> => {
                  return AsyncTask.reject(ERROR, abortable);
                }),
              );
            });

            test('different abortable', async () => {
              await expectInvalid(
                successfulTask.settled((): AsyncTask<number> => {
                  return AsyncTask.resolve(VALUE, Abortable.abort(new AbortError()));
                }),
              );
            });
          });
        });

        describe('error', () => {
          const erroredTask = AsyncTask.reject(ERROR, Abortable.never);
          erroredTask.catch(noop);

          test('throw', async () => {
            await expectError(
              erroredTask.settled((): number => {
                throw ERROR;
              }),
            );
          });

          test('value', async () => {
            await expectSuccess(
              erroredTask.settled((): number => {
                return VALUE;
              }),
            );
          });

          describe('Promise', () => {
            test('.resolve', async () => {
              await expectSuccess(
                erroredTask.settled((): Promise<number> => {
                  return Promise.resolve(VALUE);
                }),
              );
            });

            test('.reject', async () => {
              await expectError(
                erroredTask.settled((): Promise<number> => {
                  return Promise.reject(ERROR);
                }),
              );
            });
          });

          describe('AsyncTask', () => {
            test('.resolve', async () => {
              await expectSuccess(
                erroredTask.settled((_, abortable: Abortable): AsyncTask<number> => {
                  return AsyncTask.resolve(VALUE, abortable);
                }),
              );
            });

            test('.reject', async () => {
              await expectError(
                erroredTask.settled((_, abortable: Abortable): AsyncTask<number> => {
                  return AsyncTask.reject(ERROR, abortable);
                }),
              );
            });

            test('different abortable', async () => {
              await expectInvalid(
                erroredTask.settled((): AsyncTask<number> => {
                  return AsyncTask.resolve(VALUE, Abortable.abort(new AbortError()));
                }),
              );
            });
          });
        });
      });
    });

    describe('then', () => {
      describe('onSuccess and onError functions properly called', () => {
        test('resolve', async () => {
          const spy1 = jest.fn();
          const spy2 = jest.fn();
          const task = AsyncTask.resolve(undefined, Abortable.never).then(spy1, spy2);
          expect(spy1).not.toHaveBeenCalled();
          expect(spy2).not.toHaveBeenCalled();

          await task.toPromise();
          expect(spy1).toHaveBeenCalledTimes(1);
          expect(spy2).not.toHaveBeenCalled();
        });

        test('reject', async () => {
          const spy1 = jest.fn();
          const spy2 = jest.fn();
          const task = AsyncTask.reject(ERROR, Abortable.never).then(spy1, spy2);
          expect(spy1).not.toHaveBeenCalled();
          expect(spy2).not.toHaveBeenCalled();

          await task.toPromise();
          expect(spy1).not.toHaveBeenCalled();
          expect(spy2).toHaveBeenCalledTimes(1);
        });

        test('abort', async () => {
          const abortable = Abortable.abort('abort');
          expect(abortable.aborted).toBe(true);

          const spy1 = jest.fn();
          const spy2 = jest.fn();
          const task = AsyncTask.resolve(undefined, abortable).then(spy1, spy2);
          expect(spy1).not.toHaveBeenCalled();
          expect(spy2).not.toHaveBeenCalled();
          expect(task.abortable).toBe(abortable);

          await expectAborted(task);
          expect(spy1).not.toHaveBeenCalled();
          expect(spy2).not.toHaveBeenCalled();
        });
      });

      describe('correct value received', () => {
        test('onSuccessful', async () => {
          await AsyncTask.resolve(VALUE, Abortable.never)
            .then((value: number): void => {
              expect(value).toBe(VALUE);
            }, noop)
            .toPromise();
        });

        test('onError', async () => {
          await AsyncTask.reject(ERROR, Abortable.never)
            .then(noop, (error: any): void => {
              expect(error).toBe(ERROR);
            })
            .toPromise();
        });
      });

      describe('correct value returned', () => {
        describe('onSuccessful', () => {
          const successfulTask = AsyncTask.void(Abortable.never);

          test('throw', async () => {
            await expectError(
              successfulTask.then((): number => {
                throw ERROR;
              }, noop as any),
            );
          });

          test('value', async () => {
            await expectSuccess(
              successfulTask.then((): number => {
                return VALUE;
              }, noop as any),
            );
          });

          describe('Promise', () => {
            test('.resolve', async () => {
              await expectSuccess(
                successfulTask.then((): Promise<number> => {
                  return Promise.resolve(VALUE);
                }, noop as any),
              );
            });

            test('.reject', async () => {
              await expectError(
                successfulTask.then((): Promise<number> => {
                  return Promise.reject(ERROR);
                }, noop as any),
              );
            });
          });

          describe('AsyncTask', () => {
            test('.resolve', async () => {
              await expectSuccess(
                successfulTask.then((_, abortable: Abortable): AsyncTask<number> => {
                  return AsyncTask.resolve(VALUE, abortable);
                }, noop as any),
              );
            });

            test('.reject', async () => {
              await expectError(
                successfulTask.then((_, abortable: Abortable): AsyncTask<number> => {
                  return AsyncTask.reject(ERROR, abortable);
                }, noop as any),
              );
            });

            test('different abortable', async () => {
              await expectInvalid(
                successfulTask.then((): AsyncTask<number> => {
                  return AsyncTask.resolve(VALUE, Abortable.abort(new AbortError()));
                }, noop as any),
              );
            });
          });
        });

        describe('onError', () => {
          const erroredTask = AsyncTask.reject(ERROR, Abortable.never);
          erroredTask.catch(noop);

          test('throw', async () => {
            await expectError(
              erroredTask.then(noop as any, (): number => {
                throw ERROR;
              }),
            );
          });

          test('value', async () => {
            await expectSuccess(
              erroredTask.then(noop as any, (): number => {
                return VALUE;
              }),
            );
          });

          describe('Promise', () => {
            test('.resolve', async () => {
              await expectSuccess(
                erroredTask.then(noop as any, (): Promise<number> => {
                  return Promise.resolve(VALUE);
                }),
              );
            });

            test('.reject', async () => {
              await expectError(
                erroredTask.then(noop as any, (): Promise<number> => {
                  return Promise.reject(ERROR);
                }),
              );
            });
          });

          describe('AsyncTask', () => {
            test('.resolve', async () => {
              await expectSuccess(
                erroredTask.then(noop as any, (_, abortable: Abortable): AsyncTask<number> => {
                  return AsyncTask.resolve(VALUE, abortable);
                }),
              );
            });

            test('.reject', async () => {
              await expectError(
                erroredTask.then(noop as any, (_, abortable: Abortable): AsyncTask<number> => {
                  return AsyncTask.reject(ERROR, abortable);
                }),
              );
            });

            test('different abortable', async () => {
              await expectInvalid(
                erroredTask.then(noop as any, (): AsyncTask<number> => {
                  return AsyncTask.resolve(VALUE, Abortable.abort(new AbortError()));
                }),
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

    describe('switchAbortable', () => {
      describe('AsyncTask.never', () => {
        describe('Abortable.never (first)', () => {
          test('Abortable.never (second)', async () => {
            const abortable = new Abortable(() => {});

            const task = AsyncTask.resolve(VALUE, Abortable.never).switchAbortable(abortable);

            expect(task.abortable).toBe(abortable);

            await expectSuccess(task);
          });

          test('Abortable.abort (second)', async () => {
            await expectAborted(
              AsyncTask.resolve(VALUE, Abortable.never).switchAbortable(Abortable.abort('abort')),
            );
          });
        });

        describe('Abortable.abort (first)', () => {
          test('Abortable.never (second)', async () => {
            const error = new Error('abort');
            await expectError(
              AsyncTask.never(Abortable.abort(error)).switchAbortable(Abortable.never),
              error,
            );
          });

          describe('Abortable.abort (second)', () => {
            test('first immediate, second immediate', async () => {
              await expectAborted(
                AsyncTask.never(Abortable.abort('a')).switchAbortable(Abortable.abort('b')),
              );
            });

            test('first 200, second 100', async () => {
              await expectAborted(
                AsyncTask.never(Abortable.timeout(200)).switchAbortable(Abortable.timeout(100)),
              );
            });

            test('first 100, second 200', async () => {
              await expectError(
                AsyncTask.never(Abortable.timeout(100)).switchAbortable(Abortable.timeout(200)),
                '',
              );
            });
          });
        });
      });
    });
  });

  describe('static methods', () => {
    test.todo('fromFactory');

    describe('all', () => {
      describe('all successful', () => {
        test('result', async () => {
          const result = await AsyncTask.all(
            [
              () => 1,
              () => Promise.resolve(true),
              (abortable: Abortable) => AsyncTask.resolve('a', abortable),
            ],
            Abortable.never,
          ).toPromise();

          expect(result.length).toBe(3);
          expect(result[0]).toBe(1);
          expect(result[1]).toBe(true);
          expect(result[2]).toBe('a');
        });

        test('abortable', async () => {
          const abortables: Abortable[] = [];

          const task = AsyncTask.all(
            [
              (abortable: Abortable) => {
                abortables.push(abortable);
              },
              (abortable: Abortable) => {
                abortables.push(abortable);
              },
            ],
            Abortable.never,
          );

          expect(abortables[0].aborted).toBe(false);
          expect(abortables[1].aborted).toBe(false);

          await task.toPromise();

          expect(abortables[0].aborted).toBe(true);
          expect(abortables[1].aborted).toBe(true);
        });

        test('aborted', async () => {
          const abortables: Abortable[] = [];

          await expectAborted(
            AsyncTask.all(
              [
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
              ],
              Abortable.timeout(10),
            ),
          );

          expect(abortables[0].aborted).toBe(true);
          expect(abortables[1].aborted).toBe(true);
        });
      });

      describe('one or more errored', () => {
        test('result', async () => {
          await expectError(
            AsyncTask.all(
              [
                () => 1,
                () => Promise.reject(ERROR),
                (abortable: Abortable) => AsyncTask.resolve('a', abortable),
              ],
              Abortable.never,
            ),
          );
        });

        test('abortable', async () => {
          const abortables: Abortable[] = [];

          const task = AsyncTask.all(
            [
              (abortable: Abortable) => {
                abortables.push(abortable);
                throw ERROR;
              },
              (abortable: Abortable) => {
                abortables.push(abortable);
              },
            ],
            Abortable.never,
          );

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
          const result = await AsyncTask.race(
            [
              (abortable: Abortable) => asyncTimeout(100, abortable).then(() => 1),
              (abortable: Abortable) => asyncTimeout(200, abortable).then(() => 2),
            ],
            Abortable.never,
          ).toPromise();

          expect(result).toBe(1);
        });

        test('abortable', async () => {
          const abortables: Abortable[] = [];

          const task = AsyncTask.race(
            [
              (abortable: Abortable) => {
                abortables.push(abortable);
                return asyncTimeout(100, abortable);
              },
              (abortable: Abortable) => {
                abortables.push(abortable);
                return asyncTimeout(200, abortable);
              },
            ],
            Abortable.never,
          );

          expect(abortables[0].aborted).toBe(false);
          expect(abortables[1].aborted).toBe(false);

          await task.toPromise();

          expect(abortables[0].aborted).toBe(true);
          expect(abortables[1].aborted).toBe(true);
        });

        test('aborted', async () => {
          const abortables: Abortable[] = [];

          await expectAborted(
            AsyncTask.all(
              [
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
              ],
              Abortable.timeout(10),
            ),
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
  });
});
