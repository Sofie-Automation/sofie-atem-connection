import { BasicWritableCommand, DeserializedCommand } from '../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state/index.js'
import { InputSource } from './PreviewInputCommand.js'

export class ProgramInputCommand extends BasicWritableCommand<InputSource> {
	public static readonly rawName = 'CPgI'

	public readonly mixEffect: number

	constructor(mixEffect: number, source: number) {
		super({ source })

		this.mixEffect = mixEffect
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.mixEffect, 0)
		buffer.writeUInt16BE(this.properties.source, 2)
		return buffer
	}
}

export class ProgramInputUpdateCommand extends DeserializedCommand<InputSource> {
	public static readonly rawName = 'PrgI'

	public readonly mixEffect: number

	constructor(mixEffect: number, properties: InputSource) {
		super(properties)

		this.mixEffect = mixEffect
	}

	public static deserialize(rawCommand: Buffer): ProgramInputUpdateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const properties = {
			source: rawCommand.readUInt16BE(2),
		}

		return new ProgramInputUpdateCommand(mixEffect, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.mixEffect >= state.info.capabilities.mixEffects) {
			throw new InvalidIdError('MixEffect', this.mixEffect)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		mixEffect.programInput = this.properties.source
		return `video.mixEffects.${this.mixEffect}.programInput`
	}
}
