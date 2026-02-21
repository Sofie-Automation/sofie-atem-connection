import { DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { MediaPoolInfo } from '../../state/info.js'

export class MediaPoolConfigCommand extends DeserializedCommand<MediaPoolInfo> {
	public static readonly rawName = '_mpl'

	constructor(properties: MediaPoolInfo) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer): MediaPoolConfigCommand {
		return new MediaPoolConfigCommand({
			stillCount: rawCommand.readUInt8(0),
			clipCount: rawCommand.readUInt8(1),
		})
	}

	public applyToState(state: AtemState): string {
		state.info.mediaPool = this.properties
		return `info.mediaPool`
	}
}
