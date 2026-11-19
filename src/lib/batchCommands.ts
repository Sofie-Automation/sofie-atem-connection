import type { IBasicAtem } from '../atem.js'
import type { ProtocolVersion } from '../enums/index.js'
import type { ISerializableCommand } from '../commands/index.js'
import { AtemCommandSenderMixin } from './atemCommands.js'

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
export class AtemCommandBatch extends AtemCommandSenderMixin<void, typeof AtemCommandBatchBase>(
	AtemCommandBatchBase,
	() => undefined
) {}

/**
 * Holds the collected commands for an {@link AtemCommandCollector}.
 * The command-building methods are added by {@link AtemCommandSenderMixin}.
 *
 * Exported so that declaration emit can name it as the base of {@link AtemCommandCollector}
 * (which extends it through the mixin). Not intended to be used directly.
 */
export class AtemCommandCollectorBase {
	#commands: ISerializableCommand[] = []

	/**
	 * @param apiVersion The protocol version to build commands for, which decides between version specific commands
	 */
	constructor(public readonly apiVersion: ProtocolVersion) {}

	/** Return the collected commands, and empty the list */
	public takeCommands(): ISerializableCommand[] {
		const commands = this.#commands
		this.#commands = []
		return commands
	}

	public sendCommand(command: ISerializableCommand): void {
		this.#commands.push(command)
	}

	public sendCommands(commands: ISerializableCommand[]): void {
		this.#commands.push(...commands)
	}
}

/**
 * Builds commands with the same helpers as `Atem`, without needing a connection, collecting them into an array.
 * This is useful for computing the commands to send elsewhere, such as when diffing states.
 */
export class AtemCommandCollector extends AtemCommandSenderMixin<void, typeof AtemCommandCollectorBase>(
	AtemCommandCollectorBase,
	() => undefined
) {}
