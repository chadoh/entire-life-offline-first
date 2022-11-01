import store from 'localforage'

/**
 * User-facing Entry shown in UI
 */
export interface UserFacingEntry {
  title: string
  date: string // iso8601 ie 1990-12-31
  body?: string
  emoji?: string
}

/**
 * Entry as stored in local storage and in backend. `created` used as unique ID.
 */
export interface Entry extends UserFacingEntry {
  created: number // `Date.now()` timestamp
  updated: number // `Date.now()` timestamp
}

interface RecentDeletion {
  ledger: string
  entry: Entry
}

type RecentlyDeleted = RecentDeletion[]

const RECENTLY_DELETED = 'recently-deleted'
const GOOGLE_ACCESS_TOKEN = 'google-access-token'

const reservedKeys = [
  RECENTLY_DELETED,
  GOOGLE_ACCESS_TOKEN,
]

/**
 * Get the value for a given key in the data store.
 * 
 * Most keys in storage correspond to a Ledger, and return simple lists of Entries.
 * 
 * Keys in {@link reservedKeys} have different return types, which are specified in type overloads.
 */
export async function get(key: typeof RECENTLY_DELETED): Promise<RecentlyDeleted>;
export async function get(key: typeof GOOGLE_ACCESS_TOKEN): Promise<google.accounts.oauth2.TokenResponse | undefined>;
export async function get(key: string): Promise<undefined | Entry[]>;
export async function get(key: string): Promise<undefined | Entry[] | RecentlyDeleted | google.accounts.oauth2.TokenResponse> {
  if (key === RECENTLY_DELETED) {
    return await store.getItem(key) ?? []
  }
  if (key === GOOGLE_ACCESS_TOKEN) {
    return await store.getItem(key) ?? undefined
  }
  return await store.getItem(key) as Entry[]
}

/**
 * Save or delete access token provided by Google Identity Services
 * @param token access token provided by Google, or `undefined` to clear the token
 */
export async function setGoogleToken(token: google.accounts.oauth2.TokenResponse | undefined): Promise<void> {
  if (token) await store.setItem(GOOGLE_ACCESS_TOKEN, token)
  else await store.removeItem(GOOGLE_ACCESS_TOKEN)
}

/**
 * Get Google's access token
 */
export async function getGoogleToken(): Promise<undefined | google.accounts.oauth2.TokenResponse> {
  return await store.getItem(GOOGLE_ACCESS_TOKEN) ?? undefined
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

  const now = Date.now()
  await store.setItem(name, [{
    title: 'Hello World!',
    emoji: '🐣',
    date: dob,
    created: now,
    updated: now,
  }])
}

export async function updateLedger({ oldName, newName }: { oldName: string, newName: string }) {
  const normalized = newName.trim()

  // if hit "save" on unchanged form, return early without error
  if (oldName === newName) return


  if (await get(normalized)) {
    throw new Error(`You already have a chart for ${normalized}; please name this one something unique.`)
  }

  if (reservedKeys.includes(normalized)) {
    throw new Error(`The name "${normalized}" is reserved for internal use; please pick something else.`)
  }

  await store.setItem(newName, await get(oldName))
  await store.removeItem(oldName)
}

export async function removeLedger(name: string) {
  if (reservedKeys.includes(name)) {
    throw new Error(`The name "${name}" is reserved for internal use; please pick something else.`)
  }
  await store.removeItem(name)
}

export async function addEntry(toLedger: string, entry: UserFacingEntry) {
  const ledger = await get(toLedger)
  if (!ledger) {
    throw new Error(`No ledger named "${toLedger}"!`)
  }

  const now = Date.now()
  store.setItem(toLedger, [...ledger, {
    ...entry,
    created: now,
    updated: now,
  }])
}

/**
 * Update an entry in a ledger, using its `created` timestamp as its unique ID.
 */
export async function updateEntry(inLedger: string, entry: Entry) {
  const ledger = await get(inLedger)
  if (!ledger) {
    throw new Error(`No ledger named "${inLedger}"!`)
  }

  const oldEntry = ledger.find(e => e.created === entry.created)
  if (!oldEntry) {
    throw new Error(`Cannot find existing entry with created="${entry.created}"! Someone else may have deleted it while you had this page open. Refresh the page and try again (you may want to copy your work-in-progress).`)
  }

  await store.setItem(inLedger, ledger.map(
    e => e.created === entry.created
      ? { ...entry, updated: Date.now() }
      : e
  ))
}

/**
 * Delete an entry in a ledger, given its `created` date.
 * 
 * This function tries to be careful, throwing errors if the entry can no longer be found, and keeping a backup around for a minute to enable easy undos.
 */
export async function deleteEntry(toLedger: string, entryCreated: number) {
  const ledger = await get(toLedger)
  if (!ledger) {
    throw new Error(`No ledger named "${toLedger}"!`)
  }

  const oldEntry = ledger.find(e => e.created === entryCreated)
  if (!oldEntry) {
    throw new Error(`Cannot find existing entry with created="${entryCreated}"! Someone else may have deleted it while you had this page open. Refresh the page and try again.`)
  }

  await store.setItem(RECENTLY_DELETED, [
    ...await get(RECENTLY_DELETED),
    {
      ledger: toLedger,
      entry: oldEntry,
    }
  ])

  // clear recent deletion after one minute
  setTimeout(clearOldestRecentDeletion, 60000)

  store.setItem(toLedger, ledger.filter(
    e => e.created !== entryCreated
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