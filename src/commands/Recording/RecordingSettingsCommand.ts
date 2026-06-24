import { WritableCommand, DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { RecordingStateProperties } from '../../state/recording.js'
import { ProtocolVersion } from '../../enums/index.js'
import { bufToNullTerminatedString } from '../../lib/atemUtil.js'

export class RecordingSettingsCommand extends WritableCommand<RecordingStateProperties> {
	public static readonly rawName = 'CRMS'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	public static MaskFlags = {
		filename: 1 << 0,
		workingSet1DiskId: 1 << 1,
		workingSet2DiskId: 1 << 2,
		recordInAllCameras: 1 << 3,
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(144)
		buffer.writeUInt8(this.flag, 0)
		buffer.write(this.properties.filename || '', 1, 128, 'utf8')
		buffer.writeUInt32BE(this.properties.workingSet1DiskId || 0, 132)
		buffer.writeUInt32BE(this.properties.workingSet2DiskId || 0, 136)
		buffer.writeUInt8(this.properties.recordInAllCameras ? 1 : 0, 140)
		return buffer
	}
}

export class RecordingSettingsUpdateCommand extends DeserializedCommand<RecordingStateProperties> {
	public static readonly rawName = 'RMSu'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	constructor(properties: RecordingStateProperties) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer): RecordingSettingsUpdateCommand {
		const props: RecordingStateProperties = {
			filename: bufToNullTerminatedString(rawCommand, 0, 128),
			workingSet1DiskId: rawCommand.readUInt32BE(128),
			workingSet2DiskId: rawCommand.readUInt32BE(132),
			recordInAllCameras: rawCommand.readUInt8(136) != 0,
		}

		return new RecordingSettingsUpdateCommand(props)
	}

	public applyToState(state: AtemState): string {
		if (!state.recording) {
			state.recording = {
				properties: this.properties,
				disks: {},
			}
		} else {
			state.recording.properties = this.properties
		}

		return `recording.properties`
	}
}
