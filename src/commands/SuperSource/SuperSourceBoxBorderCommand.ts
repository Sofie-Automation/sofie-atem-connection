import { DeserializedCommand, WritableCommand } from '../CommandBase'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state'
import { SuperSourceBorder, SuperSourceBoxBorder } from '../../state/video/superSource'
import { ProtocolVersion, BorderBevel } from '../../enums'

/**
 * Reports the per-box SuperSource border on the Constellation HD range and
 * newer (firmware 9.6.0+). See {@link SuperSourceBoxBorderCommand} for the
 * write side.
 *
 * NOTE: this parser collapses the six real width fields into
 * borderOuterWidth/borderInnerWidth and is lossy for asymmetric borders.
 */
export class SuperSourceBoxBorderUpdateCommand extends DeserializedCommand<{
	ssrcId: number
	boxId: number
	border: Pick<
		SuperSourceBorder,
		'borderEnabled' | 'borderOuterWidth' | 'borderInnerWidth' | 'borderHue' | 'borderSaturation' | 'borderLuma'
	>
}> {
	public static readonly rawName = 'SSSB'
	public static readonly minimumVersion = ProtocolVersion.V9_6

	public static deserialize(rawCommand: Buffer): SuperSourceBoxBorderUpdateCommand {
		const rawOuterWidth = rawCommand.readUInt16BE(4)
		const rawInnerWidth = rawCommand.readUInt16BE(8)

		return new SuperSourceBoxBorderUpdateCommand({
			ssrcId: rawCommand.readUInt8(0),
			boxId: rawCommand.readUInt8(1),
			border: {
				borderEnabled: rawCommand.readUInt8(2) === 1,
				borderOuterWidth: Math.round((rawOuterWidth * 1600) / 0xffff),
				borderInnerWidth: Math.round((rawInnerWidth * 1600) / 0xffff),
				borderHue: rawCommand.readUInt16BE(16),
				borderSaturation: rawCommand.readUInt16BE(18),
				borderLuma: rawCommand.readUInt16BE(20),
			},
		})
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.properties.ssrcId >= state.info.capabilities.superSources) {
			throw new InvalidIdError('SuperSource', this.properties.ssrcId)
		}

		const supersource = AtemStateUtil.getSuperSource(state, this.properties.ssrcId)
		const previous = supersource.border

		supersource.border = {
			// Fields this packet doesn't carry: keep whatever was already known,
			// or fall back to a neutral default (0, ie no bevel/softness/offset).
			borderBevel: previous?.borderBevel ?? BorderBevel.None,
			borderOuterSoftness: previous?.borderOuterSoftness ?? 0,
			borderInnerSoftness: previous?.borderInnerSoftness ?? 0,
			borderBevelSoftness: previous?.borderBevelSoftness ?? 0,
			borderBevelPosition: previous?.borderBevelPosition ?? 0,
			borderLightSourceDirection: previous?.borderLightSourceDirection ?? 0,
			borderLightSourceAltitude: previous?.borderLightSourceAltitude ?? 0,
			// Fields this packet does carry: always take the fresh value.
			...this.properties.border,
		}

		return `video.superSources.${this.properties.ssrcId}.border`
	}
}

/**
 * Sets the per-box SuperSource border on the ATEM Constellation HD range and
 * newer (firmware 9.6.0+); {@link SuperSourceBoxBorderUpdateCommand} reports
 * it back. Older models use {@link SuperSourceBorderCommand} instead - the two
 * ranges each ignore the other's command.
 */
export class SuperSourceBoxBorderCommand extends WritableCommand<SuperSourceBoxBorder> {
	public static MaskFlags = {
		borderEnabled: 1 << 0,
		borderWidthOutVertical: 1 << 1,
		borderWidthOutHorizontal: 1 << 2,
		borderWidthInLeft: 1 << 3,
		borderWidthInRight: 1 << 4,
		borderWidthInTop: 1 << 5,
		borderWidthInBottom: 1 << 6,
		borderHue: 1 << 7,
		borderSaturation: 1 << 8,
		borderLuma: 1 << 9,
	}

	public static readonly rawName = 'CSSB'
	public static readonly minimumVersion = ProtocolVersion.V9_6

	public readonly ssrcId: number
	public readonly boxId: number

	constructor(ssrcId: number, boxId: number) {
		super()

		this.ssrcId = ssrcId
		this.boxId = boxId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(24)

		buffer.writeUInt16BE(this.flag, 0)
		buffer.writeUInt8(this.ssrcId, 2)
		buffer.writeUInt8(this.boxId, 3)
		buffer.writeUInt8(this.properties.borderEnabled ? 1 : 0, 4)
		// byte 5: padding for 2-byte alignment

		buffer.writeUInt16BE(this.properties.borderWidthOutVertical || 0, 6)
		buffer.writeUInt16BE(this.properties.borderWidthOutHorizontal || 0, 8)
		buffer.writeUInt16BE(this.properties.borderWidthInLeft || 0, 10)
		buffer.writeUInt16BE(this.properties.borderWidthInRight || 0, 12)
		buffer.writeUInt16BE(this.properties.borderWidthInTop || 0, 14)
		buffer.writeUInt16BE(this.properties.borderWidthInBottom || 0, 16)
		buffer.writeUInt16BE(this.properties.borderHue || 0, 18)
		buffer.writeUInt16BE(this.properties.borderSaturation || 0, 20)
		buffer.writeUInt16BE(this.properties.borderLuma || 0, 22)

		return buffer
	}
}
