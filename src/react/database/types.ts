export interface Entry {
  title: string
  date: string /// iso8601 ie 1990-01-01
  description?: string
  emoji?: string
}

export interface Chart {
  name: string
  entries: Entry[]
}

export interface NewChart {
  name: string
  dob: string // iso8601
}

export interface Data {
  /**
   * key of Record must match associated Chart's `id` and be included in `chartIds`
   */
  charts: Record<string, Chart>
  chartIds: string[] // is there a way to statically analyze that these match the keys of `charts`?
}