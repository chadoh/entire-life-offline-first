import { get, set } from './localStorage';
import type { Chart, Data } from './types'
import { v4 as uuid } from 'uuid'

export * from './types'
export * from './hooks'

const KEY = 'entire-life'
const SAVE_SUCCESS = 'EntireLifeDatabaseSaveSuccessEvent';
const SAVE_FAIL = 'EntireLifeDatabaseSaveFailEvent';

export class DataUpdatedEvent extends Event {
  data: Data
  constructor(data: Data) {
    super(SAVE_SUCCESS, { bubbles: true })
    this.data = data
  }
}

export class SaveFailureEvent extends Event {
  error: string
  constructor(error: string) {
    super(SAVE_FAIL, { bubbles: true })
    this.error = error
  }
}

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
      window.dispatchEvent(new DataUpdatedEvent(db.fetchData()))
    } catch (err: unknown) {
      window.dispatchEvent(new SaveFailureEvent(
        err instanceof Error ? err.message : String(err)
      ));
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

  addSaveSuccessListener(fn: (e: DataUpdatedEvent) => void) {
    // @ts-expect-error string-based listener doesn't know that event is guaranteed to be a DataUpdatedEvent
    window.addEventListener(SAVE_SUCCESS, fn, false)
  }

  removeSaveSuccessListener(fn: (e: any) => void) {
    window.removeEventListener(SAVE_SUCCESS, fn, false)
  }

  addSaveFailureListener(fn: (e: SaveFailureEvent) => void) {
    // @ts-expect-error string-based listener doesn't know that event is guaranteed to be a SaveFailureEvent
    window.addEventListener(SAVE_FAIL, fn, false)
  }

  removeSaveFailureListener(fn: (e: any) => void) {
    window.removeEventListener(SAVE_FAIL, fn, false)
  }
}

export function init({ initialState }: { initialState: Data }) {
  return new Database(initialState)
}

const emptyData: Data = {
  charts: {},
  chartIds: [],
}

export const db = init({ initialState: emptyData })