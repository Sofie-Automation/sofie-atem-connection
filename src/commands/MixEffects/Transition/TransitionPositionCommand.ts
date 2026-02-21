import { BasicWritableCommand, DeserializedCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'
import { TransitionPosition } from '../../../state/video/index.js'

export class TransitionPositionCommand extends BasicWritableCommand<Pick<TransitionPosition, 'handlePosition'>> {
	public static readonly rawName = 'CTPs'

	public readonly mixEffect: number

	constructor(mixEffect: number, handlePosition: number) {
		super({ handlePosition })

		this.mixEffect = mixEffect
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.mixEffect, 0)
		buffer.writeUInt16BE(this.properties.handlePosition, 2)
		return buffer
	}
}

export class TransitionPositionUpdateCommand extends DeserializedCommand<TransitionPosition> {
	public static readonly rawName = 'TrPs'

	public readonly mixEffect: number

	constructor(mixEffect: number, properties: TransitionPosition) {
		super(properties)

		this.mixEffect = mixEffect
	}

	public static deserialize(rawCommand: Buffer): TransitionPositionUpdateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const properties = {
			inTransition: rawCommand.readUInt8(1) === 1,
			remainingFrames: rawCommand.readUInt8(2),
			handlePosition: rawCommand.readUInt16BE(4),
		}

		return new TransitionPositionUpdateCommand(mixEffect, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.mixEffect >= state.info.capabilities.mixEffects) {
			throw new InvalidIdError('MixEffect', this.mixEffect)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		mixEffect.transitionPosition = this.properties
		return `video.mixEffects.${this.mixEffect}.transitionPosition`
	}
}
