/**
 * Worker-thread entry point for AtemSocketChild.
 * This file is spawned by AtemSocket as a worker thread.
 * Keeping it separate from atemSocketChild.ts means that file stays
 * importable without pulling in worker_threads or IPC machinery.
 */
import { parentPort, workerData } from 'node:worker_threads'

import { IpcWrapper } from 'thread-tools'
import type { IpcEventHandlers } from 'thread-tools'

import { AtemSocketChild } from './atemSocketChild.js'
import type { ChildToParentIpc, ParentToChildIpc } from './atemSocketIpc.js'

if (!parentPort) throw new Error('atemSocketChildWorker must be run as a worker thread')

const port = parentPort
const options = workerData as { address: string; port: number; debugBuffers: boolean; maxReconnectDelay?: number }

const handlers: IpcEventHandlers<ParentToChildIpc> = {
	connect: async ({ address, port: p }) => {
		await child.connect(address, p)
	},
	disconnect: async () => {
		await child.disconnect()
	},
	sendPackets: async ({ packets }) => {
		child.sendPackets(packets)
	},
}

const childIpc = new IpcWrapper<ChildToParentIpc, ParentToChildIpc>(handlers, (msg) => port.postMessage(msg), 10000)

const child = new AtemSocketChild(
	options,
	async () => {
		childIpc.sendWithNoCb('onDisconnect', {})
	},
	async (message) => {
		childIpc.sendWithNoCb('onLog', { message })
	},
	async (payload, _packetId) => {
		childIpc.sendWithNoCb('onCommandsReceived', { payload })
	},
	async (ids) => {
		childIpc.sendWithNoCb('onPacketsAcknowledged', { ids })
	}
)

port.on('message', (msg) => childIpc.receivedMessage(msg))
