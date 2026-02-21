import { WritableCommand, DeserializedCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'
import { DipTransitionSettings } from '../../../state/video/index.js'

export class TransitionDipCommand extends WritableCommand<DipTransitionSettings> {
	public static MaskFlags = {
		rate: 1 << 0,
		input: 1 << 1,
	}
	public static readonly rawName = 'CTDp'

	public readonly mixEffect: number

	constructor(mixEffect: number) {
		super()

		this.mixEffect = mixEffect
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.mixEffect, 1)
		buffer.writeUInt8(this.properties.rate || 0, 2)
		buffer.writeUInt16BE(this.properties.input || 0, 4)
		return buffer
	}
}

export class TransitionDipUpdateCommand extends DeserializedCommand<DipTransitionSettings> {
	public static readonly rawName = 'TDpP'

	public readonly mixEffect: number

	constructor(mixEffect: number, properties: DipTransitionSettings) {
		super(properties)

		this.mixEffect = mixEffect
	}

	public static deserialize(rawCommand: Buffer): TransitionDipUpdateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const properties = {
			rate: rawCommand.readUInt8(1),
			input: (rawCommand.readUInt8(2) << 8) | (rawCommand.readUInt8(3) & 0xff),
		}

		return new TransitionDipUpdateCommand(mixEffect, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.mixEffect >= state.info.capabilities.mixEffects) {
			throw new InvalidIdError('MixEffect', this.mixEffect)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		mixEffect.transitionSettings.dip = {
			...this.properties,
		}
		return `video.mixEffects.${this.mixEffect}.transitionSettings.dip`
	}
}
