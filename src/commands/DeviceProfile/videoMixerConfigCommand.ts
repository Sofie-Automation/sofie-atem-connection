import { DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { SupportedVideoMode } from '../../state/info.js'
import { ProtocolVersion, VideoMode } from '../../enums/index.js'

export class VideoMixerConfigCommand extends DeserializedCommand<Array<SupportedVideoMode>> {
	public static readonly rawName = '_VMC'

	constructor(properties: Array<SupportedVideoMode>) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer, version: ProtocolVersion): VideoMixerConfigCommand {
		const modes: Array<SupportedVideoMode> = []

		const hasRequiresReconfig = version >= ProtocolVersion.V8_0
		const size = hasRequiresReconfig ? 13 : 12

		const count = rawCommand.readUInt16BE(0)
		for (let i = 0; i < count; i++) {
			const baseOffset = 4 + i * size

			modes.push({
				mode: rawCommand.readUInt8(baseOffset),
				multiviewerModes: readVideoModeBitmask(rawCommand.readUInt32BE(baseOffset + 4)),
				downConvertModes: readVideoModeBitmask(rawCommand.readUInt32BE(baseOffset + 8)),
				requiresReconfig: hasRequiresReconfig ? rawCommand.readUInt8(baseOffset + 12) !== 0 : false,
			})
		}

		return new VideoMixerConfigCommand(modes)
	}

	public applyToState(state: AtemState): string | string[] {
		state.info.supportedVideoModes = this.properties
		return `info.supportedVideoModes`
	}
}

function readVideoModeBitmask(rawVal: number): Array<VideoMode> {
	const modes: Array<VideoMode> = []
	for (const possibleMode of Object.values<VideoMode | string>(VideoMode)) {
		if (typeof possibleMode === 'number' && (rawVal & (1 << possibleMode)) != 0) modes.push(possibleMode)
	}

	return modes
}
