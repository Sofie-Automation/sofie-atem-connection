import { DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { MixEffectInfo } from '../../state/info.js'

export class MixEffectBlockConfigCommand extends DeserializedCommand<MixEffectInfo> {
	public static readonly rawName = '_MeC'

	public readonly index: number

	constructor(index: number, properties: MixEffectInfo) {
		super(properties)

		this.index = index
	}

	public static deserialize(rawCommand: Buffer): MixEffectBlockConfigCommand {
		return new MixEffectBlockConfigCommand(rawCommand.readUInt8(0), { keyCount: rawCommand.readUInt8(1) })
	}

	public applyToState(state: AtemState): string {
		state.info.mixEffects[this.index] = this.properties
		return `info.mixEffects`
	}
}
