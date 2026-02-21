import { BasicWritableCommand, DeserializedCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'

export class FadeToBlackRateCommand extends BasicWritableCommand<{ rate: number }> {
	public static readonly rawName = 'FtbC'

	public readonly mixEffect: number

	constructor(mixEffect: number, rate: number) {
		super({ rate })

		this.mixEffect = mixEffect
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(1, 0)
		buffer.writeUInt8(this.mixEffect, 1)
		buffer.writeUInt8(this.properties.rate, 2)
		return buffer
	}
}

export class FadeToBlackRateUpdateCommand extends DeserializedCommand<{ rate: number }> {
	public static readonly rawName = 'FtbP'

	public readonly mixEffect: number

	constructor(mixEffect: number, rate: number) {
		super({ rate })

		this.mixEffect = mixEffect
	}

	public static deserialize(rawCommand: Buffer): FadeToBlackRateUpdateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const rate = rawCommand.readUInt8(1)

		return new FadeToBlackRateUpdateCommand(mixEffect, rate)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.mixEffect >= state.info.capabilities.mixEffects) {
			throw new InvalidIdError('MixEffect', this.mixEffect)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		mixEffect.fadeToBlack = {
			isFullyBlack: false,
			inTransition: false,
			remainingFrames: 0,
			...mixEffect.fadeToBlack,
			rate: this.properties.rate,
		}
		return `video.mixEffects.${this.mixEffect}.fadeToBlack`
	}
}
