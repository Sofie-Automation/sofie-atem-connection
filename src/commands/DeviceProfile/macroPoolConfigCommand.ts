import { DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { MacroPoolInfo } from '../../state/info.js'

export class MacroPoolConfigCommand extends DeserializedCommand<MacroPoolInfo> {
	public static readonly rawName = '_MAC'

	constructor(properties: MacroPoolInfo) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer): MacroPoolConfigCommand {
		return new MacroPoolConfigCommand({
			macroCount: rawCommand.readUInt8(0),
		})
	}

	public applyToState(state: AtemState): string {
		state.info.macroPool = this.properties
		return `info.macroPool`
	}
}
