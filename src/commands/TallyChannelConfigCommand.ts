import { DeserializedCommand } from './CommandBase'
import { AtemState } from '../state'

export class TallyChannelConfigCommand extends DeserializedCommand<{ inputCount: number }> {
	public static readonly rawName = '_TlC'

	constructor(properties: { inputCount: number }) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer): TallyChannelConfigCommand {
		// [0..3] is a constant 00 01 00 00
		return new TallyChannelConfigCommand({
			inputCount: rawCommand.readUInt8(4),
		})
	}

	public applyToState(state: AtemState): string {
		state.info.tallyChannels = this.properties.inputCount

		return `info.tallyChannels`
	}
}
