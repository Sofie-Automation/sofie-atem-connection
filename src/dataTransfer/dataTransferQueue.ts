import debug0 from 'debug'
import PQueue from 'p-queue'

import { IDeserializedCommand, ISerializableCommand } from '../commands/CommandBase.js'
import { LockStateCommand } from '../commands/DataTransfer/index.js'
import { DataTransfer, DataTransferState, ProgressTransferResult } from './dataTransfer.js'

const debug = debug0('atem-connection:data-transfer:upload-buffer')

export interface ActiveTransfer {
	id: number
	state: DataTransferState
	job: DataTransfer<any>
	queuedCommands: ISerializableCommand[]
}

const queueHighPriority = 99

/**
 * How long a started transfer may go without hearing anything from the atem before it is aborted.
 * Generous, as the atem can take a while to commit a large upload before reporting it as complete.
 * This does not apply while waiting to obtain the lock, as another client can legitimately hold that for a long time.
 */
export const DEFAULT_TRANSFER_INACTIVITY_TIMEOUT = 30_000

function abortReasonToError(reason: unknown): Error {
	// The default reason is a DOMException, which is an Error
	return reason instanceof Error ? reason : new Error(`Transfer aborted: ${reason}`)
}

export interface DataTransferQueueOptions {
	nextTransferId: () => number
	/** Report an unexpected error */
	onError: (message: string) => void
	/** Inactivity timeout in milliseconds */
	inactivityTimeout?: number
}

export abstract class DataTransferQueueBase {
	protected readonly taskQueue: Array<DataTransfer<any>> = []

	protected readonly nextTransferId: () => number
	protected readonly onError: (message: string) => void
	readonly #handleCommandQueue = new PQueue({ concurrency: 1 })

	readonly #inactivityTimeout: number
	#inactivityTimer: NodeJS.Timeout | undefined
	/** Whether a task for the active transfer is currently running. Time spent in there (eg generating clip frames) is not inactivity */
	#handlingTask = false

	#activeTransfer: ActiveTransfer | undefined
	protected get activeTransfer(): ActiveTransfer | undefined {
		return this.#activeTransfer
	}
	protected set activeTransfer(transfer: ActiveTransfer | undefined) {
		this.#activeTransfer = transfer
		// A new transfer starts as pending, so the timer is only armed once it has been started
		this.#clearInactivityTimer()
	}

	constructor(options: DataTransferQueueOptions) {
		this.nextTransferId = options.nextTransferId
		this.onError = options.onError
		this.#inactivityTimeout = options.inactivityTimeout ?? DEFAULT_TRANSFER_INACTIVITY_TIMEOUT
	}

	#clearInactivityTimer(): void {
		if (this.#inactivityTimer) {
			clearTimeout(this.#inactivityTimer)
			this.#inactivityTimer = undefined
		}
	}

	/** Restart the inactivity timer, if there is a transfer which has been started */
	#resetInactivityTimer(): void {
		this.#clearInactivityTimer()

		const transfer = this.activeTransfer
		if (!transfer || transfer.state === DataTransferState.Pending || transfer.state === DataTransferState.Finished)
			return

		const timer = setTimeout(() => {
			if (this.#inactivityTimer !== timer) return
			this.#inactivityTimer = undefined

			if (this.#handlingTask) {
				// Still busy with something for this transfer, so check again later
				this.#resetInactivityTimer()
				return
			}

			this.tryAbortTransfer(new Error(`Transfer timed out after ${this.#inactivityTimeout}ms of inactivity`))
		}, this.#inactivityTimeout)
		// Don't let a stalled transfer keep the process alive
		timer.unref?.()
		this.#inactivityTimer = timer
	}

	/** Abort a transfer, and move on to the next one. Does nothing if it is no longer the active transfer */
	#failTransfer(transfer: ActiveTransfer, reason: unknown): void {
		if (this.activeTransfer !== transfer) return

		transfer.job.abort(reason instanceof Error ? reason : new Error(`${reason}`))
		this.transferCompleted()
		this.activeTransfer = undefined

		this.dequeueAndRun()
	}

	/** Run a task for the active transfer, pausing the inactivity timer while it runs */
	async #runTransferTask(fn: () => Promise<void>): Promise<void> {
		this.#handlingTask = true
		try {
			await fn()
		} finally {
			this.#handlingTask = false
			this.#resetInactivityTimer()
		}
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

		this.#handleCommandQueue.clear()

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

	/**
	 * Queue a transfer to be performed
	 * @param signal Abort the transfer, whether it is still queued or already running
	 */
	public async enqueue<T>(transfer: DataTransfer<T>, signal?: AbortSignal): Promise<T> {
		if (signal) {
			if (signal.aborted) {
				transfer.abort(abortReasonToError(signal.reason))
				return transfer.promise
			}

			const onAbort = () => this.#abortTransfer(transfer, abortReasonToError(signal.reason))
			signal.addEventListener('abort', onAbort, { once: true })
			const cleanup = () => signal.removeEventListener('abort', onAbort)
			transfer.promise.then(cleanup, cleanup)
		}

		this.taskQueue.push(transfer)

		this.dequeueAndRun()

		return transfer.promise
	}

	/** Abort a specific transfer, whether it is still queued or is the active transfer */
	#abortTransfer(job: DataTransfer<any>, reason: Error): void {
		const index = this.taskQueue.indexOf(job)
		if (index !== -1) {
			this.taskQueue.splice(index, 1)
			job.abort(reason)
			return
		}

		const active = this.activeTransfer
		if (active?.job !== job) return

