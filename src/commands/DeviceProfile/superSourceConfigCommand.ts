import { DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { ProtocolVersion } from '../../enums/index.js'
import { SuperSourceInfo } from '../../state/info.js'

export class SuperSourceConfigCommand extends DeserializedCommand<SuperSourceInfo> {
	public static readonly rawName = '_SSC'

	public readonly ssrcId: number

	constructor(ssrcId: number, properties: SuperSourceInfo) {
		super(properties)

		this.ssrcId = ssrcId
	}

	public static deserialize(rawCommand: Buffer, version: ProtocolVersion): SuperSourceConfigCommand {
		if (version >= ProtocolVersion.V8_0) {
			return new SuperSourceConfigCommand(rawCommand.readUInt8(0), { boxCount: rawCommand.readUInt8(2) })
		} else {
			return new SuperSourceConfigCommand(0, { boxCount: rawCommand.readUInt8(0) })
		}
	}

	public applyToState(state: AtemState): string {
		state.info.superSources[this.ssrcId] = this.properties
		return `info.superSources`
	}
}
