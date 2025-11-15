import { parentPort } from 'worker_threads'
import * as comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/umd/node-adapter'
import { SocketWorkerApi } from './atemSocketChildWrapper'

if (!parentPort) {
	throw new Error('InvalidWorker')
}

comlink.expose(new SocketWorkerApi(), nodeEndpoint(parentPort))
