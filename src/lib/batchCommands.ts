import type { IBasicAtem } from '../atem'
import type { ProtocolVersion } from '../enums'
import type { ISerializableCommand } from '../commands'
import { AtemCommandSender } from './atemCommands'

/**
 * A simple command batcher for the ATEM.
 * This class allows you to queue commands and send them all at once.
 */
export class AtemCommandBatch extends AtemCommandSender<void> {
	readonly #client: IBasicAtem

	#queuedCommands: ISerializableCommand[] = []

	protected get apiVersion(): ProtocolVersion | undefined {
		return this.#client.state?.info?.apiVersion
	}

	constructor(client: IBasicAtem) {
		super()

		this.#client = client
	}

	async sendQueued(): Promise<void> {
		const commands = this.#queuedCommands
		this.#queuedCommands = []

		return this.#client.sendCommands(commands)
	}

	protected sendCommand(command: ISerializableCommand): void {
		this.#queuedCommands.push(command)
	}
}
