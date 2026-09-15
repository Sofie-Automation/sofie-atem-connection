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
		if (version >= ProtocolVersion.V8_1_1) {
			// The multiviewer count moved into _top, and everything else shifted down a byte
			return new MultiviewerConfigCommand({
				count: -1,
				windowCount: rawCommand.readUInt8(0),
			})
		} else {
			return new MultiviewerConfigCommand({
				count: rawCommand.readUInt8(0),
				windowCount: rawCommand.readUInt8(1),
			})
		}
	}

	public applyToState(state: AtemState): string {
		if (this.properties.count === -1) {
			state.info.multiviewer = {
				count: -1,
				...state.info.multiviewer,
				windowCount: this.properties.windowCount,
			}
		} else {
			state.info.multiviewer = this.properties
		}
		return `info.multiviewer`
	}
}
