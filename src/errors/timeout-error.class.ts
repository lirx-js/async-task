export class TimeoutError extends Error {
  constructor(
    message?: string,
    options?: ErrorOptions,
  ) {
    super(
      message,
      options,
    );
    this.name = 'TimeoutError';
  }
}
