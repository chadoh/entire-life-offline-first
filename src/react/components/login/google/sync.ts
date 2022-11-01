import { tryTwice } from './auth'
import { getLedgers, get as getLedger, entryKeys } from '../../../data'

let folderId: string

async function createFolderId(): Promise<string> {
  const newFolder = await tryTwice(() => gapi.client.drive.files.create({
    resource: {
      name: "Entire.Life",
      mimeType: 'application/vnd.google-apps.folder'
    },
    fields: 'id,name'
  }))
  folderId = newFolder.result.id as string

  /**
   * Add README to the folder to explain what it is to people who find it when looking at their Google Drive
   * Logic taken from https://gist.github.com/tanaikech/bd53b366aedef70e35a35f449c51eced
   */
  const accessToken = gapi.auth.getToken().access_token // Here gapi is used for retrieving the access token.
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

  await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form,
  })

  return folderId
}

async function findFolderId(): Promise<string | undefined> {
  if (folderId) return folderId

  const { result } = await tryTwice(() => gapi.client.drive.files.list({
    q: 'mimeType=\'application/vnd.google-apps.folder\' and name=\'Entire.Life\' and trashed = false',
    fields: 'nextPageToken, files(id, name)',
    spaces: 'drive',
  }))
  if (result.files && result.files.length > 1) {
    throw new Error('You have more than one "Entire.Life" folder in your Google Drive! Please rename the one that doesn\'t actually contain the data created by this app.')
  }
  const folder = result.files?.[0]
  if (folder?.id) folderId = folder?.id
  return folder?.id
}

async function findOrCreateFolderId(): Promise<string> {
  const folder = await findFolderId()
  return folder ?? await createFolderId()
}

async function findSpreadsheet(name: string) {
  const folderId = await findOrCreateFolderId()
  const { result } = await tryTwice(() => gapi.client.drive.files.list({
    q: `mimeType=\'application/vnd.google-apps.spreadsheet\' and name=\'${name}\' and parents in '${folderId}' and trashed = false`,
    spaces: 'drive',
  }))
  if (result.files && result.files.length > 1) {
    throw new Error(`You have more than one "${name}" spreadsheet in the Entire.Life folder your Google Drive! Please rename the one that doesn\'t actually contain the data created by this app.`)
  }
  return result.files?.[0]
}

async function createSpreadsheet(name: string) {
  const folderId = await findOrCreateFolderId()
  const response = await tryTwice(() => gapi.client.drive.files.create({
    resource: {
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [folderId],
      name,
    },
    fields: 'id,name',
  }))
  return response.result
}

async function findOrCreateSpreadsheet(name: string) {
  const spreadsheet = await findSpreadsheet(name)
  return spreadsheet ?? await createSpreadsheet(name)
}

/**
 * Convert a number like `1` into a letter like `A`.
 * 
 *   - 2: 'B'
 *   - 3: 'C'
 *   - 4: 'D'
 *   - etc...
 * 
 * Logic adapted from https://devenum.com/convert-numbers-to-letters-javascript-decode/
 */
function numToLetter(num: number): string {
  return String.fromCharCode(num + 64)
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

  await tryTwice(() => gapi.client.sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: spreadsheet.id as string,
    resource: {
      data: [{
        range: `Sheet1!A1:${numToLetter(headerRow.length)}${rows.length}`,
        values: rows,
      }],
      valueInputOption: 'RAW',
    },
  }))
}

export async function sync() {
  await Promise.all((await getLedgers()).map(pushLedgerToSpreadsheet))
}
