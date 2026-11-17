export interface IAsyncTaskAbortState {
  readonly state: 'abort';
  readonly reason: unknown;
}
