import type { IBasicAtem } from '../atem'
import type { ProtocolVersion } from '../enums'
import type { ISerializableCommand } from '../commands'
import { AtemCommandSenderMixin } from './atemCommands'

/**
 * Holds the state for a command batch: the queue of commands, and the way to flush them.
 * The command-building methods are added by {@link AtemCommandSenderMixin}.
 *
 * Exported so that declaration emit can name it as the base of {@link AtemCommandBatch}
 * (which extends it through the mixin). Not intended to be used directly.
 */
export class AtemCommandBatchBase {
	readonly #client: IBasicAtem

	#queuedCommands: ISerializableCommand[] = []

	public get apiVersion(): ProtocolVersion | undefined {
		return this.#client.state?.info?.apiVersion
	}

	constructor(client: IBasicAtem) {
		this.#client = client
	}

	/**
	 * Send all of the queued commands to the ATEM.
	 * The queue is emptied before sending, so the batch can be reused afterwards.
	 */
	public async sendQueued(): Promise<void> {
		const commands = this.#queuedCommands
		this.#queuedCommands = []

		return this.#client.sendCommands(commands)
	}

	public sendCommand(command: ISerializableCommand): void {
		this.#queuedCommands.push(command)
	}

	public sendCommands(commands: ISerializableCommand[]): void {
		this.#queuedCommands.push(...commands)
	}
}

/**
 * A simple command batcher for the ATEM.
 * This class allows you to queue commands and send them all at once, in a single batch.
 *
 */
export class AtemCommandBatch extends AtemCommandSenderMixin<void, typeof AtemCommandBatchBase>(AtemCommandBatchBase) {}
