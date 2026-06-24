import { WritableCommand, DeserializedCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'
import { StingerTransitionSettings } from '../../../state/video/index.js'

export class TransitionStingerCommand extends WritableCommand<StingerTransitionSettings> {
	public static MaskFlags = {
		source: 1 << 0,
		preMultipliedKey: 1 << 1,
		clip: 1 << 2,
		gain: 1 << 3,
		invert: 1 << 4,
		preroll: 1 << 5,
		clipDuration: 1 << 6,
		triggerPoint: 1 << 7,
		mixRate: 1 << 8,
	}

	public static readonly rawName = 'CTSt'

	public readonly mixEffect: number

	constructor(mixEffect: number) {
		super()

		this.mixEffect = mixEffect
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(20)
		buffer.writeUInt16BE(this.flag, 0)

		buffer.writeUInt8(this.mixEffect, 2)
		buffer.writeUInt8(this.properties.source || 0, 3)
		buffer.writeUInt8(this.properties.preMultipliedKey ? 1 : 0, 4)

		buffer.writeUInt16BE(this.properties.clip || 0, 6)
		buffer.writeUInt16BE(this.properties.gain || 0, 8)
		buffer.writeUInt8(this.properties.invert ? 1 : 0, 10)

		buffer.writeUInt16BE(this.properties.preroll || 0, 12)
		buffer.writeUInt16BE(this.properties.clipDuration || 0, 14)
		buffer.writeUInt16BE(this.properties.triggerPoint || 0, 16)
		buffer.writeUInt16BE(this.properties.mixRate || 0, 18)

		return buffer
	}
}

export class TransitionStingerUpdateCommand extends DeserializedCommand<StingerTransitionSettings> {
	public static readonly rawName = 'TStP'

	public readonly mixEffect: number

	constructor(mixEffect: number, properties: StingerTransitionSettings) {
		super(properties)

		this.mixEffect = mixEffect
	}

	public static deserialize(rawCommand: Buffer): TransitionStingerUpdateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const properties = {
			source: rawCommand.readUInt8(1),
			preMultipliedKey: rawCommand.readUInt8(2) === 1,

			clip: rawCommand.readUInt16BE(4),
			gain: rawCommand.readUInt16BE(6),
			invert: rawCommand.readUInt8(8) === 1,

			preroll: (rawCommand.readUInt8(10) << 8) | rawCommand.readUInt8(11),
			clipDuration: (rawCommand.readUInt8(12) << 8) | rawCommand.readUInt8(13),
			triggerPoint: (rawCommand.readUInt8(14) << 8) | rawCommand.readUInt8(15),
			mixRate: (rawCommand.readUInt8(16) << 8) | rawCommand.readUInt8(17),
		}

		return new TransitionStingerUpdateCommand(mixEffect, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.mixEffect >= state.info.capabilities.mixEffects) {
			throw new InvalidIdError('MixEffect', this.mixEffect)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		mixEffect.transitionSettings.stinger = {
			...this.properties,
		}
		return `video.mixEffects.${this.mixEffect}.transitionSettings.stinger`
	}
}
