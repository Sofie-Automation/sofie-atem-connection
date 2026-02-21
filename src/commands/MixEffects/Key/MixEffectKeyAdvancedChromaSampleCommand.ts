import { WritableCommand, DeserializedCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'
import { UpstreamKeyerAdvancedChromaSample } from '../../../state/video/upstreamKeyers.js'

export class MixEffectKeyAdvancedChromaSampleCommand extends WritableCommand<UpstreamKeyerAdvancedChromaSample> {
	public static MaskFlags = {
		enableCursor: 1 << 0,
		preview: 1 << 1,
		cursorX: 1 << 2,
		cursorY: 1 << 3,
		cursorSize: 1 << 4,
		sampledY: 1 << 5,
		sampledCb: 1 << 6,
		sampledCr: 1 << 7,
	}
	public static readonly rawName = 'CACC'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, upstreamKeyerId: number) {
		super()

		this.mixEffect = mixEffect
		this.upstreamKeyerId = upstreamKeyerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(20)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.mixEffect, 1)
		buffer.writeUInt8(this.upstreamKeyerId, 2)

		buffer.writeUInt8(this.properties.enableCursor ? 1 : 0, 3)
		buffer.writeUInt8(this.properties.preview ? 1 : 0, 4)
		buffer.writeInt16BE(this.properties.cursorX || 0, 6)
		buffer.writeInt16BE(this.properties.cursorY || 0, 8)
		buffer.writeUInt16BE(this.properties.cursorSize || 0, 10)

		buffer.writeUInt16BE(this.properties.sampledY || 0, 12)
		buffer.writeInt16BE(this.properties.sampledCb || 0, 14)
		buffer.writeInt16BE(this.properties.sampledCr || 0, 16)

		return buffer
	}
}

export class MixEffectKeyAdvancedChromaSampleUpdateCommand extends DeserializedCommand<UpstreamKeyerAdvancedChromaSample> {
	public static readonly rawName = 'KACC'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, upstreamKeyerId: number, properties: UpstreamKeyerAdvancedChromaSample) {
		super(properties)

		this.mixEffect = mixEffect
		this.upstreamKeyerId = upstreamKeyerId
	}

	public static deserialize(rawCommand: Buffer): MixEffectKeyAdvancedChromaSampleUpdateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const upstreamKeyerId = rawCommand.readUInt8(1)
		const properties: UpstreamKeyerAdvancedChromaSample = {
			enableCursor: rawCommand.readUInt8(2) > 0,
			preview: rawCommand.readUInt8(3) > 0,
			cursorX: rawCommand.readInt16BE(4),
			cursorY: rawCommand.readInt16BE(6),
			cursorSize: rawCommand.readUInt16BE(8),

			sampledY: rawCommand.readUInt16BE(10),
			sampledCb: rawCommand.readInt16BE(12),
			sampledCr: rawCommand.readInt16BE(14),
		}

		return new MixEffectKeyAdvancedChromaSampleUpdateCommand(mixEffect, upstreamKeyerId, properties)
	}

	public applyToState(state: AtemState): string {
		const meInfo = state.info.mixEffects[this.mixEffect]
		if (!meInfo || this.upstreamKeyerId >= meInfo.keyCount) {
			throw new InvalidIdError('UpstreamKeyer', this.mixEffect, this.upstreamKeyerId)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		const upstreamKeyer = AtemStateUtil.getUpstreamKeyer(mixEffect, this.upstreamKeyerId)
		upstreamKeyer.advancedChromaSettings = {
			...upstreamKeyer.advancedChromaSettings,
			sample: this.properties,
		}

		return `video.mixEffects.${this.mixEffect}.upstreamKeyers.${this.upstreamKeyerId}.advancedChromaSettings.sample`
	}
}
