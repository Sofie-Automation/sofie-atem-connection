import { WritableCommand, DeserializedCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'
import { UpstreamKeyerLumaSettings } from '../../../state/video/upstreamKeyers.js'

export class MixEffectKeyLumaCommand extends WritableCommand<UpstreamKeyerLumaSettings> {
	public static MaskFlags = {
		preMultiplied: 1 << 0,
		clip: 1 << 1,
		gain: 1 << 2,
		invert: 1 << 3,
	}
	public static readonly rawName = 'CKLm'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, upstreamKeyerId: number) {
		super()

		this.mixEffect = mixEffect
		this.upstreamKeyerId = upstreamKeyerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(12)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.mixEffect, 1)
		buffer.writeUInt8(this.upstreamKeyerId, 2)

		buffer.writeUInt8(this.properties.preMultiplied ? 1 : 0, 3)
		buffer.writeUInt16BE(this.properties.clip || 0, 4)
		buffer.writeUInt16BE(this.properties.gain || 0, 6)
		buffer.writeUInt8(this.properties.invert ? 1 : 0, 8)

		return buffer
	}
}

export class MixEffectKeyLumaUpdateCommand extends DeserializedCommand<UpstreamKeyerLumaSettings> {
	public static readonly rawName = 'KeLm'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, upstreamKeyerId: number, properties: UpstreamKeyerLumaSettings) {
		super(properties)

		this.mixEffect = mixEffect
		this.upstreamKeyerId = upstreamKeyerId
	}

	public static deserialize(rawCommand: Buffer): MixEffectKeyLumaUpdateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const upstreamKeyerId = rawCommand.readUInt8(1)
		const properties = {
			preMultiplied: rawCommand.readUInt8(2) === 1,
			clip: rawCommand.readUInt16BE(4),
			gain: rawCommand.readUInt16BE(6),
			invert: rawCommand.readUInt8(8) === 1,
		}

		return new MixEffectKeyLumaUpdateCommand(mixEffect, upstreamKeyerId, properties)
	}

	public applyToState(state: AtemState): string {
		const meInfo = state.info.mixEffects[this.mixEffect]
		if (!meInfo || this.upstreamKeyerId >= meInfo.keyCount) {
			throw new InvalidIdError('UpstreamKeyer', this.mixEffect, this.upstreamKeyerId)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		const upstreamKeyer = AtemStateUtil.getUpstreamKeyer(mixEffect, this.upstreamKeyerId)
		upstreamKeyer.lumaSettings = {
			...this.properties,
		}
		return `video.mixEffects.${this.mixEffect}.upstreamKeyers.${this.upstreamKeyerId}.lumaSettings`
	}
}
