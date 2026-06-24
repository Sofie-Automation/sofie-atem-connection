import { WritableCommand, DeserializedCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'
import { TransitionProperties } from '../../../state/video/index.js'
import { OmitReadonly } from '../../../lib/types.js'
import { combineComponents, getComponents } from '../../../lib/atemUtil.js'

export class TransitionPropertiesCommand extends WritableCommand<OmitReadonly<TransitionProperties>> {
	public static MaskFlags = {
		nextStyle: 1 << 0,
		nextSelection: 1 << 1,
	}

	public static readonly rawName = 'CTTp'

	public readonly mixEffect: number

	constructor(mixEffect: number) {
		super()

		this.mixEffect = mixEffect
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.flag, 0)

		buffer.writeUInt8(this.mixEffect, 1)
		buffer.writeUInt8(this.properties.nextStyle || 0, 2)
		buffer.writeUInt8(combineComponents(this.properties.nextSelection || []), 3)

		return buffer
	}
}

export class TransitionPropertiesUpdateCommand extends DeserializedCommand<TransitionProperties> {
	public static readonly rawName = 'TrSS'

	public readonly mixEffect: number

	constructor(mixEffect: number, properties: TransitionProperties) {
		super(properties)

		this.mixEffect = mixEffect
	}

	public static deserialize(rawCommand: Buffer): TransitionPropertiesUpdateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const properties = {
			style: rawCommand.readUInt8(1),
			selection: getComponents(rawCommand.readUInt8(2)),
			nextStyle: rawCommand.readUInt8(3),
			nextSelection: getComponents(rawCommand.readUInt8(4)),
		}

		return new TransitionPropertiesUpdateCommand(mixEffect, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.mixEffect >= state.info.capabilities.mixEffects) {
			throw new InvalidIdError('MixEffect', this.mixEffect)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		mixEffect.transitionProperties = {
			...this.properties,
		}
		return `video.mixEffects.${this.mixEffect}.transitionProperties`
	}
}
