import { DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { FairlightAudioMixerInfo } from '../../state/info.js'

export class FairlightAudioMixerConfigCommand extends DeserializedCommand<FairlightAudioMixerInfo> {
	public static readonly rawName = '_FAC'

	constructor(properties: FairlightAudioMixerInfo) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer): FairlightAudioMixerConfigCommand {
		return new FairlightAudioMixerConfigCommand({
			inputs: rawCommand.readUInt8(0),
			monitors: rawCommand.readUInt8(1),
		})
	}

	public applyToState(state: AtemState): string[] {
		state.info.fairlightMixer = this.properties
		state.fairlight = {
			inputs: {},
		}

		return [`info.fairlightMixer`, `fairlight.inputs`]
	}
}
