import { DeserializedCommand } from '../CommandBase'
import { AtemState } from '../../state'
import { FairlightEqualizerFrequencyRangeInfo } from '../../state/info'

export class FairlightEqualizerConfigCommand extends DeserializedCommand<{
	frequencyRanges: FairlightEqualizerFrequencyRangeInfo[]
}> {
	public static readonly rawName = '_FEC'

	constructor(properties: { frequencyRanges: FairlightEqualizerFrequencyRangeInfo[] }) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer): FairlightEqualizerConfigCommand {
		const rangeCount = rawCommand.readUInt8(1)

		const frequencyRanges: FairlightEqualizerFrequencyRangeInfo[] = []
		for (let i = 0; i < rangeCount; i++) {
			const offset = 4 + i * 12

			frequencyRanges.push({
				frequencyRange: rawCommand.readUInt8(offset + 0),
				minFrequency: rawCommand.readUInt32BE(offset + 4),
				maxFrequency: rawCommand.readUInt32BE(offset + 8),
			})
		}

		return new FairlightEqualizerConfigCommand({ frequencyRanges })
	}

	public applyToState(state: AtemState): string {
		// This always follows the _FAC command, which creates the fairlightMixer info
		state.info.fairlightMixer = {
			inputs: 0,
			monitors: 0,
			...state.info.fairlightMixer,
			equalizerFrequencyRanges: this.properties.frequencyRanges,
		}

		return `info.fairlightMixer`
	}
}
