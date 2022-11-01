import React from 'react'

import { loadGoogle, tryTwice, signIn, signOut } from './google'
import { getGoogleToken } from '../../data'

let folderId: string

async function createFolderId(): Promise<string> {
  const newFolder = await gapi.client.drive.files.create({
    resource: {
      name: "Entire.Life",
      mimeType: 'application/vnd.google-apps.folder'
    },
    fields: 'id,name'
  })
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

  const { result } = await gapi.client.drive.files.list({
    q: 'mimeType=\'application/vnd.google-apps.folder\' and name=\'Entire.Life\' and trashed = false',
    fields: 'nextPageToken, files(id, name)',
    spaces: 'drive',
  })
  if (result.files && result.files.length > 1) {
    console.log(result.files)
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
  const { result } = await gapi.client.drive.files.list({
    q: `mimeType=\'application/vnd.google-apps.spreadsheet\' and name=\'${name}\' and parents in '${folderId}' and trashed = false`,
    spaces: 'drive',
  })
  if (result.files && result.files.length > 1) {
    console.log(result.files)
    throw new Error(`You have more than one "${name}" spreadsheet in the Entire.Life folder your Google Drive! Please rename the one that doesn\'t actually contain the data created by this app.`)
  }
  return result.files?.[0]
}

async function createSpreadsheet(name: string) {
  const folderId = await findOrCreateFolderId()
  const response = await gapi.client.drive.files.create({
    resource: {
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [folderId],
      name,
    },
    fields: 'id,name',
  })
  return response.result
}

async function findOrCreateSpreadsheet(name: string) {
  const spreadsheet = await findSpreadsheet(name)
  return spreadsheet ?? await createSpreadsheet(name)
}

/**
 * Return the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @returns string[] if successful; `undefined` if unsuccessful
 */
async function listMajors(): Promise<string[] | void> {
  console.log(await findOrCreateSpreadsheet('Chad'))
  return tryTwice(() => (
    gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        range: 'Class Data!A2:E', // first 10 files
      })
      .then(response => (
        response.result?.values?.reduce(
          (arr, row) => [...arr, `${row[0]}, ${row[4]}`],
          ['Name, Major']
        )
      ))
  ))
}

export default function Login() {
  const [wantsGoogle, setWantsGoogle] = React.useState(false)
  const [signedIn, setSignedIn] = React.useState(false)

  // Only load/contact Google if the user currently signed in with Google
  React.useEffect(() => {
    getGoogleToken().then(_ => setWantsGoogle(true))
  }, [])

  React.useEffect(() => {
    // if `wantsGoogle` changes from false to true, load Google scripts
    if (wantsGoogle) {
      loadGoogle().then(async ([gapi]) => {
        if (gapi.client.getToken() !== null) {
          setSignedIn(true)
          console.log(await listMajors())
        }
      })
    }
  }, [wantsGoogle]);

  if (signedIn) {
    return (
      <>
        <button
          style={{ float: 'right', marginLeft: '0.5em' }}
          onClick={() => signOut(() => setSignedIn(false))}
        >
          Sign Out
        </button>
        <button
          style={{ float: 'right', marginLeft: '0.5em' }}
          onClick={() => signIn()}
        >
          Refresh
        </button>
      </>
    )
  }

  return (
    <button
      style={{ float: 'right', marginLeft: '0.5em' }}
      onClick={() => signIn(async () => {
        setSignedIn(true)
        console.log(await listMajors())
      })}
    >
      Sync with Google Sheets
    </button>
  )
}