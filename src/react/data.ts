import store from 'localforage'

export interface Entry {
  title: string
  date: string /// iso8601 ie 1990-01-01
  body?: string
  emoji?: string
}

export async function getAll() {
  const keys = await store.keys()
  return keys.reduce(
    (allData, key) => { allData[key] = store.getItem(key); return allData },
    {} as Record<string, any>
  )
}

/**
 * For now, all keys in storage correspond to a Ledger, and return simple lists of Entries.
 * 
 * Some keys may be reserved in the future for settings, etc, but for now the only possibilities are `undefined` or `Entry[]`
 */
export async function get(key: string): Promise<undefined | Entry[]> {
  return await store.getItem(key) as Entry[]
}

/**
 * Get list of all current Ledgers
 */
export async function getLedgers(): Promise<string[]> {
  return store.keys()
}

export async function addLedger({ name, dob }: { name: string, dob: string /* iso8601 */ }) {
  const normalized = name.trim()

  if (await get(normalized)) {
    throw new Error(`You already have a chart for ${normalized}; please name this one something unique.`)
  }

  store.setItem(name, [{
    title: 'Hello World!',
    emoji: '🐣',
    date: dob,
  }])
}

export async function addEntry(toLedger: string, entry: Entry) {
  const ledger = await get(toLedger)
  if (!ledger) {
    throw new Error(`No ledger named "${toLedger}"!`)
  }

  store.setItem(toLedger, [...ledger, entry])
}