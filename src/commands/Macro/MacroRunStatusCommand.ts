import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { MacroPlayerState } from '../../state/macro.js'

export class MacroRunStatusUpdateCommand extends DeserializedCommand<MacroPlayerState> {
	public static readonly rawName = 'MRPr'

	public static deserialize(rawCommand: Buffer): MacroRunStatusUpdateCommand {
		const properties: MacroPlayerState = {
			isRunning: Boolean(rawCommand.readUInt8(0) & (1 << 0)),
			isWaiting: Boolean(rawCommand.readUInt8(0) & (1 << 1)),
			loop: rawCommand.readUInt8(1) != 0,
			macroIndex: rawCommand.readUInt16BE(2),
		}

		return new MacroRunStatusUpdateCommand(properties)
	}

	public applyToState(state: AtemState): string {
		state.macro.macroPlayer = this.properties
		return `macro.macroPlayer`
	}
}

export class MacroRunStatusCommand extends WritableCommand<{ loop: boolean }> {
	public static MaskFlags = {
		loop: 1 << 0,
	}

	public static readonly rawName = 'MRCP'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.properties.loop ? 1 : 0, 1)
		return buffer
	}
}
