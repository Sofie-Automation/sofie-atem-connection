import { Timecode } from '../../state/common.js'
import { ProtocolVersion } from '../../enums/index.js'
import { InvalidIdError, AtemState } from '../../state/index.js'
import { DeserializedCommand, BasicWritableCommand } from '../CommandBase.js'

export class StreamingRequestDurationCommand extends BasicWritableCommand<Record<string, never>> {
	public static readonly rawName = 'SRDR'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	constructor() {
		super({})
	}

	public serialize(): Buffer {
		return Buffer.alloc(0)
	}
}

export class StreamingDurationUpdateCommand extends DeserializedCommand<Timecode> {
	public static readonly rawName = 'SRST'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	constructor(properties: Timecode) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer): StreamingDurationUpdateCommand {
		const props: Timecode = {
			hours: rawCommand.readUInt8(0),
			minutes: rawCommand.readUInt8(1),
			seconds: rawCommand.readUInt8(2),
			frames: rawCommand.readUInt8(3),
			isDropFrame: rawCommand.readUInt8(4) != 0,
		}

		return new StreamingDurationUpdateCommand(props)
	}

	public applyToState(state: AtemState): string {
		if (!state.streaming) {
			throw new InvalidIdError('Streaming')
		}

		state.streaming.duration = this.properties

		return `streaming.duration`
	}
}
