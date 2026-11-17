export interface IAsyncTaskErrorState {
  readonly state: 'error';
  readonly reason: unknown;
}
