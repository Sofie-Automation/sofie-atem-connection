import { BasicWritableCommand, DeserializedCommand } from '../CommandBase.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { StreamingStateStatus } from '../../state/streaming.js'
import { StreamingError, StreamingStatus, ProtocolVersion } from '../../enums/index.js'

export class StreamingStatusCommand extends BasicWritableCommand<{ streaming: boolean }> {
	public static readonly rawName = 'StrR'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	constructor(streaming: boolean) {
		super({ streaming })
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.properties.streaming ? 1 : 0, 0)
		return buffer
	}
}

const errorEnumValues = Object.values<StreamingError | string>(StreamingError).filter(
	(e) => typeof e === 'number'
) as unknown as number[]
const statusEnumValues = Object.values<StreamingStatus | string>(StreamingStatus).filter(
	(e) => typeof e === 'number'
) as unknown as number[]

export class StreamingStatusUpdateCommand extends DeserializedCommand<StreamingStateStatus> {
	public static readonly rawName = 'StRS'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	constructor(properties: StreamingStateStatus) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer): StreamingStatusUpdateCommand {
		const rawStatus = rawCommand.readUInt16BE(0)

		let error = StreamingError.None
		let state = StreamingStatus.Idle

		for (const e of errorEnumValues) {
			if (e !== 0 && (rawStatus & e) === e) {
				error = e
				break
			}
		}

		for (const e of statusEnumValues) {
			if ((rawStatus & e) === e) {
				state = e
				if (e !== StreamingStatus.Streaming) break
			}
		}

		return new StreamingStatusUpdateCommand({ state, error })
	}

	public applyToState(state: AtemState): string {
		if (!state.streaming) {
			throw new InvalidIdError('Streaming')
		}

		state.streaming.status = this.properties

		return `streaming.status`
	}
}
