import { numToLetter, grab } from './worker-utils'
import { getGoogleToken, getLedgers, get as getLedger, entryKeys } from '../../local'

onmessage = async function (e) {
  if (e.data === 'sync') {
    await fullSync()
    postMessage('synced')
  }
}

async function fullSync() {
  await Promise.all((await getLedgers()).map(pushLedgerToSpreadsheet))
}

async function pushLedgerToSpreadsheet(name: string) {
  const entries = await getLedger(name)
  if (!entries) {
    throw new Error(`Ledger "${name}" not found! Cannot push its data to a Google Spreadsheet. Check the name and try again.`)
  }
  if (!entries[0]) {
    console.log(`Ledger "${name}" has no entries; nothing to push to Google Sheets`)
    return
  }

  const headerRow = entryKeys
  const rows = [
    headerRow, // header row; use `keys` to get Entry key names
    ...entries.map(entry => entryKeys.map(key => entry[key])),
  ]

  const spreadsheet = await findOrCreateSpreadsheet(name)

  await grab(
    `https://content-sheets.googleapis.com/v4/spreadsheets/${spreadsheet.id}/values:batchUpdate?alt=json`,
    {
      method: 'POST',
      ...await headers(),
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: [{
          range: `Sheet1!A1:${numToLetter(headerRow.length)}${rows.length}`,
          values: rows,
        }],
      })
    }
  )
}

async function findOrCreateSpreadsheet(name: string) {
  const spreadsheet = await findSpreadsheet(name)
  return spreadsheet ?? await createSpreadsheet(name)
}

async function findSpreadsheet(name: string) {
  const folderId = await findOrCreateFolderId()
  const { result } = await grab<{ files: { id: string, name: string }[] }>(
    'https://content.googleapis.com/drive/v3/files?spaces=drive&q=' +
    encodeURIComponent(
      `mimeType='application/vnd.google-apps.spreadsheet' `
      + `and name='${name}' `
      + `and parents in '${folderId}' `
      + `and trashed = false `
    ),
    await headers()
  )
  if (result.files && result.files.length > 1) {
    throw new Error(`You have more than one "${name}" spreadsheet in the Entire.Life folder in your Google Drive! Please rename the one that doesn't actually contain the data created by this app.`)
  }
  return result.files?.[0]
}

async function createSpreadsheet(name: string) {
  const folderId = await findOrCreateFolderId()
  const { result } = await grab<{ id: string, name: string }>(
    `https://content.googleapis.com/drive/v3/files?alt=json`,
    {
      method: 'POST',
      ...await headers(),
      body: JSON.stringify({
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [folderId],
        name,
      }),
    }
  )
  return result
}

async function accessToken(): Promise<string> {
  const googleToken = await getGoogleToken()
  if (!googleToken) throw new Error('Have not authenticated Google! Cannot sync.')
  return googleToken.access_token
}

async function headers({ json } = { json: true }): Promise<{ headers: Headers }> {
  const headers = new Headers({ 'Authorization': 'Bearer ' + await accessToken() })
  if (json) headers.set('Content-Type', 'application/json')
  return { headers }
}

let folderId: string

async function createFolderId(): Promise<string> {
  const { result: newFolder } = await grab<{ id: string, name: string }>(
    `https://content.googleapis.com/drive/v3/files?alt=json`,
    {
      method: 'POST',
      ...await headers(),
      body: JSON.stringify({
        name: 'Entire.Life',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    }
  )
  folderId = newFolder.id as string

  /**
   * Add README to the folder to explain what it is to people who find it when looking at their Google Drive
   * Logic taken from https://gist.github.com/tanaikech/bd53b366aedef70e35a35f449c51eced
   */
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify({
    'name': 'README.md', // Filename at Google Drive
    'mimeType': 'text/plain; charset=utf-8', // mimeType at Google Drive
    'parents': [folderId], // Folder ID at Google Drive
  })], { type: 'application/json' }))
  form.append('file', new Blob([`
DO NOT DELETE OR RENAME THIS FOLDER!
====================================

This folder was automatically created by Entire.Life (https://new.entire.life),
which syncs your data to a separate spreadsheet for each one of your Entire.Life
charts/ledgers.

If you change the name of this folder, Entire.Life will no longer be able to
find your data. This will break syncing to Google, and make it look like you
have no data (or only local data) in Entire.Life.


GO AHEAD AND EDIT THE SPREADSHEETS!
===================================

Sheet 1 in each of the spreadsheets needs to stay in the same format. Keep the
column names and positions the same! And if you edit a row, never modify the
'created' value--that's what Entire.Life uses to identity rows.  Otherwise, have
fun! Add, edit, and delete rows, and you'll see those changes in Entire.Life.

Neat!
  `], { type: 'text/plain' }))

  await grab('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    ...await headers({ json: false }),
    body: form,
  })

  return folderId
}

async function findFolderId(): Promise<string | undefined> {
  if (folderId) return folderId

  const { result } = await grab<{ files: { id: string, name: string }[] }>(
    'https://content.googleapis.com/drive/v3/files?spaces=drive&q=' +
    encodeURIComponent(
      `mimeType='application/vnd.google-apps.folder' `
      + `and name='Entire.Life' `
      + `and trashed = false `
    ),
    await headers()
  )
  if (result.files && result.files.length > 1) {
    throw new Error('You have more than one "Entire.Life" folder in your Google Drive! Please rename the one that doesn\'t actually contain the data created by this app.')
  }
  const folder = result.files?.[0]
  if (folder?.id) folderId = folder?.id
  return folder?.id
}

let findOrCreateLock: Promise<string>

/**
 * Find existing `Entire.Life` folder, or create new one.
 * 
 * Uses {@link findOrCreateLock} to enable multiple calls to fire in parallel
 * without accidentally creating duplicate folders.
 */
async function findOrCreateFolderId(): Promise<string> {
  if (findOrCreateLock) return await findOrCreateLock
  findOrCreateLock = new Promise(async resolve => {
    const folder = await findFolderId()
    resolve(folder ?? await createFolderId())
  })
  return await findOrCreateLock
}
