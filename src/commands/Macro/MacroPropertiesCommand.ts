import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { MacroPropertiesState } from '../../state/macro.js'
import * as Util from '../../lib/atemUtil.js'
import { OmitReadonly } from '../../lib/types.js'

export class MacroPropertiesUpdateCommand extends DeserializedCommand<MacroPropertiesState> {
	public static readonly rawName = 'MPrp'

	public readonly macroIndex: number

	constructor(macroIndexID: number, properties: MacroPropertiesState) {
		super(properties)

		this.macroIndex = macroIndexID
	}

	public static deserialize(rawCommand: Buffer): MacroPropertiesUpdateCommand {
		const macroIndexID = rawCommand.readUInt16BE(0)
		const nameLen = rawCommand.readUInt16BE(4)
		const descLen = rawCommand.readUInt16BE(6)

		const properties: MacroPropertiesState = {
			isUsed: rawCommand.readUInt8(2) != 0,
			hasUnsupportedOps: rawCommand.readUInt8(3) != 0,
			name: '',
			description: '',
		}

		if (nameLen > 0) {
			properties.name = Util.bufToNullTerminatedString(rawCommand, 8, nameLen)
		}
		if (descLen > 0) {
			properties.description = Util.bufToNullTerminatedString(rawCommand, 8 + nameLen, descLen)
		}

		return new MacroPropertiesUpdateCommand(macroIndexID, properties)
	}

	public applyToState(state: AtemState): string {
		state.macro.macroProperties[this.macroIndex] = this.properties
		return `macro.macroProperties.${this.macroIndex}`
	}
}

export class MacroPropertiesCommand extends WritableCommand<OmitReadonly<MacroPropertiesState>> {
	public static MaskFlags = {
		name: 1 << 0,
		description: 1 << 1,
	}

	public static readonly rawName = 'CMPr'

	public readonly macroIndex: number

	constructor(macroIndex: number) {
		super()

		this.macroIndex = macroIndex
	}

	public serialize(): Buffer {
		const name = this.properties.name || ''
		const description = this.properties.description || ''

		const buffer = Buffer.alloc(Util.padToMultiple(8 + name.length + description.length, 4))
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt16BE(this.macroIndex, 2)
		buffer.writeUInt16BE(name.length, 4)
		buffer.writeUInt16BE(description.length, 6)
		buffer.write(name, 8, 'utf8')
		buffer.write(description, 8 + name.length, 'utf8')

		return buffer
	}
}
