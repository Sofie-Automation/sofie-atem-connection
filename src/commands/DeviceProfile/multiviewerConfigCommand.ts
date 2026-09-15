import { DeserializedCommand } from '../CommandBase'
import { AtemState } from '../../state'
import { MultiviewerInfo } from '../../state/info'
import { ProtocolVersion } from '../../enums'

export class MultiviewerConfigCommand extends DeserializedCommand<MultiviewerInfo> {
	public static readonly rawName = '_MvC'

	constructor(properties: MultiviewerInfo) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer, version: ProtocolVersion): MultiviewerConfigCommand {
		// v8.1.1 moved the multiviewer count into _top, shifting everything after it down a byte
		const offset = version >= ProtocolVersion.V8_1_1 ? -1 : 0

		// Before v8.0 the body is shorter, and stops before the last couple of flags
		const readFlag = (index: number): boolean =>
			index < rawCommand.length ? rawCommand.readUInt8(index) !== 0 : false

		return new MultiviewerConfigCommand({
			count: offset < 0 ? -1 : rawCommand.readUInt8(0),
			windowCount: rawCommand.readUInt8(1 + offset),
			canChangeLayout: readFlag(2 + offset),
			canRouteInputs: readFlag(3 + offset),
			supportsVuMeters: readFlag(6 + offset),
			canToggleSafeArea: readFlag(7 + offset),
			canSwapPreviewProgram: readFlag(8 + offset),
			supportsQuadrants: readFlag(9 + offset),
		})
	}

	public applyToState(state: AtemState): string {
		if (this.properties.count === -1) {
			// The count comes from _top on these versions, and will already be in the state
			state.info.multiviewer = {
				...this.properties,
				count: state.info.multiviewer?.count ?? -1,
			}
		} else {
			state.info.multiviewer = this.properties
		}
		return `info.multiviewer`
	}
}
