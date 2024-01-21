export function isPromise<GValue>(
  input: unknown,
): input is Promise<GValue> {
  return (input instanceof Promise) || (
    (typeof input === 'object')
    && (input !== null)
    && (typeof (input as any).then === 'function')
  )
}
