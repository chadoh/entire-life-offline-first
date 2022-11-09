import { getGoogleToken, setGoogleToken } from '../../local'

export async function isWanted(): Promise<boolean> {
  return Boolean(await getGoogleToken())
}

const scopes = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
] as const

const discoveryDocs = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
]

let gapiLoaded = false

/**
 * Fetch Google API (gapi) by adding new `<script>` tag to page and then loading
 * app's `gapi.client`, returning `gapi`.
 *
 * Returns immediately if `gapi` global is already available.
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

  const accessToken = await getGoogleToken()
  if (accessToken) gapi.client.setToken(accessToken)

  gapiLoaded = true

  return gapi
}

let tokenClient: google.accounts.oauth2.TokenClient

/**
 * Fetch Google Identity Services (gis) by adding new `<script>` tag to page and
 * then initializing a new `google.accounts.oauth.tokenClient` and returning it.
 *
 * Returns immediately if `tokenClient` is already initialized.
 */
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
}

/**
 * Fetch Google API (gapi) and Google Identity Services (gis) by adding new
 * `<script>` tags to page with {@link loadGapi} and {@link loadGoogleIdentityServices}.
 *
 * Can be called idempotently without adding duplicate `<script>` tags to page;
 * will immediately return already-loaded `gapi` and `tokenClient` if available.
 */
export async function load() {
  return await Promise.all([
    loadGapi(),
    loadGoogleIdentityServices(),
  ])
}

export async function signIn(callback?: () => void) {
  const [gapi, tokenClient] = await load()

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
      console.error(err)
    }
  });
}

export async function signOut(callback?: (args?: any[]) => void) {
  const [gapi] = await load()
  const token = gapi.client.getToken()
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token, () => {
      callback && callback()
    })
    gapi.client.setToken(null)
    await setGoogleToken(undefined)
  }
}