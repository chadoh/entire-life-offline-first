if (!window.Worker) {
  throw new Error('WebWorkers not supported 😞 \n\nGet a better browser, friend!')
}

export async function createWorker(type: string): Promise<Worker> {
  const worker = new Worker(new URL('./' + type + '/worker.ts', import.meta.url), {
    type: 'module',
  })
  window.workers = window.workers ?? []
  window.workers.push(worker)
  worker.postMessage({ directive: 'sync' })
  return worker
}