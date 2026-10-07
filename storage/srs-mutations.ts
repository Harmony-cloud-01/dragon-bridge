// Serialize read-modify-write operations across hook instances in this window.
// Rejections remain visible to the caller without preventing the next retry.
let pending: Promise<unknown> = Promise.resolve()
export function queueSrsMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation, operation)
  pending = result.catch(() => {})
  return result
}
