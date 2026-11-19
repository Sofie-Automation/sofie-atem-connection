import { DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { AudioMixerInfo } from '../../state/info.js'

export class AudioMixerConfigCommand extends DeserializedCommand<AudioMixerInfo> {
	public static readonly rawName = '_AMC'

	constructor(properties: AudioMixerInfo) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer): AudioMixerConfigCommand {
		return new AudioMixerConfigCommand({
			inputs: rawCommand.readUInt8(0),
			monitors: rawCommand.readUInt8(1),
			headphones: rawCommand.readUInt8(2),
		})
	}

	public applyToState(state: AtemState): string[] {
		state.info.audioMixer = this.properties
		state.audio = {
			numberOfChannels: this.properties.inputs,
			hasMonitor: this.properties.monitors != 0,
			channels: [],
		}

		return [`info.audioMixer`, `audio`]
	}
}
