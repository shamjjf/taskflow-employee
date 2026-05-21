const isDev = process.env.NODE_ENV !== 'production';

export function devLog(...args: unknown[]): void {
  if (isDev) {
    console.log(...args);
  }
}
