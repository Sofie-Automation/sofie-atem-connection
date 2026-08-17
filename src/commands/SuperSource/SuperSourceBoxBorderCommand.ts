import { DeserializedCommand, WritableCommand } from '../CommandBase'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state'
import { SuperSourceBoxBorder } from '../../state/video/superSource'
import { ProtocolVersion } from '../../enums'

/**
 * Reports the per-box SuperSource border on the Constellation HD range and
 * newer (firmware 9.6.0+). See {@link SuperSourceBoxBorderCommand} for the
 * write side.
 */
export class SuperSourceBoxBorderUpdateCommand extends DeserializedCommand<{
	ssrcId: number
	boxId: number
	border: SuperSourceBoxBorder
}> {
	public static readonly rawName = 'SSSB'
	public static readonly minimumVersion = ProtocolVersion.V9_6

	public static deserialize(rawCommand: Buffer): SuperSourceBoxBorderUpdateCommand {
		return new SuperSourceBoxBorderUpdateCommand({
			ssrcId: rawCommand.readUInt8(0),
			boxId: rawCommand.readUInt8(1),
			border: {
				borderEnabled: rawCommand.readUInt8(2) === 1,
				borderWidthOutVertical: rawCommand.readUInt16BE(4),
				borderWidthOutHorizontal: rawCommand.readUInt16BE(6),
				borderWidthInLeft: rawCommand.readUInt16BE(8),
				borderWidthInRight: rawCommand.readUInt16BE(10),
				borderWidthInTop: rawCommand.readUInt16BE(12),
				borderWidthInBottom: rawCommand.readUInt16BE(14),
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
		const box = AtemStateUtil.getSuperSourceBox(supersource, this.properties.boxId)
		box.border = this.properties.border

		return `video.superSources.${this.properties.ssrcId}.boxes.${this.properties.boxId}.border`
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
