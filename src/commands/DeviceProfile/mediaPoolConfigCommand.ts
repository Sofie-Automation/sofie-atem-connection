import { DeserializedCommand } from '../CommandBase'
import { AtemState } from '../../state'
import { MediaPoolInfo } from '../../state/info'
import { ProtocolVersion } from '../../enums'
import { Mutable } from '../../lib/types'

export class MediaPoolConfigCommand extends DeserializedCommand<MediaPoolInfo> {
	public static readonly rawName = '_mpl'

	constructor(properties: MediaPoolInfo) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer, version: ProtocolVersion): MediaPoolConfigCommand {
		const properties: Mutable<MediaPoolInfo> = {
			stillCount: rawCommand.readUInt8(0),
			clipCount: rawCommand.readUInt8(1),
		}

		// Before v8.1.1 this is padding, and contains junk
		if (version >= ProtocolVersion.V8_1_1) {
			properties.canCaptureStills = rawCommand.readUInt8(2) === 1
		}

		return new MediaPoolConfigCommand(properties)
	}

	public applyToState(state: AtemState): string {
		state.info.mediaPool = this.properties
		return `info.mediaPool`
	}
}
