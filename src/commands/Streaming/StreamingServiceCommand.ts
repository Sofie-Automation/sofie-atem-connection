import { WritableCommand, DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { StreamingServiceProperties } from '../../state/streaming.js'
import { ProtocolVersion } from '../../enums/index.js'
import { bufToNullTerminatedString } from '../../lib/atemUtil.js'

export class StreamingServiceCommand extends WritableCommand<StreamingServiceProperties> {
	public static readonly rawName = 'CRSS'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	public static MaskFlags = {
		serviceName: 1 << 0,
		url: 1 << 1,
		key: 1 << 2,
		bitrates: 1 << 3,
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(1100)
		buffer.writeUInt8(this.flag, 0)
		buffer.write(this.properties.serviceName || '', 1, 64, 'utf8')
		buffer.write(this.properties.url || '', 65, 512, 'utf8')
		buffer.write(this.properties.key || '', 577, 512, 'utf8')

		const bitrates = this.properties.bitrates || [0, 0]
		buffer.writeUInt32BE(bitrates[0], 1092)
		buffer.writeUInt32BE(bitrates[1], 1096)
		return buffer
	}
}

export class StreamingServiceUpdateCommand extends DeserializedCommand<StreamingServiceProperties> {
	public static readonly rawName = 'SRSU'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	constructor(properties: StreamingServiceProperties) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer): StreamingServiceUpdateCommand {
		const props: StreamingServiceProperties = {
			serviceName: bufToNullTerminatedString(rawCommand, 0, 64),
			url: bufToNullTerminatedString(rawCommand, 64, 512),
			key: bufToNullTerminatedString(rawCommand, 576, 512),
			bitrates: [rawCommand.readUInt32BE(1088), rawCommand.readUInt32BE(1092)],
		}

		return new StreamingServiceUpdateCommand(props)
	}

	public applyToState(state: AtemState): string {
		if (!state.streaming) {
			state.streaming = {
				service: this.properties,
			}
		} else {
			state.streaming.service = this.properties
		}

		return `streaming.service`
	}
}
