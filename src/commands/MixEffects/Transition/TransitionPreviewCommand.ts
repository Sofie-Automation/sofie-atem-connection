import { BasicWritableCommand, DeserializedCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'

export interface PreviewProps {
	preview: boolean
}

export class PreviewTransitionCommand extends BasicWritableCommand<PreviewProps> {
	public static readonly rawName = 'CTPr'

	public readonly mixEffect: number

	constructor(mixEffect: number, preview: boolean) {
		super({ preview })

		this.mixEffect = mixEffect
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.mixEffect, 0)
		buffer.writeUInt8(this.properties.preview ? 1 : 0, 1)
		return buffer
	}
}

export class PreviewTransitionUpdateCommand extends DeserializedCommand<PreviewProps> {
	public static readonly rawName = 'TrPr'

	public readonly mixEffect: number

	constructor(mixEffect: number, properties: PreviewProps) {
		super(properties)

		this.mixEffect = mixEffect
	}

	public static deserialize(rawCommand: Buffer): PreviewTransitionUpdateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const properties = {
			preview: rawCommand.readUInt8(1) === 1,
		}

		return new PreviewTransitionUpdateCommand(mixEffect, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.mixEffect >= state.info.capabilities.mixEffects) {
			throw new InvalidIdError('MixEffect', this.mixEffect)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		mixEffect.transitionPreview = this.properties.preview
		return `video.mixEffects.${this.mixEffect}.transitionPreview`
	}
}
