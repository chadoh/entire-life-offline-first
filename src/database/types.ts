export interface Chart {
  name: string
  dob: string // iso8601 ie 1990-01-01
}

export interface Data {
  /**
   * key of Record must match associated Chart's `id` and be included in `chartIds`
   */
  charts: Record<string, Chart>
  chartIds: string[] // is there a way to statically analyze that these match the keys of `charts`?
}