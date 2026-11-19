import { WritableCommand, DeserializedCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'
import { WipeTransitionSettings } from '../../../state/video/index.js'

export class TransitionWipeCommand extends WritableCommand<WipeTransitionSettings> {
	public static MaskFlags = {
		rate: 1 << 0,
		pattern: 1 << 1,
		borderWidth: 1 << 2,
		borderInput: 1 << 3,
		symmetry: 1 << 4,
		borderSoftness: 1 << 5,
		xPosition: 1 << 6,
		yPosition: 1 << 7,
		reverseDirection: 1 << 8,
		flipFlop: 1 << 9,
	}

	public static readonly rawName = 'CTWp'

	public readonly mixEffect: number

	constructor(mixEffect: number) {
		super()

		this.mixEffect = mixEffect
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(20)
		buffer.writeUInt16BE(this.flag, 0)

		buffer.writeUInt8(this.mixEffect, 2)
		buffer.writeUInt8(this.properties.rate || 0, 3)
		buffer.writeUInt8(this.properties.pattern || 0, 4)

		buffer.writeUInt16BE(this.properties.borderWidth || 0, 6)
		buffer.writeUInt16BE(this.properties.borderInput || 0, 8)
		buffer.writeUInt16BE(this.properties.symmetry || 0, 10)

		buffer.writeUInt16BE(this.properties.borderSoftness || 0, 12)
		buffer.writeUInt16BE(this.properties.xPosition || 0, 14)
		buffer.writeUInt16BE(this.properties.yPosition || 0, 16)
		buffer.writeUInt8(this.properties.reverseDirection ? 1 : 0, 18)
		buffer.writeUInt8(this.properties.flipFlop ? 1 : 0, 19)

		return buffer
	}
}

export class TransitionWipeUpdateCommand extends DeserializedCommand<WipeTransitionSettings> {
	public static readonly rawName = 'TWpP'

	public readonly mixEffect: number

	constructor(mixEffect: number, properties: WipeTransitionSettings) {
		super(properties)

		this.mixEffect = mixEffect
	}

	public static deserialize(rawCommand: Buffer): TransitionWipeUpdateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const properties = {
			rate: rawCommand.readUInt8(1),
			pattern: rawCommand.readUInt8(2),
			borderWidth: rawCommand.readUInt16BE(4),
			borderInput: rawCommand.readUInt16BE(6),
			symmetry: rawCommand.readUInt16BE(8),
			borderSoftness: rawCommand.readUInt16BE(10),
			xPosition: rawCommand.readUInt16BE(12),
			yPosition: rawCommand.readUInt16BE(14),
			reverseDirection: rawCommand.readUInt8(16) === 1,
			flipFlop: rawCommand.readUInt8(17) === 1,
		}

		return new TransitionWipeUpdateCommand(mixEffect, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.mixEffect >= state.info.capabilities.mixEffects) {
			throw new InvalidIdError('MixEffect', this.mixEffect)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		mixEffect.transitionSettings.wipe = {
			...this.properties,
		}
		return `video.mixEffects.${this.mixEffect}.transitionSettings.wipe`
	}
}
