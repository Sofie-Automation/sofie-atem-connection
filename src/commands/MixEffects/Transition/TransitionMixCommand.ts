import { DeserializedCommand, BasicWritableCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'
import { MixTransitionSettings } from '../../../state/video/index.js'

export class TransitionMixCommand extends BasicWritableCommand<MixTransitionSettings> {
	public static readonly rawName = 'CTMx'

	public readonly mixEffect: number

	constructor(mixEffect: number, rate: number) {
		super({ rate })

		this.mixEffect = mixEffect
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.mixEffect, 0)
		buffer.writeUInt8(this.properties.rate || 0, 1)
		return buffer
	}
}

export class TransitionMixUpdateCommand extends DeserializedCommand<MixTransitionSettings> {
	public static readonly rawName = 'TMxP'

	public readonly mixEffect: number

	constructor(mixEffect: number, properties: MixTransitionSettings) {
		super(properties)

		this.mixEffect = mixEffect
	}

	public static deserialize(rawCommand: Buffer): TransitionMixUpdateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const properties = {
			rate: rawCommand.readUInt8(1),
		}

		return new TransitionMixUpdateCommand(mixEffect, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.mixEffect >= state.info.capabilities.mixEffects) {
			throw new InvalidIdError('MixEffect', this.mixEffect)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		mixEffect.transitionSettings.mix = {
			...this.properties,
		}
		return `video.mixEffects.${this.mixEffect}.transitionSettings.mix`
	}
}
