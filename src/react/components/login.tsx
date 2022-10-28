import React from 'react'
import { getGoogleToken, setGoogleToken } from '../data'

const scopes = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
] as const

const discoveryDocs = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
]

let gapiLoaded = false

/**
 * Fetch Google API (gapi) by adding new `<script>` tag to page and then loading app's `gapi.client`.
 * Returns immediately if `gapi` global is already available.
 * Otherwise, will only return after everything's initialized.
 */
async function loadGapi(): Promise<typeof gapi> {
  if (gapiLoaded) return gapi

  let gapiLoadOkay: () => void
  let gapiLoadFail: (error: unknown) => void

  const gapiLoadPromise = new Promise<void>((resolve, reject) => {
    gapiLoadOkay = resolve
    gapiLoadFail = reject
  })

  const gapiScript = document.createElement('script')
  gapiScript.src = 'https://apis.google.com/js/api.js'
  gapiScript.onload = () => gapiLoadOkay()
  gapiScript.onerror = e => gapiLoadFail(e)
  document.body.appendChild(gapiScript)

  await gapiLoadPromise
  await new Promise((resolve, reject) => {
    gapi.load('client', { callback: resolve, onerror: reject })
  });
  await gapi.client.init({
    apiKey: import.meta.env.PUBLIC_GOOGLE_API_KEY,
    discoveryDocs, // load public endpoints here
  })
  // .then(function() { // load OAuth-guarded endpoints here
  //   gapi.client.load('https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest')
  // })

  const accessToken = await getGoogleToken()
  if (accessToken) gapi.client.setToken(accessToken)

  gapiLoaded = true

  return gapi
}

let tokenClient: google.accounts.oauth2.TokenClient

async function loadGoogleIdentityServices(): Promise<google.accounts.oauth2.TokenClient> {
  if (tokenClient) return tokenClient

  let gisLoadOkay: () => void
  let gisLoadFail: (error: unknown) => void

  const gisLoadPromise = new Promise<void>((resolve, reject) => {
    gisLoadOkay = resolve
    gisLoadFail = reject
  })

  const gisScript = document.createElement('script')
  gisScript.src = 'https://accounts.google.com/gsi/client'
  gisScript.onload = () => gisLoadOkay()
  gisScript.onerror = e => gisLoadFail(e)
  document.body.appendChild(gisScript)

  await gisLoadPromise
  await new Promise<void>((resolve, reject) => {
    try {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
        scope: scopes.join(' '),
        callback: () => { }, // override when calling `requestAccessToken`
      })
      resolve()
    } catch (err) {
      reject(err)
    }
  })

  return tokenClient
};

async function checkApiError(err: gapi.client.HttpRequestRejected) {
  console.log('checkApiError', err)
  const { code, status } = err.result.error
  console.log('checkApiError', err, { code, status })
  if (code === 401 || code === 403 && status === "PERMISSION_DENIED") {
    // The access token is missing, invalid, or expired, prompt for user consent to obtain one.
    console.log('trying to reset access token')
    await new Promise((resolve, reject) => {
      try {
        // Settle this promise in the response callback for requestAccessToken()
        // @ts-expect-error tokenClient.callback not typed correctly
        tokenClient.callback = async (resp: google.accounts.oauth2.TokenResponse) => {
          if (resp.error !== undefined) reject(resp.error);
          await setGoogleToken(resp)
          resolve(resp)
        };
        tokenClient.requestAccessToken();
      } catch (err) {
        console.log(err)
      }
    });
  } else {
    // Errors unrelated to authorization: server errors, exceeding quota, bad requests, and so on.
    throw err;
  }
}

function isGapiError(e: unknown): e is gapi.client.HttpRequestRejected {
  return ((e as Record<string, any>)?.result?.hasOwnProperty('error'))
}

/**
 * Try a call to Google API (gapi) twice. If it fails the first time,
 * {@link checkApiError} will be called to check if the access token expired,
 * resetting it and retrying the call if so.
 * @param fn asynchronous function to try twice
 * @returns the return value of `fn`, or throws an error
 */
async function tryTwice<T>(fn: () => Promise<T>): Promise<T | void> {
  try {
    return await fn()
  } catch (e: unknown) {
    if (!(isGapiError(e))) throw e
    try {
      await checkApiError(e)
      return await fn()
    } catch (e: unknown) {
      if (!(isGapiError(e))) throw e
      await checkApiError(e)
    }
  }
}

/**
 * Return the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @returns string[] if successful; `undefined` if unsuccessful
 */
async function listMajors(): Promise<string[] | void> {
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

async function handleAuthClick(callback?: () => void) {
  const [gapi, tokenClient] = await Promise.all([
    loadGapi(),
    loadGoogleIdentityServices(),
  ])

  await new Promise((resolve, reject) => {
    try {
      // Settle this promise in the response callback for requestAccessToken()
      // @ts-expect-error tokenClient.callback not typed correctly
      tokenClient.callback = async (resp: google.accounts.oauth2.TokenResponse) => {
        if (resp.error !== undefined) reject(resp.error)
        await Promise.all([
          setGoogleToken(resp),
          callback && callback(),
        ])
        resolve(resp)
      }
      if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (err) {
      console.log(err)
    }
  });
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
      Promise.all([
        loadGapi(),
        loadGoogleIdentityServices()
      ]).then(async ([gapi]) => {
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
          onClick={async () => {
            const token = gapi.client.getToken()
            if (token !== null) {
              google.accounts.oauth2.revoke(token.access_token, () => {
                setSignedIn(false)
              })
              gapi.client.setToken(null)
              await setGoogleToken(undefined)
            }
          }}
        >
          Sign Out
        </button>
        <button
          style={{ float: 'right', marginLeft: '0.5em' }}
          onClick={() => handleAuthClick()}
        >
          Refresh
        </button>
      </>
    )
  }

  return (
    <button
      style={{ float: 'right', marginLeft: '0.5em' }}
      onClick={() => handleAuthClick(async () => {
        setSignedIn(true)
        console.log(await listMajors())
      })}
    >
      Sync with Google Sheets
    </button>
  )
}
