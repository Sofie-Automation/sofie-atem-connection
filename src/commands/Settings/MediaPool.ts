import { BasicWritableCommand, DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { ProtocolVersion } from '../../enums/index.js'

export interface MediaPoolProps {
	maxFrames: number[]
}

export class MediaPoolSettingsSetCommand extends BasicWritableCommand<MediaPoolProps> {
	public static readonly rawName = 'CMPS'
	public static readonly minimumVersion = ProtocolVersion.V8_0

	constructor(maxFrames: number[]) {
		super({ maxFrames })
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt16BE(this.properties.maxFrames[0] || 0, 0)
		buffer.writeUInt16BE(this.properties.maxFrames[1] || 0, 2)
		buffer.writeUInt16BE(this.properties.maxFrames[2] || 0, 4)
		buffer.writeUInt16BE(this.properties.maxFrames[3] || 0, 6)
		return buffer
	}
}

export class MediaPoolSettingsGetCommand extends DeserializedCommand<MediaPoolProps & { unassignedFrames: number }> {
	public static readonly rawName = 'MPSp'
	public static readonly minimumVersion = ProtocolVersion.V8_0

	constructor(maxFrames: number[], unassignedFrames: number) {
		super({ maxFrames, unassignedFrames })
	}

	public static deserialize(rawCommand: Buffer): MediaPoolSettingsGetCommand {
		return new MediaPoolSettingsGetCommand(
			[
				rawCommand.readUInt16BE(0),
				rawCommand.readUInt16BE(2),
				rawCommand.readUInt16BE(4),
				rawCommand.readUInt16BE(6),
			],
			rawCommand.readUInt16BE(8)
		)
	}

	public applyToState(state: AtemState): string {
		state.settings.mediaPool = {
			maxFrames: this.properties.maxFrames,
			unassignedFrames: this.properties.unassignedFrames,
		}
		return `settings.mediaPool`
	}
}
