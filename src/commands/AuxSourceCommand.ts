import { BasicWritableCommand, DeserializedCommand } from './CommandBase.js'
import { AtemState } from '../state/index.js'

export interface AuxSourceProps {
	source: number
}

export class AuxSourceCommand extends BasicWritableCommand<AuxSourceProps> {
	public static readonly rawName = 'CAuS'

	public readonly auxBus: number

	constructor(auxBus: number, source: number) {
		super({ source })

		this.auxBus = auxBus
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(0x01, 0)
		buffer.writeUInt8(this.auxBus, 1)
		buffer.writeUInt16BE(this.properties.source, 2)
		return buffer
	}
}

export class AuxSourceUpdateCommand extends DeserializedCommand<AuxSourceProps> {
	public static readonly rawName = 'AuxS'

	public readonly auxBus: number

	constructor(auxBus: number, properties: AuxSourceProps) {
		super(properties)

		this.auxBus = auxBus
	}

	public static deserialize(rawCommand: Buffer): AuxSourceUpdateCommand {
		const auxBus = rawCommand.readUInt8(0)
		const properties = {
			source: rawCommand.readUInt16BE(2),
		}

		return new AuxSourceUpdateCommand(auxBus, properties)
	}

	public applyToState(state: AtemState): string {
		state.video.auxilliaries[this.auxBus] = this.properties.source
		return `video.auxilliaries.${this.auxBus}`
	}
}