		// Run in the command queue, so that it doesn't happen part way through handling a command for this transfer.
		// There is no way to tell the atem to abort a transfer, so this stops sending to it and releases the lock, the
		// same as when a transfer times out
		this.#handleCommandQueue
			.add(async () => this.#failTransfer(active, reason), { priority: queueHighPriority })
			.catch((e) => {
				this.onError(`abortTransfer failed: ${e}`)
			})
	}

	private dequeueAndRun(): void {
		if (this.activeTransfer) return

		const newTransfer = this.taskQueue.shift()
		if (!newTransfer) return

		// Anything in the queue is rubbish now TODO - is this true? what about lock changes?
		this.#handleCommandQueue.clear()

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
			this.#handleCommandQueue
				.add(
					async () =>
						this.#runTransferTask(async () => {
							const transfer = this.activeTransfer
							if (!transfer || transfer.state !== DataTransferState.Pending) {
								// No transfer to start
								return
							}

							let result: ProgressTransferResult
							try {
								result = await this.startTransfer(transfer.job, transfer.id)
							} catch (e) {
								// Left alone it would sit there forever, as a pending transfer has no timeout
								this.#failTransfer(transfer, e)
								return
							}

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
						}),
					{ priority: queueHighPriority }
				)
				.catch((e) => {
					this.onError(`startTransfer failed: ${e}`)
				})
		}
	}

	/**
	 * Try and abort the 'activeTransfer' if there is one
	 */
	public tryAbortTransfer(reason: Error): void {
		if (this.activeTransfer) {
			const transferId = this.activeTransfer.id
			this.#handleCommandQueue
				.add(
					async () => {
						const transfer = this.activeTransfer
						if (!transfer || transfer.id !== transferId) {
							// Wrong transfer to abort
							return
						}

						this.#failTransfer(transfer, reason)
					},
					{ priority: queueHighPriority }
				)
				.catch((e) => {
					this.onError(`abortTransfer failed: ${e}`)
				})
		}
	}

	protected abstract startTransfer(transfer: DataTransfer<any>, transferId: number): Promise<ProgressTransferResult>

	protected abstract transferCompleted(): void

	public handleCommand(command: IDeserializedCommand): void {
		this.#handleCommandQueue
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

				await this.#runTransferTask(async () => {
					const oldState = transfer.state
					let result: ProgressTransferResult
					try {
						result = await transfer.job.handleCommand(command, oldState)
					} catch (e) {
						// The transfer can't make progress after this, so fail it rather than waiting for the timeout
						this.#failTransfer(transfer, e)
						return
					}

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
			})
			.catch((e) => {
				this.onError(`Queue error: ${e}`)
			})
	}
}

export class DataTransferLockingQueue extends DataTransferQueueBase {
	readonly #storeId: number
	readonly #sendLockCommand: (cmd: LockStateCommand) => void

	/**
	 * Whether we hold the lock. Lock state updates are sent to every client, including for locks held by other
	 * clients, so this is only set by LockObtained which is only sent to the client that requested it
	 */
	#ownsLock = false
	/**
	 * Whether we have asked for the lock, and are waiting for it. The atem queues lock requests and grants them once
	 * the holder releases it, so a request must be cancelled if we no longer want it, or we will be given a lock that
	 * nothing will release
	 */
	#lockRequested = false

	constructor(storeId: number, sendLockCommand: (cmd: LockStateCommand) => void, options: DataTransferQueueOptions) {
		super(options)

		this.#storeId = storeId
		this.#sendLockCommand = sendLockCommand
	}

	protected async startTransfer(transfer: DataTransfer<any>, transferId: number): Promise<ProgressTransferResult> {
		debug(`Starting transfer ${transferId} (Already locked = ${this.#ownsLock})`)
		if (this.#ownsLock) {
			// Get the transfer going immediately
			return transfer.startTransfer(transferId)
		} else {
			// We need to lock the pool first. A request is still queued with the atem if a previous transfer was aborted while waiting
			if (!this.#lockRequested) {
				this.#lockRequested = true
				this.#sendLockCommand(new LockStateCommand(this.#storeId, true))
			}

			return {
				newState: DataTransferState.Pending,
				commands: [],
			}
		}
	}

	/** We have obtained the lock! */
	public lockObtained(): void {
		if (!this.#lockRequested) {
			// Not something we asked for, so it must be a lock taken manually through this connection. Leave that alone
			debug(`Ignoring lock ${this.#storeId} that we did not request`)
			return
		}

		this.#ownsLock = true
		this.#lockRequested = false

		if (!this.activeTransfer) {
			// The transfer which wanted the lock was aborted while waiting for it, so give it back
			this.transferCompleted()
			return
		}

		// Get the transfer started
		this.tryStartTransfer()
	}

	/** The status of the lock has changed. This could be for a lock held by another client */
	public updateLock(locked: boolean): void {
		// Ownership is given up as soon as the unlock is sent, so an unlock reported while we still own it was unexpected.
		// Any other change is for another client, or confirming our own unlock, so can be ignored
		if (!locked && this.#ownsLock) {
			this.#ownsLock = false
			this.tryAbortTransfer(new Error('Lost lock mid-transfer'))
		}
	}

	protected transferCompleted(): void {
		if ((this.#ownsLock || this.#lockRequested) && !this.taskQueue.length) {
			// unlock only when queue is empty. This also cancels a request that is still waiting for the lock

			debug(`Completing transfer (Owned lock = ${this.#ownsLock})`)

			this.#ownsLock = false
			this.#lockRequested = false

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
