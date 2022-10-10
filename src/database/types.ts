export type CallbackFunction = () => void

export interface Chart {
  name: string
  dob: string // iso8601 ie 1990-01-01
}

export interface Data {
  charts: Chart[]
}