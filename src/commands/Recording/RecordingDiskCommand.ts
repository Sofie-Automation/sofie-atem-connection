import { ProtocolVersion } from '../../enums/index.js'
import { InvalidIdError, AtemState } from '../../state/index.js'
import { DeserializedCommand, BasicWritableCommand } from '../CommandBase.js'
import { RecordingDiskProperties } from '../../state/recording.js'
import { bufToNullTerminatedString } from '../../lib/atemUtil.js'

export class RecordingRequestSwitchDiskCommand extends BasicWritableCommand<Record<string, never>> {
	public static readonly rawName = 'RMSp'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	constructor() {
		super({})
	}

	public serialize(): Buffer {
		return Buffer.alloc(0)
	}
}

export interface DeletableRecordingDiskProperties extends RecordingDiskProperties {
	isDelete: boolean
}

export class RecordingDiskInfoUpdateCommand extends DeserializedCommand<DeletableRecordingDiskProperties> {
	public static readonly rawName = 'RTMD'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	public static readonly DeleteStatusFlag = 1 << 5

	public readonly diskId: number

	constructor(diskId: number, properties: DeletableRecordingDiskProperties) {
		super(properties)

		this.diskId = diskId
	}

	public static deserialize(rawCommand: Buffer): RecordingDiskInfoUpdateCommand {
		const diskId = rawCommand.readUInt32BE(0)
		const rawStatus = rawCommand.readUInt16BE(8)

		const props: DeletableRecordingDiskProperties = {
			diskId,
			recordingTimeAvailable: rawCommand.readUInt32BE(4),
			status: rawStatus & ~this.DeleteStatusFlag,
			isDelete: (rawStatus & this.DeleteStatusFlag) === this.DeleteStatusFlag,
			volumeName: bufToNullTerminatedString(rawCommand, 10, 64),
		}

		return new RecordingDiskInfoUpdateCommand(diskId, props)
	}

	public applyToState(state: AtemState): string {
		if (!state.recording) {
			throw new InvalidIdError('Recording')
		}

		if (this.properties.isDelete) {
			delete state.recording.disks[this.diskId]
		} else {
			state.recording.disks[this.diskId] = this.properties
		}

		return `recording.duration`
	}
}
