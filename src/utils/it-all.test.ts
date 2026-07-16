import { describe, expect, it } from 'vitest';
import all from './it-all';

async function* asyncValues<T>(values: T[]): AsyncGenerator<T> {
  for (const value of values) yield value;
}

describe('all', () => {
  it('collects async values in order', async () => {
    await expect(all(asyncValues([1, 2, 3]))).resolves.toEqual([1, 2, 3]);
  });

  it('accepts empty and synchronous iterables', async () => {
    await expect(all(asyncValues([]))).resolves.toEqual([]);
    await expect(all(['one', 'two'])).resolves.toEqual(['one', 'two']);
  });

  it('preserves yielded object references', async () => {
    const value = { id: 1 };
    const result = await all(asyncValues([value]));
    expect(result[0]).toBe(value);
  });
});
