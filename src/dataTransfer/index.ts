import exitHook = require('exit-hook')

import { DataTransferLockingQueue, DataTransferSimpleQueue, DataTransferQueueBase } from './dataTransferQueue'
import DataTransferUploadStill from './dataTransferUploadStill'
import { DataTransferUploadClipFrame, DataTransferUploadClip } from './dataTransferUploadClip'
import DataTransferUploadAudio from './dataTransferUploadAudio'
import { IDeserializedCommand, ISerializableCommand } from '../commands/CommandBase'
import DataTransferUploadMultiViewerLabel from './dataTransferUploadMultiViewerLabel'
import { DataTransferDownloadMacro } from './dataTransferDownloadMacro'
import { DataTransferUploadMacro } from './dataTransferUploadMacro'
import { LockObtainedCommand, LockStateUpdateCommand } from '../commands/DataTransfer'
import debug0 from 'debug'
import type { UploadBufferInfo } from './dataTransferUploadBuffer'
import { DataTransferDownloadStill } from './dataTransferDownloadStill'

const MAX_PACKETS_TO_SEND_PER_TICK = 50
const MAX_TRANSFER_INDEX = (1 << 16) - 1 // Inclusive maximum

const debug = debug0('atem-connection:data-transfer:manager')

export interface UploadStillEncodingOptions {
	disableRLE?: boolean
}

export class DataTransferManager {
	#nextTransferIdInner = 0
	readonly #nextTransferId = (): number => {
		const index = this.#nextTransferIdInner++
		if (this.#nextTransferIdInner > MAX_TRANSFER_INDEX) this.#nextTransferIdInner = 0
		return index
	}

