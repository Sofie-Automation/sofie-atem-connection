import { DeserializedCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'
import { UpstreamKeyerBase } from '../../../state/video/upstreamKeyers.js'

export class MixEffectKeyPropertiesGetCommand extends DeserializedCommand<UpstreamKeyerBase> {
	public static readonly rawName = 'KeBP'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, keyer: number, properties: UpstreamKeyerBase) {
		super(properties)

		this.mixEffect = mixEffect
		this.upstreamKeyerId = keyer
	}

	public static deserialize(rawCommand: Buffer): MixEffectKeyPropertiesGetCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const keyer = rawCommand.readUInt8(1)
		const properties = {
			upstreamKeyerId: keyer,
			mixEffectKeyType: rawCommand.readUInt8(2),
			canFlyKey: rawCommand.readUInt8(4) === 1,
			flyEnabled: rawCommand.readUInt8(5) === 1,
			fillSource: rawCommand.readUInt16BE(6),
			cutSource: rawCommand.readUInt16BE(8),
			maskSettings: {
				maskEnabled: rawCommand.readUInt8(10) === 1,
				maskTop: rawCommand.readInt16BE(12),
				maskBottom: rawCommand.readInt16BE(14),
				maskLeft: rawCommand.readInt16BE(16),
				maskRight: rawCommand.readInt16BE(18),
			},
		}

		return new MixEffectKeyPropertiesGetCommand(mixEffect, keyer, properties)
	}

	public applyToState(state: AtemState): string {
		const meInfo = state.info.mixEffects[this.mixEffect]
		if (!meInfo || this.upstreamKeyerId >= meInfo.keyCount) {
			throw new InvalidIdError('UpstreamKeyer', this.mixEffect, this.upstreamKeyerId)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		mixEffect.upstreamKeyers[this.properties.upstreamKeyerId] = {
			...AtemStateUtil.getUpstreamKeyer(mixEffect, this.properties.upstreamKeyerId),
			...this.properties,
		}
		return `video.mixEffects.${this.mixEffect}.upstreamKeyers.${this.properties.upstreamKeyerId}`
	}
}
