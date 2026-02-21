import { WritableCommand, DeserializedCommand } from '../../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../../state/index.js'
import { UpstreamKeyerDVESettings } from '../../../state/video/upstreamKeyers.js'

export class MixEffectKeyDVECommand extends WritableCommand<UpstreamKeyerDVESettings> {
	public static MaskFlags = {
		sizeX: 1 << 0,
		sizeY: 1 << 1,
		positionX: 1 << 2,
		positionY: 1 << 3,
		rotation: 1 << 4,
		borderEnabled: 1 << 5,
		shadowEnabled: 1 << 6,
		borderBevel: 1 << 7,
		borderOuterWidth: 1 << 8,
		borderInnerWidth: 1 << 9,
		borderOuterSoftness: 1 << 10,
		borderInnerSoftness: 1 << 11,
		borderBevelSoftness: 1 << 12,
		borderBevelPosition: 1 << 13,
		borderOpacity: 1 << 14,
		borderHue: 1 << 15,
		borderSaturation: 1 << 16,
		borderLuma: 1 << 17,
		lightSourceDirection: 1 << 18,
		lightSourceAltitude: 1 << 19,
		maskEnabled: 1 << 20,
		maskTop: 1 << 21,
		maskBottom: 1 << 22,
		maskLeft: 1 << 23,
		maskRight: 1 << 24,
		rate: 1 << 25,
	}
	public static readonly rawName = 'CKDV'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, upstreamKeyerId: number) {
		super()

		this.mixEffect = mixEffect
		this.upstreamKeyerId = upstreamKeyerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(64)
		buffer.writeUInt32BE(this.flag, 0)
		buffer.writeUInt8(this.mixEffect, 4)
		buffer.writeUInt8(this.upstreamKeyerId, 5)

		buffer.writeUInt32BE(this.properties.sizeX || 0, 8)
		buffer.writeUInt32BE(this.properties.sizeY || 0, 12)
		buffer.writeInt32BE(this.properties.positionX || 0, 16)
		buffer.writeInt32BE(this.properties.positionY || 0, 20)
		buffer.writeInt32BE(this.properties.rotation || 0, 24)

		buffer.writeUInt8(this.properties.borderEnabled ? 1 : 0, 28)
		buffer.writeUInt8(this.properties.shadowEnabled ? 1 : 0, 29)
		buffer.writeUInt8(this.properties.borderBevel || 0, 30)
		buffer.writeUInt16BE(this.properties.borderOuterWidth || 0, 32)
		buffer.writeUInt16BE(this.properties.borderInnerWidth || 0, 34)
		buffer.writeUInt8(this.properties.borderOuterSoftness || 0, 36)
		buffer.writeUInt8(this.properties.borderInnerSoftness || 0, 37)
		buffer.writeUInt8(this.properties.borderBevelSoftness || 0, 38)
		buffer.writeUInt8(this.properties.borderBevelPosition || 0, 39)
		buffer.writeUInt8(this.properties.borderOpacity || 0, 40)

		buffer.writeUInt16BE(this.properties.borderHue || 0, 42)
		buffer.writeUInt16BE(this.properties.borderSaturation || 0, 44)
		buffer.writeUInt16BE(this.properties.borderLuma || 0, 46)

		buffer.writeUInt16BE(this.properties.lightSourceDirection || 0, 48)
		buffer.writeUInt8(this.properties.lightSourceAltitude || 0, 50)

		buffer.writeUInt8(this.properties.maskEnabled ? 1 : 0, 51)
		buffer.writeUInt16BE(this.properties.maskTop || 0, 52)
		buffer.writeUInt16BE(this.properties.maskBottom || 0, 54)
		buffer.writeUInt16BE(this.properties.maskLeft || 0, 56)
		buffer.writeUInt16BE(this.properties.maskRight || 0, 58)

		buffer.writeUInt8(this.properties.rate || 0, 60)

		return buffer
	}
}

export class MixEffectKeyDVEUpdateCommand extends DeserializedCommand<UpstreamKeyerDVESettings> {
	public static readonly rawName = 'KeDV'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, upstreamKeyerId: number, properties: UpstreamKeyerDVESettings) {
		super(properties)

		this.mixEffect = mixEffect
		this.upstreamKeyerId = upstreamKeyerId
	}

	public static deserialize(rawCommand: Buffer): MixEffectKeyDVEUpdateCommand {
		const mixEffect = rawCommand.readUInt8(0)
		const upstreamKeyerId = rawCommand.readUInt8(1)
		const properties = {
			// Note: these are higher than the ui shows, but are within the range the atem can be set to
			sizeX: rawCommand.readUInt32BE(4),
			sizeY: rawCommand.readUInt32BE(8),

			positionX: rawCommand.readInt32BE(12),
			positionY: rawCommand.readInt32BE(16),
			rotation: rawCommand.readInt32BE(20),

			borderEnabled: rawCommand.readUInt8(24) === 1,
			shadowEnabled: rawCommand.readUInt8(25) === 1,
			borderBevel: rawCommand.readUInt8(26),
			borderOuterWidth: rawCommand.readUInt16BE(28),
			borderInnerWidth: rawCommand.readUInt16BE(30),
			borderOuterSoftness: rawCommand.readInt8(32),
			borderInnerSoftness: rawCommand.readInt8(33),
			borderBevelSoftness: rawCommand.readInt8(34),
			borderBevelPosition: rawCommand.readInt8(35),

			borderOpacity: rawCommand.readInt8(36),
			borderHue: rawCommand.readUInt16BE(38),
			borderSaturation: rawCommand.readUInt16BE(40),
			borderLuma: rawCommand.readUInt16BE(42),

			lightSourceDirection: rawCommand.readUInt16BE(44),
			lightSourceAltitude: rawCommand.readUInt8(46),

			maskEnabled: rawCommand.readUInt8(47) === 1,
			maskTop: rawCommand.readUInt16BE(48),
			maskBottom: rawCommand.readUInt16BE(50),
			maskLeft: rawCommand.readUInt16BE(52),
			maskRight: rawCommand.readUInt16BE(54),

			rate: rawCommand.readUInt8(56),
		}

		return new MixEffectKeyDVEUpdateCommand(mixEffect, upstreamKeyerId, properties)
	}

	public applyToState(state: AtemState): string {
		const meInfo = state.info.mixEffects[this.mixEffect]
		if (!meInfo || this.upstreamKeyerId >= meInfo.keyCount) {
			throw new InvalidIdError('UpstreamKeyer', this.mixEffect, this.upstreamKeyerId)
		} else if (!state.info.capabilities || !state.info.capabilities.DVEs) {
			throw new InvalidIdError(`DVE is not supported`)
		}

		const mixEffect = AtemStateUtil.getMixEffect(state, this.mixEffect)
		const upstreamKeyer = AtemStateUtil.getUpstreamKeyer(mixEffect, this.upstreamKeyerId)
		upstreamKeyer.dveSettings = {
			...this.properties,
		}
		return `video.mixEffects.${this.mixEffect}.upstreamKeyers.${this.upstreamKeyerId}.dveSettings`
	}
}