	readonly #sendLockCommand = (/*lock: DataTransferLockingQueue,*/ cmd: ISerializableCommand): void => {
		this.#rawSendCommands([cmd]).catch((e) => {
			debug(`Failed to send lock command: ${e}`)
		})
	}

	readonly #stillsLock = new DataTransferLockingQueue(0, this.#sendLockCommand, this.#nextTransferId)
	readonly #clipLocks = new Map<number, DataTransferLockingQueue>() // clipLocks get dynamically allocated
	readonly #labelsLock = new DataTransferSimpleQueue(this.#nextTransferId)
	readonly #macroLock = new DataTransferSimpleQueue(this.#nextTransferId)

	readonly #rawSendCommands: (cmds: ISerializableCommand[]) => Promise<void>

	private interval?: NodeJS.Timer
	private exitUnsubscribe?: () => void

	constructor(rawSendCommands: (cmds: ISerializableCommand[]) => Promise<void>) {
		this.#rawSendCommands = rawSendCommands
	}

	private get allLocks() {
		return [this.#stillsLock, ...this.#clipLocks.values(), this.#labelsLock, this.#macroLock]
	}

	/**
	 * Start sending of commands
	 * This is called once the connection has received the initial state data
	 */
	public startCommandSending(skipUnlockAll?: boolean): void {
		// TODO - abort any active transfers

		if (!this.interval) {
			// New connection means a new queue
			if (!skipUnlockAll) {
				debug(`Clearing all held locks`)
				for (const lock of this.allLocks) {
					lock.clearQueueAndAbort(new Error('Restarting connection'))
				}
			}

			this.interval = setInterval(() => {
				for (const lock of this.allLocks) {
					const commandsToSend = lock.popQueuedCommands(MAX_PACKETS_TO_SEND_PER_TICK) // Take some, it is unlikely that multiple will run at once
					if (commandsToSend && commandsToSend.length > 0) {
						// debug(`Sending ${commandsToSend.length} commands `)
						this.#rawSendCommands(commandsToSend).catch((e) => {
							// Failed to send/queue something, so abort it
							lock.tryAbortTransfer(new Error(`Command send failed: ${e}`))
						})
					}
				}
			}, 2) // TODO - refine this. perhaps we can stop and restart the interval?
		}
		if (!this.exitUnsubscribe) {
			this.exitUnsubscribe = exitHook(() => {
				debug(`Exit auto-cleanup`)
				// TODO - replace this with a WeakRef to the parent class?
				this.stopCommandSending()
			})
		}
	}

	/**
	 * Stop sending of commands
	 * This is called once the connection is disconnected
	 */
	public stopCommandSending(): void {
		debug('Stopping command sending')
		for (const lock of this.allLocks) {
			lock.clearQueueAndAbort(new Error('Stopping connection'))
		}

		if (this.exitUnsubscribe) {
			this.exitUnsubscribe()
			this.exitUnsubscribe = undefined
		}
		if (this.interval) {
			clearInterval(this.interval)
			this.interval = undefined
		}
	}

	/**
	 * Queue the handling of a received command
	 * We do it via a queue as some of the handlers need to be async, and we don't want to block state updates from happening in parallel
	 */
	public queueHandleCommand(command: IDeserializedCommand): void {
		debug(`Received command ${command.constructor.name}: ${JSON.stringify(command)}`)
		if (command instanceof LockObtainedCommand || command instanceof LockStateUpdateCommand) {
			let lock: DataTransferLockingQueue | undefined
			if (command.properties.index === 0) {
				lock = this.#stillsLock
			} else if (command.properties.index >= 100) {
				// Looks like a special lock that we arent expecting
				// Ignore it for now
				return
			} else {
				lock = this.#clipLocks.get(command.properties.index - 1)
			}

			// Must be a clip that we aren't expecting
			if (!lock)
				lock = new DataTransferLockingQueue(
					command.properties.index,
					this.#sendLockCommand,
					this.#nextTransferId
				)

			// handle actual command
			if (command instanceof LockObtainedCommand) {
				lock.lockObtained()
			} else if (command instanceof LockStateUpdateCommand) {
				lock.updateLock(command.properties.locked)
			}

			return
		}

		// If this command is for a transfer
		if (command.properties.transferId !== undefined) {
			// try to establish the associated DataLock:
			let lock: DataTransferQueueBase | undefined
			for (const _lock of this.allLocks) {
				if (_lock.currentTransferId === command.properties.transferId) {
					lock = _lock
				}
			}

			// console.log('CMD', command.constructor.name)
			// Doesn't appear to be for a known lock
			// TODO - should we fire an abort back just in case?
			if (!lock) return

			lock.handleCommand(command)
			// } else {
			// 	// debugging:
			// 	console.log('UNKNOWN COMMAND:', command)
		}
	}

	public async downloadClipFrame(clipIndex: number, frameIndex: number): Promise<Buffer> {
		if (clipIndex < 0 || clipIndex >= 2) {
			throw new Error('Invalid clip index')
		}

		const transfer = new DataTransferDownloadStill(clipIndex + 1, frameIndex)

		return this.getClipLock(clipIndex).enqueue(transfer)
	}

	public async downloadStill(index: number): Promise<Buffer> {
		const transfer = new DataTransferDownloadStill(0, index)

		return this.#stillsLock.enqueue(transfer)
	}

	public async uploadStill(index: number, data: UploadBufferInfo, name: string, description: string): Promise<void> {
		const transfer = new DataTransferUploadStill(index, data, name, description)
		return this.#stillsLock.enqueue(transfer)
	}

	public async uploadClip(
		index: number,
		data: Iterable<UploadBufferInfo> | AsyncIterable<UploadBufferInfo>,
		name: string
	): Promise<void> {
		const provideFrame = async function* (): AsyncGenerator<DataTransferUploadClipFrame, undefined> {
			let id = -1
			for await (const frame of data) {
				id++
				yield new DataTransferUploadClipFrame(index, id, frame)
			}
			return undefined
		}
		const transfer = new DataTransferUploadClip(index, name, provideFrame(), this.#nextTransferId)
		const lock = this.getClipLock(index)
		return lock.enqueue(transfer)
	}

	public async uploadAudio(index: number, data: Buffer, name: string): Promise<void> {
		const transfer = new DataTransferUploadAudio(index, data, name)
		const lock = this.getClipLock(index)
		return lock.enqueue(transfer)
	}

	public async downloadMacro(index: number): Promise<Buffer> {
		const transfer = new DataTransferDownloadMacro(index)

		return this.#macroLock.enqueue(transfer)
	}

	public async uploadMacro(index: number, data: Buffer, name: string): Promise<void> {
		const transfer = new DataTransferUploadMacro(index, data, name)

		return this.#macroLock.enqueue(transfer)
	}

	public async uploadMultiViewerLabel(index: number, data: Buffer): Promise<void> {
		const transfer = new DataTransferUploadMultiViewerLabel(index, data)
		return this.#labelsLock.enqueue(transfer)
	}

	private getClipLock(index: number): DataTransferLockingQueue {
		const lock = this.#clipLocks.get(index)
		if (lock) {
			return lock
		} else if (index >= 0 && index < 20) {
			const lock = new DataTransferLockingQueue(index + 1, this.#sendLockCommand, this.#nextTransferId)
			this.#clipLocks.set(index, lock)
			return lock
		} else {
			throw new Error('Invalid clip index')
		}
	}
}
