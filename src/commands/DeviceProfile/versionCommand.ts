import { DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { ProtocolVersion } from '../../enums/index.js'

export class VersionCommand extends DeserializedCommand<{ version: ProtocolVersion }> {
	public static readonly rawName = '_ver'

	constructor(version: ProtocolVersion) {
		super({ version })
	}

	public static deserialize(rawCommand: Buffer): VersionCommand {
		const version = rawCommand.readUInt32BE(0)

		return new VersionCommand(version)
	}

	public applyToState(state: AtemState): string {
		state.info.apiVersion = this.properties.version
		return `info.apiVersion`
	}
}
