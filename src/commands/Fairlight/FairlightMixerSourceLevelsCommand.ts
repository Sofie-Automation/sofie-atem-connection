import { FairlightAudioLevels } from '../../state/levels.js'
import { DeserializedCommand } from '../CommandBase.js'

export class FairlightMixerSourceLevelsUpdateCommand extends DeserializedCommand<FairlightAudioLevels> {
	public static readonly rawName = 'FMLv'

	public readonly index: number
	public readonly source: bigint

	constructor(index: number, source: bigint, props: FairlightMixerSourceLevelsUpdateCommand['properties']) {
		super(props)

		this.index = index
		this.source = source
	}

	public static deserialize(rawCommand: Buffer): FairlightMixerSourceLevelsUpdateCommand {
		const source = rawCommand.readBigInt64BE(0)
		const index = rawCommand.readUInt16BE(8)
		const properties = {
			inputLeftLevel: rawCommand.readInt16BE(10),
			inputRightLevel: rawCommand.readInt16BE(12),
			inputLeftPeak: rawCommand.readInt16BE(14),
			inputRightPeak: rawCommand.readInt16BE(16),

			expanderGainReduction: rawCommand.readInt16BE(18),
			compressorGainReduction: rawCommand.readInt16BE(20),
			limiterGainReduction: rawCommand.readInt16BE(22),

			outputLeftLevel: rawCommand.readInt16BE(24),
			outputRightLevel: rawCommand.readInt16BE(26),
			outputLeftPeak: rawCommand.readInt16BE(28),
			outputRightPeak: rawCommand.readInt16BE(30),

			leftLevel: rawCommand.readInt16BE(32),
			rightLevel: rawCommand.readInt16BE(34),
			leftPeak: rawCommand.readInt16BE(36),
			rightPeak: rawCommand.readInt16BE(38),
		}

		return new FairlightMixerSourceLevelsUpdateCommand(index, source, properties)
	}

	public applyToState(): string[] {
		// Not stored in the state
		return []
	}
}
