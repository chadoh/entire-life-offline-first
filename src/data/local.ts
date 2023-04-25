import store from 'localforage'

/**
 * Keys in user-facing Entry shown in UI
 */
const userFacingEntryKeys = [
  'date', // iso8601 ie 1990-12-31
  'emoji',
  'title',
  'body',
] as const

/**
 * Keys in data-focused, full Entry
 */
const dbEntryKeys = [
  'created',
  'updated',
] as const

export const entryKeys = [...userFacingEntryKeys, ...dbEntryKeys]

/**
 * User-facing Entry shown in UI
 */
export type UserFacingEntry = {
  [K in typeof userFacingEntryKeys[number]]: string
}

/**
 * Entry as stored in local storage and in backend. `created` used as unique ID.
 */
export type Entry = UserFacingEntry & {
  [K in typeof dbEntryKeys[number]]: number // `Date.now()` timestamp
}

interface RecentDeletion {
  ledger: string
  entry: Entry
  deletedAt: number // `Date.now()` timestamp
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
 * Get recently deleted entries for a ledger
 */
export async function getRecentlyDeleted(fromLedger: string): Promise<Entry[]> {
  return (await get(RECENTLY_DELETED))
    .filter(({ ledger }) => ledger === fromLedger)
    .map(({ entry }) => entry)
}

/**
 * Get list of all current Ledgers
 */
export async function getLedgers(): Promise<string[]> {
  return (await store.keys()).filter(k => !reservedKeys.includes(k))
}

function syncWorkers() {
  Object.values(window.workers ?? {}).forEach(
    w => w.postMessage('sync')
  )
}

/**
 * Subscribe to this key in a window.addEventListener to be notified of all data changes
 */
export const DATA_UPDATED_EVENT_KEY = 'data-updated'

/**
 * Event to dispatch every time data changes
 */
export const DATA_UPDATED_EVENT = new Event(DATA_UPDATED_EVENT_KEY)


/**
 * Set a value to the local data store and post `sync` message to all `window.workers`
 * 
 * Turn off syncing by passing `sync: false`
 *
 * Broadcasts a {@type DATA_UPDATED_EVENT} when data changes, accounting for
 * possibility that `set` is invoked from a worker (see related logic in
 * `findOrCreateWorker`), so that subscribers can stay up-to-date.
 */
async function set<T>(key: string, value: T, sync = true): Promise<T> {
  const ret = await store.setItem(key, value)
  if (sync) syncWorkers()
  if (typeof window === 'undefined') {
    postMessage(DATA_UPDATED_EVENT_KEY)
  } else {
    window.dispatchEvent(DATA_UPDATED_EVENT)
  }
  return ret
}

/**
 * Add an empty ledger to the local data store and skip syncing web workers
 */
export async function addEmptyLedger(name: string) {
  const normalized = await normalizeLedgerName(name)
  await set(normalized, [], false)
}

export async function addLedger({ name, dob }: { name: string, dob: string /* iso8601 */ }) {
  const normalized = await normalizeLedgerName(name)

  const now = Date.now()
  await set(normalized, [{
    title: 'Hello World!',
    emoji: '🐣',
    date: dob,
    created: now,
    updated: now,
  }])
}

async function normalizeLedgerName(name: string): Promise<string> {
  const normalized = name.trim()

  if (await get(normalized)) {
    throw new Error(`You already have a ledger for ${normalized}; please name this one something unique.`)
  }

  if (reservedKeys.includes(normalized)) {
    throw new Error(`The name "${normalized}" is reserved for internal use; please pick something else.`)
  }

  return normalized
}

export async function updateLedger({ oldName, newName }: { oldName: string, newName: string }) {
  const normalized = newName.trim()

  // if hit "save" on unchanged form, return early without error
  if (oldName === newName) return

  if (await get(normalized)) {
    throw new Error(`You already have a ledger for ${normalized}; please name this one something unique.`)
  }

  if (reservedKeys.includes(normalized)) {
    throw new Error(`The name "${normalized}" is reserved for internal use; please pick something else.`)
  }

  await store.removeItem(oldName)
  await set(newName, await get(oldName))
}

export async function removeLedger(name: string) {
  if (reservedKeys.includes(name)) {
    throw new Error(`The name "${name}" is reserved for internal use; you cannot remove this data.`)
  }
  await store.removeItem(name)
  syncWorkers()
}

function isFullEntry(entry: UserFacingEntry | Entry): entry is Entry {
  return 'created' in entry
}

export async function addEntry(toLedger: string, entry: UserFacingEntry | Entry, sync = true) {
  const ledger = await get(toLedger)
  if (!ledger) {
    throw new Error(`No ledger named "${toLedger}"!`)
  }

  const now = await getUniqueCreatedTimestamp(toLedger)
  let fullEntry: Entry = isFullEntry(entry) ? entry : {
    ...entry,
    created: now,
    updated: now,
  }
  await set(toLedger, [...ledger, fullEntry], sync)
}

async function getUniqueCreatedTimestamp(ledger: string): Promise<number> {
  let now = Date.now()
  while ((await get(ledger))?.find(e => e.created === now)) {
    now += 1
  }
  return now
}

/**
 * Update an entry in a ledger, using its `created` timestamp as its unique ID.
 */
export async function updateEntry(inLedger: string, entry: Omit<Entry, 'updated'>) {
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
      deletedAt: Date.now(),
    }
  ])

  // clear recent deletion after one minute
  setTimeout(clearOldestRecentDeletion, 20000)

  await set(toLedger, ledger.filter(
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

/**
 * Subscribe to all data changes, calling `onChange` each time
 *
 * Returns a function which will unsubscribe.
 */
export function subscribe(onChange: () => void): () => void {
  window.addEventListener(DATA_UPDATED_EVENT_KEY, onChange)
  return function unsubscribe() {
    window.removeEventListener(DATA_UPDATED_EVENT_KEY, onChange)
  }
}
