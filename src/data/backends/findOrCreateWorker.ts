import { DATA_UPDATED_EVENT, DATA_UPDATED_EVENT_KEY } from '../local'

if (!window.Worker) {
  throw new Error('WebWorkers not supported 😞 \n\nGet a better browser, friend!')
}

/**
 * Create a new Web Worker to sync data with the backend of type=`type`.
 * 
 * Adds the worker to a `window.workers` object, which is indexed by `type`, to
 * give all GUI scripts the ability to fire messages on persistent workers
 * (e.g. `window.workers.google.postMessage(…)`)
 * 
 * If `type` worker has already been added, will simply return it rather than
 * creating a duplicate worker.
 * 
 * @param type must match one of the folders in `src/data/backends`, such as `google`
 */
export async function findOrCreateWorker(
  type: string,
  onMessage: (e: MessageEvent<any>) => Promise<void>
): Promise<Worker> {
  window.workers = window.workers ?? {}
  if (window.workers[type]) return window.workers[type]!

  const worker = new Worker(new URL('./' + type + '/worker.ts', import.meta.url), {
    type: 'module',
  })
  worker.onmessage = async e => {
    if (e.data === DATA_UPDATED_EVENT_KEY) {
      window.dispatchEvent(DATA_UPDATED_EVENT)
    }
    await onMessage(e)
  }
  window.workers[type] = worker
  worker.postMessage('sync')
  return worker
}
