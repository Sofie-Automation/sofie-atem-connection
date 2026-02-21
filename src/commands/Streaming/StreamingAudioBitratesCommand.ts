import { SymmetricalCommand } from '../CommandBase.js'
import { InvalidIdError, AtemState } from '../../state/index.js'
import { ProtocolVersion } from '../../enums/index.js'
import { StreamingAudioBitrates } from '../../state/streaming.js'

export class StreamingAudioBitratesCommand extends SymmetricalCommand<StreamingAudioBitrates> {
	public static readonly rawName = 'STAB'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	constructor(lowBitrate = 128000, highBitrate = 192000) {
		super({ lowBitrate, highBitrate })
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		const lowBitrate = this.properties.lowBitrate || 128000
		const highBitrate = this.properties.highBitrate || 192000
		buffer.writeUInt32BE(lowBitrate, 0)
		buffer.writeUInt32BE(highBitrate, 4)
		return buffer
	}

	public static deserialize(rawCommand: Buffer): StreamingAudioBitratesCommand {
		const lowBitrate = rawCommand.readUInt32BE(0)
		const highBitrate = rawCommand.readUInt32BE(4)

		return new StreamingAudioBitratesCommand(lowBitrate, highBitrate)
	}

	public applyToState(state: AtemState): string {
		const audioBitrates = {
			lowBitrate: this.properties.lowBitrate,
			highBitrate: this.properties.highBitrate,
		}
		if (!state.streaming) {
			throw new InvalidIdError('Streaming')
		} else {
			state.streaming.audioBitrates = audioBitrates
		}

		return `streaming.audioBitrates`
	}
}
