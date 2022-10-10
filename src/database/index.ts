import { get, set } from './localStorage';
import type { Chart, Data, CallbackFunction } from './types'
import { v4 as uuid } from 'uuid'

const KEY = 'entire-life'
const SAVE_SUCCESS = 'DatabaseSaveSuccessEvent';
const SAVE_FAIL = 'DatabaseSaveFailEvent';

class Database {
  initialState: undefined | Data

  constructor(initialState: undefined | Data) {
    this.initialState = initialState;
  }

  fetchData() {
    return get(KEY) ?? this.initialState ?? ({} as Data);
  }

  setData(newData: Data) {
    try {
      set(KEY, newData);
      window.dispatchEvent(new CustomEvent(SAVE_SUCCESS));
    } catch (err) {
      window.dispatchEvent(new CustomEvent(SAVE_FAIL));
    }
  }

  addChart(chart: Omit<Chart, 'id'>) {
    const data = this.fetchData()
    const id = uuid()

    this.setData({
      ...data,
      charts: {
        ...data.charts,
        [id]: { id, ...chart }
      },
      chartIds: [
        ...(data.chartIds ?? []),
        id
      ]
    })
  }

  addSaveSuccessListener(fn: CallbackFunction) {
    window.addEventListener(SAVE_SUCCESS, fn, false);
  }

  removeSaveSuccessListener(fn: CallbackFunction) {
    window.removeEventListener(SAVE_SUCCESS, fn, false);
  }

  addSaveFailureListener(fn: CallbackFunction) {
    window.addEventListener(SAVE_FAIL, fn, false);
  }

  removeSaveFailureListener(fn: CallbackFunction) {
    window.removeEventListener(SAVE_FAIL, fn, false);
  }
}

export function init({ initialState }: { initialState?: Data } = {}) {
  return new Database(initialState)
}

export const db = init()