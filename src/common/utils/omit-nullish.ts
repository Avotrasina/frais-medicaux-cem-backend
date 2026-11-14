/** Removes only null and undefined values; valid falsy values are preserved. */
export function omitNullish<T extends object>(
  obj: T,
): { [K in keyof T]?: NonNullable<T[K]> } {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value != null),
  ) as { [K in keyof T]?: NonNullable<T[K]> };
}
