import { ProtocolVersion } from '../../enums/index.js'
import { InvalidIdError, AtemState } from '../../state/index.js'
import { DeserializedCommand } from '../CommandBase.js'
import { StreamingStateStats } from '../../state/streaming.js'

export class StreamingStatsUpdateCommand extends DeserializedCommand<StreamingStateStats> {
	public static readonly rawName = 'SRSS'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	constructor(properties: StreamingStateStats) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer): StreamingStatsUpdateCommand {
		const props: StreamingStateStats = {
			encodingBitrate: rawCommand.readUInt32BE(0),
			cacheUsed: rawCommand.readUInt16BE(4),
		}

		return new StreamingStatsUpdateCommand(props)
	}

	public applyToState(state: AtemState): string {
		if (!state.streaming) {
			throw new InvalidIdError('Streaming')
		}

		state.streaming.stats = this.properties

		return `streaming.stats`
	}
}
