import { DeserializedCommand } from '../CommandBase'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state'
import { SuperSourceBorder } from '../../state/video/superSource'
import { ProtocolVersion, BorderBevel } from '../../enums'

/**
 * Reverse-engineered command, NOT part of the documented ATEM protocol used
 * elsewhere in this library.
 *
 * Some units (confirmed on an ATEM 4 M/E Constellation HD, model 20,
 * apiVersion 0x00020020 / ProtocolVersion.V9_6) never send the expected
 * `SSBd` (SuperSourceBorderUpdateCommand) packet - not on connect, and not
 * even in response to a `CSBd` write. Their SuperSource border state is
 * instead only observable via `SSSB`, which this library previously had no
 * parser for (it was silently dropped as an "Unknown command").
 *
 * `SSSB` is emitted per SuperSource *box* (4 boxes x N superSources) even
 * though border is conceptually a per-SuperSource property - all box
 * entries for a given ssrcId simply carry identical values.
 *
 * 24 byte payload layout, as reverse engineered by diffing packets against
 * live UI changes in ATEM Software Control:
 *   0:     ssrcId (u8)
 *   1:     boxId (u8)
 *   2:     borderEnabled (u8, 0/1)
 *   3:     unknown, box-specific, unaffected by border changes
 *   4-7:   outerWidth, duplicated across two u16 BE values
 *   8-15:  innerWidth, duplicated across four u16 BE values
 *   16-17: hue (u16 BE)
 *   18-19: saturation (u16 BE)
 *   20-21: luma (u16 BE, default 1000 - matches the known SSBd luma scale)
 *   22-23: unknown, box-specific, unaffected by border changes
 *
 * outerWidth/innerWidth use the full u16 range (0-65535) to represent
 * 0.00-16.00, rather than the 0-1600 (hundredths) scale used by the
 * documented `SSBd`/`CSBd` commands. They are rescaled to that convention
 * here so `SuperSourceBorder.borderOuterWidth`/`borderInnerWidth` stay
 * consistent with what `setSuperSourceBorder()` expects to be sent.
 *
 * Bevel, bevel softness/position, outer/inner softness, and light source
 * direction/altitude are NOT present in this packet - those controls are
 * greyed out in ATEM Software Control on the reference unit, suggesting
 * this hardware doesn't support them at all. They are left as whatever was
 * already in state (or a neutral default), rather than guessed at.
 */
export class SuperSourceBoxBorderCommand extends DeserializedCommand<{
	ssrcId: number
	boxId: number
	border: Pick<
		SuperSourceBorder,
		'borderEnabled' | 'borderOuterWidth' | 'borderInnerWidth' | 'borderHue' | 'borderSaturation' | 'borderLuma'
	>
}> {
	public static readonly rawName = 'SSSB'
	public static readonly minimumVersion = ProtocolVersion.V8_0

	public static deserialize(rawCommand: Buffer): SuperSourceBoxBorderCommand {
		const rawOuterWidth = rawCommand.readUInt16BE(4)
		const rawInnerWidth = rawCommand.readUInt16BE(8)

		return new SuperSourceBoxBorderCommand({
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
