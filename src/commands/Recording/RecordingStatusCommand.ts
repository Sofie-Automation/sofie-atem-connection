import { BasicWritableCommand, DeserializedCommand } from '../CommandBase.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { RecordingStateStatus } from '../../state/recording.js'
import { RecordingError, RecordingStatus, ProtocolVersion } from '../../enums/index.js'

export class RecordingStatusCommand extends BasicWritableCommand<{ recording: boolean }> {
	public static readonly rawName = 'RcTM'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	constructor(recording: boolean) {
		super({ recording })
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.properties.recording ? 1 : 0, 0)
		return buffer
	}
}

const errorEnumValues = Object.values<RecordingError | string>(RecordingError).filter(
	(e) => typeof e === 'number'
) as unknown as number[]
const statusEnumValues = Object.values<RecordingStatus | string>(RecordingStatus).filter(
	(e) => typeof e === 'number'
) as unknown as number[]

export class RecordingStatusUpdateCommand extends DeserializedCommand<RecordingStateStatus> {
	public static readonly rawName = 'RTMS'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	constructor(properties: RecordingStateStatus) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer): RecordingStatusUpdateCommand {
		const rawStatus = rawCommand.readUInt16BE(0)
		const recordingTimeAvailable = rawCommand.length > 4 ? rawCommand.readUInt32BE(4) : -1

		let error = RecordingError.NoMedia
		let state = RecordingStatus.Idle

		for (const e of errorEnumValues) {
			if (e !== 0 && (rawStatus & e) === e) {
				error = e
				if (e !== RecordingError.None) break
			}
		}

		for (const e of statusEnumValues) {
			if (e !== 0 && (rawStatus & e) === e) {
				state = e
				break
			}
		}

		return new RecordingStatusUpdateCommand({ state, error, recordingTimeAvailable })
	}

	public applyToState(state: AtemState): string {
		if (!state.recording) {
			throw new InvalidIdError('Recording')
		}

		state.recording.status = this.properties

		return `recording.status`
	}
}
