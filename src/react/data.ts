import store from 'localforage'

export interface Entry {
  title: string
  date: string /// iso8601 ie 1990-01-01
  body?: string
  emoji?: string
}

interface RecentDeletion {
  ledger: string
  entry: Entry
  entryId: number
}

type RecentlyDeleted = RecentDeletion[]

const RECENTLY_DELETED = 'recently-deleted'

const reservedKeys = [
  RECENTLY_DELETED,
]

/**
 * Get the value for a given key in the data store.
 * 
 * Most keys in storage correspond to a Ledger, and return simple lists of Entries.
 * 
 * Keys in {@constant reservedKeys} have different return types, which are specified in type overloads.
 */
export async function get(key: typeof RECENTLY_DELETED): Promise<RecentlyDeleted>;
export async function get(key: string): Promise<undefined | Entry[]>;
export async function get(key: string): Promise<undefined | Entry[] | RecentlyDeleted> {
  if (key === RECENTLY_DELETED) {
    return await store.getItem(key) ?? []
  }
  return await store.getItem(key) as Entry[]
}

/**
 * Get list of all current Ledgers
 */
export async function getLedgers(): Promise<string[]> {
  return (await store.keys()).filter(k => !reservedKeys.includes(k))
}

export async function addLedger({ name, dob }: { name: string, dob: string /* iso8601 */ }) {
  const normalized = name.trim()

  if (await get(normalized)) {
    throw new Error(`You already have a chart for ${normalized}; please name this one something unique.`)
  }

  if (reservedKeys.includes(normalized)) {
    throw new Error(`The name "${normalized}" is reserved for internal use; please pick something else.`)
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

/**
 * Update an entry in a ledger, given its index in the ledger.
 * 
 * In an attempt to make entries understandable when viewed in Google Sheets, they have no unique IDs. The index-based ID system is brittle, and can break in unexpected ways! This function tries to be careful, throwing errors if the entry can no longer be found, and keeping a backup around for a minute to enable easy undos.
 */
export async function updateEntry(toLedger: string, entryId: number, newEntry: Entry) {
  const ledger = await get(toLedger)
  if (!ledger) {
    throw new Error(`No ledger named "${toLedger}"!`)
  }

  const oldEntry = ledger[entryId]
  if (!oldEntry) {
    throw new Error(`Cannot find existing entry #${entryId}! Someone else may have edited or deleted it while you had this page open. Refresh the page and try again (you may want to copy your work-in-progress).`)
  }

  await store.setItem(RECENTLY_DELETED, [
    ...await get(RECENTLY_DELETED),
    {
      ledger: toLedger,
      entry: oldEntry,
      entryId,
    }
  ])

  // clear recent deletion after one minute
  setTimeout(clearOldestRecentDeletion, 60000)

  store.setItem(toLedger, ledger.map(
    (entry, i) => i === entryId ? newEntry : entry
  ))
}

async function clearOldestRecentDeletion() {
  const current = await get(RECENTLY_DELETED)

  if (current.length === 1) {
    await store.removeItem(RECENTLY_DELETED)
  } else {
    await store.setItem(RECENTLY_DELETED, current.slice(1))
  }
}

/**
 * Delete an entry in a ledger, given its index in the ledger.
 * 
 * In an attempt to make entries understandable when viewed in Google Sheets, they have no unique IDs. The index-based ID system is brittle, and can break in unexpected ways! This function tries to be careful, throwing errors if the entry can no longer be found, and keeping a backup around for a minute to enable easy undos.
 */
export async function deleteEntry(toLedger: string, entryId: number) {
  const ledger = await get(toLedger)
  if (!ledger) {
    throw new Error(`No ledger named "${toLedger}"!`)
  }

  const oldEntry = ledger[entryId]
  if (!oldEntry) {
    throw new Error(`Cannot find existing entry #${entryId}! Someone else may have edited or deleted it while you had this page open. Refresh the page and try again.`)
  }

  await store.setItem(RECENTLY_DELETED, [
    ...await get(RECENTLY_DELETED),
    {
      ledger: toLedger,
      entry: oldEntry,
      entryId,
    }
  ])

  // clear recent deletion after one minute
  setTimeout(clearOldestRecentDeletion, 60000)

  store.setItem(toLedger, ledger.filter(
    (_, i) => i !== entryId
  ))
}