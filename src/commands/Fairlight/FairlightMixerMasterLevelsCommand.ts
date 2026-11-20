import { FairlightAudioLevels } from '../../state/levels.js'
import { DeserializedCommand } from '../CommandBase.js'

export class FairlightMixerMasterLevelsUpdateCommand extends DeserializedCommand<
	Omit<FairlightAudioLevels, 'expanderGainReduction'>
> {
	public static readonly rawName = 'FDLv'

	public static deserialize(rawCommand: Buffer): FairlightMixerMasterLevelsUpdateCommand {
		const properties = {
			inputLeftLevel: rawCommand.readInt16BE(0),
			inputRightLevel: rawCommand.readInt16BE(2),
			inputLeftPeak: rawCommand.readInt16BE(4),
			inputRightPeak: rawCommand.readInt16BE(6),

			compressorGainReduction: rawCommand.readInt16BE(8),
			limiterGainReduction: rawCommand.readInt16BE(10),

			outputLeftLevel: rawCommand.readInt16BE(12),
			outputRightLevel: rawCommand.readInt16BE(14),
			outputLeftPeak: rawCommand.readInt16BE(16),
			outputRightPeak: rawCommand.readInt16BE(18),

			leftLevel: rawCommand.readInt16BE(20),
			rightLevel: rawCommand.readInt16BE(22),
			leftPeak: rawCommand.readInt16BE(24),
			rightPeak: rawCommand.readInt16BE(26),
		}

		return new FairlightMixerMasterLevelsUpdateCommand(properties)
	}

	public applyToState(): string[] {
		// Not stored in the state
		return []
	}
}
