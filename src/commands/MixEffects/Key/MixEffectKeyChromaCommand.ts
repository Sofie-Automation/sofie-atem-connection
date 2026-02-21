import { WritableCommand, DeserializedCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'
import { UpstreamKeyerChromaSettings } from '../../../state/video/upstreamKeyers.js'

export class MixEffectKeyChromaCommand extends WritableCommand<UpstreamKeyerChromaSettings> {
	public static MaskFlags = {
		hue: 1 << 0,
		gain: 1 << 1,
		ySuppress: 1 << 2,
		lift: 1 << 3,
		narrow: 1 << 4,
	}
	public static readonly rawName = 'CKCk'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, upstreamKeyerId: number) {
		super()

		this.mixEffect = mixEffect
		this.upstreamKeyerId = upstreamKeyerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(16)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.mixEffect, 1)
		buffer.writeUInt8(this.upstreamKeyerId, 2)

		buffer.writeUInt16BE(this.properties.hue || 0, 4)
		buffer.writeUInt16BE(this.properties.gain || 0, 6)
		buffer.writeUInt16BE(this.properties.ySuppress || 0, 8)
		buffer.writeUInt16BE(this.properties.lift || 0, 10)
		buffer.writeUInt8(this.properties.narrow ? 1 : 0, 12)

		return buffer
	}
}

export class MixEffectKeyChromaUpdateCommand extends DeserializedCommand<UpstreamKeyerChromaSettings> {
	public static readonly rawName = 'KeCk'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, upstreamKeyerId: number, properties: UpstreamKeyerChromaSettings) {
		super(properties)

		this.mixEffect = mixEffect
		this.upstreamKeyerId = upstreamKeyerId
	}

	public static deserialize(rawCommand: Buffer): MixEffectKeyChromaUpdateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const upstreamKeyerId = rawCommand.readUInt8(1)
		const properties = {
			hue: rawCommand.readUInt16BE(2),
			gain: rawCommand.readUInt16BE(4),
			ySuppress: rawCommand.readUInt16BE(6),
			lift: rawCommand.readUInt16BE(8),
			narrow: rawCommand.readUInt8(10) === 1,
		}

		return new MixEffectKeyChromaUpdateCommand(mixEffect, upstreamKeyerId, properties)
	}

	public applyToState(state: AtemState): string {
		const meInfo = state.info.mixEffects[this.mixEffect]
		if (!meInfo || this.upstreamKeyerId >= meInfo.keyCount) {
			throw new InvalidIdError('UpstreamKeyer', this.mixEffect, this.upstreamKeyerId)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		const upstreamKeyer = AtemStateUtil.getUpstreamKeyer(mixEffect, this.upstreamKeyerId)
		upstreamKeyer.chromaSettings = {
			...this.properties,
		}
		return `video.mixEffects.${this.mixEffect}.upstreamKeyers.${this.upstreamKeyerId}.chromaSettings`
	}
}
