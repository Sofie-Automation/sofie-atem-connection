import { IDeserializedCommand, ISerializableCommand } from '../commands/CommandBase.js'
import { DataTransfer, DataTransferState, ProgressTransferResult } from './dataTransfer.js'
import { LockStateCommand } from '../commands/DataTransfer/index.js'
import PQueue from 'p-queue'
import debug0 from 'debug'

const debug = debug0('atem-connection:data-transfer:upload-buffer')

export interface ActiveTransfer {
	id: number
	state: DataTransferState
	job: DataTransfer<any>
	queuedCommands: ISerializableCommand[]
}

const queueHighPriority = 99

export abstract class DataTransferQueueBase {
	protected readonly taskQueue: Array<DataTransfer<any>> = []

	// protected readonly queueCommands: (...cmds: ISerializableCommand[]) => void
	protected readonly nextTransferId: () => number
	protected readonly handleCommandQueue = new PQueue({ concurrency: 1 })

	protected activeTransfer: ActiveTransfer | undefined

	constructor(nextTransferId: () => number) {
		// this.queueCommands = queueCommands
		this.nextTransferId = nextTransferId
	}

	public get currentTransferId(): number | null {
		return this.activeTransfer?.id ?? null
	}

	/** Clear the pending queue, and abort any in-progress transfers */
	public clearQueueAndAbort(reason: Error): void {
		for (const transfer of this.taskQueue) {
			transfer.abort(reason)
		}
		this.taskQueue.splice(0, this.taskQueue.length)

		this.handleCommandQueue.clear()

		this.transferCompleted()

		if (this.activeTransfer) {
			this.activeTransfer.job.abort(reason)
			this.activeTransfer = undefined
		}
	}

	/** Pop some queued commands from the active transfer */
	public popQueuedCommands(maxCount: number): ISerializableCommand[] | null {
		if (this.activeTransfer) {
			if (
				this.activeTransfer.queuedCommands.length === 0 &&
				this.activeTransfer.state === DataTransferState.Finished
			) {
				// This has now truely finished, so fire up the next thing

				// Transfer reports as having finished, so clear tracker and start the next
				this.transferCompleted()
				this.activeTransfer = undefined

				this.dequeueAndRun()
				return []
			} else {
				return this.activeTransfer.queuedCommands.splice(0, maxCount)
			}
		} else {
			return null
		}
	}

	/** Queue a transfer to be performed */
	public async enqueue<T>(transfer: DataTransfer<T>): Promise<T> {
		this.taskQueue.push(transfer)

		this.dequeueAndRun()

		return transfer.promise
	}

	private dequeueAndRun(): void {
		if (this.activeTransfer) return

		const newTransfer = this.taskQueue.shift()
		if (!newTransfer) return

		// Anything in the queue is rubbish now TODO - is this true? what about lock changes?
		this.handleCommandQueue.clear()

		const transferId = this.nextTransferId()
		this.activeTransfer = {
			id: transferId,
			state: DataTransferState.Pending,
			job: newTransfer,
			queuedCommands: [],
		}

		this.tryStartTransfer()
	}

	/**
	 * Try and start the 'activeTransfer' if it is sat at pending
	 * This is done in the queue, and calls back out to this.startTransfer
	 */
	protected tryStartTransfer(): void {
		if (this.activeTransfer) {
			this.handleCommandQueue
				.add(
					async () => {
						const transfer = this.activeTransfer
						if (!transfer || transfer.state !== DataTransferState.Pending) {
							// No transfer to start
							return
						}

						const result = await this.startTransfer(transfer.job, transfer.id)

						// TODO - this is rather duplicated..
						if (this.activeTransfer?.id !== transfer.id) {
							throw new Error('Transfer changed mid-handle!')
						}

						// Store the result
						transfer.state = result.newState
						transfer.queuedCommands.push(...result.commands)

						// if (transfer.state === DataTransferState.)
						if (transfer.state === DataTransferState.Finished && transfer.queuedCommands.length === 0) {
							// Transfer reports as having finished, so clear tracker and start the next
							this.transferCompleted()
							this.activeTransfer = undefined

							this.dequeueAndRun()
						} else {
							// Looks to be progressing along
						}
					},
					{ priority: queueHighPriority }
				)
				.catch((e) => {
					// TODO - better
					console.error(`startTransfer failed: ${e}`)
				})
		}
	}

