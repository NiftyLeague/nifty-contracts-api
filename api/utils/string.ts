export function validateString<T extends string>(val: string, validValues: readonly string[]): T {
  const res = validValues.indexOf(val);
  if (res < 0) {
    throw Error(`${val} is not one of ${validValues}`);
  }
  return val as T;
}
