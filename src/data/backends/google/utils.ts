import { setGoogleToken } from '../../local'
import { load } from './auth'

/**
 * Try a call to Google API (gapi) twice. If it fails the first time,
 * {@link checkApiError} will be called to check if the access token expired,
 * resetting it and retrying the call if so.
 * @param fn asynchronous function to try twice
 * @returns the return value of `fn`, or throws an error
 */
export async function tryTwice<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: unknown) {
    if (!(isGapiError(e)))
      throw e;
    try {
      await checkApiError(e);
      return await fn();
    } catch (e: unknown) {
      if (!(isGapiError(e)))
        throw e;
      await checkApiError(e);
      throw e;
    }
  }
}

async function checkApiError(err: gapi.client.HttpRequestRejected) {
  const { code, status } = err.result.error
  if (code === 401 || code === 403 && status === "PERMISSION_DENIED") {
    const [_, tokenClient] = await load()
    // The access token is missing, invalid, or expired, prompt for user consent to obtain one.
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
        console.error(err)
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