	/**
	 * Try and abort the 'activeTransfer' if there is one
	 */
	public tryAbortTransfer(reason: Error): void {
		if (this.activeTransfer) {
			const transferId = this.activeTransfer.id
			this.handleCommandQueue
				.add(
					async () => {
						const transfer = this.activeTransfer
						if (!transfer || transfer.id !== transferId) {
							// Wrong transfer to abort
							return
						}

						transfer.job.abort(reason)
						this.transferCompleted()
						this.activeTransfer = undefined

						this.dequeueAndRun()
					},
					{ priority: queueHighPriority }
				)
				.catch((e) => {
					// TODO - better
					console.error(`abortTransfer failed: ${e}`)
				})
		}
	}

	protected abstract startTransfer(transfer: DataTransfer<any>, transferId: number): Promise<ProgressTransferResult>

	protected abstract transferCompleted(): void

	public handleCommand(command: IDeserializedCommand): void {
		this.handleCommandQueue
			.add(async () => {
				const transfer = this.activeTransfer
				if (!transfer || transfer.id !== command.properties.transferId) {
					// The id changed while this was queued. Hopefully safe to discard it
					return
				}

				if (transfer.state === DataTransferState.Pending) {
					// Transfer has not sent its init, so ignore
					return
				}

				const oldState = transfer.state
				const result = await transfer.job.handleCommand(command, oldState)

				if (this.activeTransfer?.id !== transfer.id) {
					throw new Error('Transfer changed mid-handle!')
				}

				// Store the result
				transfer.state = result.newState
				transfer.queuedCommands.push(...result.commands)

				if (transfer.state !== DataTransferState.Finished && transfer.queuedCommands.length === 0) {
					// // Transfer reports as having finished, so clear tracker and start the next
					// this.transferCompleted()
					// this.activeTransfer = undefined
					// this.dequeueAndRun()
				} else {
					// Looks to be progressing along

					// If the transfer provided a new id, track it
					if (result.newId !== undefined) {
						transfer.id = result.newId
					}
				}
			})
			.catch((e) => {
				// TODO - better
				console.error(`Queue error: ${e}`)
			})
	}
}

export class DataTransferLockingQueue extends DataTransferQueueBase {
	readonly #storeId: number
	readonly #sendLockCommand: (cmd: LockStateCommand) => void

	private isLocked: boolean

	constructor(storeId: number, sendLockCommand: (cmd: LockStateCommand) => void, nextTransferId: () => number) {
		super(nextTransferId)

		this.#storeId = storeId
		this.#sendLockCommand = sendLockCommand
		this.isLocked = false
	}

	protected async startTransfer(transfer: DataTransfer<any>, transferId: number): Promise<ProgressTransferResult> {
		debug(`Starting transfer ${transferId} (Already locked = ${this.isLocked})`)
		if (this.isLocked) {
			// Get the transfer going immediately
			return transfer.startTransfer(transferId)
		} else {
			this.#sendLockCommand(new LockStateCommand(this.#storeId, true))

			// We need to lock the pool first
			return {
				newState: DataTransferState.Pending,
				commands: [],
			}
		}
	}

	/** We have obtained the lock! */
	public lockObtained(): void {
		this.isLocked = true

		// Get the transfer started
		this.tryStartTransfer()
	}

	/** The status of the lock has changed */
	public updateLock(locked: boolean): void {
		const wasLocked = this.isLocked
		this.isLocked = locked

		if (wasLocked && !locked) {
			// only abort when it becomes unlocked unexpectedly, otherwise we're likely waiting to
			// obtain lock for a transfer queued shortly after sending unlock command
			this.tryAbortTransfer(new Error('Lost lock mid-transfer'))
		}
	}

	protected transferCompleted(): void {
		if (this.isLocked && !this.taskQueue.length) {
			// unlock only when queue is empty

			this.isLocked = false

			debug(`Completing transfer`)

			// Unlock the pool
			this.#sendLockCommand(new LockStateCommand(this.#storeId, false))
		}
	}
}

export class DataTransferSimpleQueue extends DataTransferQueueBase {
	protected async startTransfer(transfer: DataTransfer<any>, transferId: number): Promise<ProgressTransferResult> {
		return transfer.startTransfer(transferId)
	}

	protected transferCompleted(): void {
		// Nothing to do
	}
}
