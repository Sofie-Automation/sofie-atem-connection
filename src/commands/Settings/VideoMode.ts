import { BasicWritableCommand, DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { Enums } from '../../index.js'

export interface VideoModeProps {
	mode: Enums.VideoMode
}

export class VideoModeCommand extends BasicWritableCommand<VideoModeProps> {
	public static readonly rawName = 'CVdM'

	constructor(mode: Enums.VideoMode) {
		super({ mode })
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.properties.mode, 0)
		return buffer
	}
}

export class VideoModeUpdateCommand extends DeserializedCommand<VideoModeProps> {
	public static readonly rawName = 'VidM'

	constructor(mode: Enums.VideoMode) {
		super({ mode })
	}

	public static deserialize(rawCommand: Buffer): VideoModeUpdateCommand {
		return new VideoModeUpdateCommand(rawCommand.readUInt8(0))
	}

	public applyToState(state: AtemState): string {
		state.settings.videoMode = this.properties.mode
		return `settings.videoMode`
	}
}
