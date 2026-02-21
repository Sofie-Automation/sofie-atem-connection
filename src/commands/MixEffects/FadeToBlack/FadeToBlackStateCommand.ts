import { DeserializedCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'

export interface FadeToBlackProps {
	isFullyBlack: boolean
	inTransition: boolean
	remainingFrames: number
}

export class FadeToBlackStateCommand extends DeserializedCommand<FadeToBlackProps> {
	public static readonly rawName = 'FtbS'

	public readonly mixEffect: number

	constructor(mixEffect: number, properties: FadeToBlackProps) {
		super(properties)

		this.mixEffect = mixEffect
	}

	public static deserialize(rawCommand: Buffer): FadeToBlackStateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const properties = {
			isFullyBlack: rawCommand.readUInt8(1) === 1,
			inTransition: rawCommand.readUInt8(2) === 1,
			remainingFrames: rawCommand.readUInt8(3),
		}

		return new FadeToBlackStateCommand(mixEffect, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.mixEffect >= state.info.capabilities.mixEffects) {
			throw new InvalidIdError('MixEffect', this.mixEffect)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		mixEffect.fadeToBlack = {
			rate: 0,
			...mixEffect.fadeToBlack,
			...this.properties,
		}
		return `video.mixEffects.${this.mixEffect}.fadeToBlack`
	}
}
