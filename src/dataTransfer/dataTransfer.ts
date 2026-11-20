import { IDeserializedCommand, ISerializableCommand } from '../commands/CommandBase.js'

export enum DataTransferState {
	/** Waiting for strt */
	Pending,
	/** Started, waiting for first response */
	Ready,
	/** In progress */
	Transferring,
	/** Finished */
	Finished,
}

export abstract class DataTransfer<T> {
	readonly #completionPromise: Promise<T>
	#abortReason: Error | undefined
	protected resolvePromise: (value: T | PromiseLike<T>) => void
	protected rejectPromise: (reason?: any) => void

	constructor() {
		const p = Promise.withResolvers<T>()
		this.#completionPromise = p.promise
		this.resolvePromise = p.resolve
		this.rejectPromise = p.reject
	}

	/** Get the promise that will resolve upon completion/failure of the transfer */
	get promise(): Promise<T> {
		return this.#completionPromise
	}

	/** Start the transfer */
	public abstract startTransfer(transferId: number): Promise<ProgressTransferResult>

	/** Restart the current transfer */
	public async restartTransfer(transferId: number): Promise<ProgressTransferResult> {
		return this.startTransfer(transferId)
	}

	/** Handle a received command that is for the transfer */
	public abstract handleCommand(
		command: IDeserializedCommand,
		oldState: DataTransferState
	): Promise<ProgressTransferResult>

	/** Why the transfer was aborted, if it has been */
	get abortReason(): Error | undefined {
		return this.#abortReason
	}

	/** The current transfer has been aborted and should report failure */
	public abort(reason: Error): void {
		this.#abortReason ??= reason
		this.rejectPromise(reason)
	}
}

export interface ProgressTransferResult {
	newState: DataTransferState
	commands: ISerializableCommand[]
	newId?: number
}
