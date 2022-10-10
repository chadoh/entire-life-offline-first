import type { Data } from './types'

export const get = (key: string | number): undefined | Data => {
  try {
    const serializedState = localStorage.getItem(String(key));
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState) as Data;
  } catch (err) {
    return undefined;
  }
}

export const set = (key: string | number, state: Data): void => {
  const serializedState = JSON.stringify(state);
  localStorage.setItem(String(key), serializedState);
}
