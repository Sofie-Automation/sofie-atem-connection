import { WritableCommand, DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { InputChannel } from '../../state/input.js'
import * as Util from '../../lib/atemUtil.js'
import { OmitReadonly } from '../../lib/types.js'

export class InputPropertiesCommand extends WritableCommand<OmitReadonly<InputChannel>> {
	public static MaskFlags = {
		longName: 1 << 0,
		shortName: 1 << 1,
		externalPortType: 1 << 2,
	}

	public static readonly rawName = 'CInL'

	public readonly inputId: number

	constructor(inputId: number) {
		super()

		this.inputId = inputId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(32)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt16BE(this.inputId, 2)
		buffer.write(this.properties.longName || '', 4)
		buffer.write(this.properties.shortName || '', 24)
		buffer.writeUInt16BE(this.properties.externalPortType || 0, 28)
		return buffer
	}
}

export class InputPropertiesUpdateCommand extends DeserializedCommand<InputChannel> {
	public static readonly rawName = 'InPr'

	public readonly inputId: number

	constructor(inputId: number, properties: InputChannel) {
		super(properties)

		this.inputId = inputId
	}

	public static deserialize(rawCommand: Buffer): InputPropertiesUpdateCommand {
		const inputId = rawCommand.readUInt16BE(0)

		const properties: InputChannel = {
			inputId: rawCommand.readUInt16BE(0),
			longName: Util.bufToNullTerminatedString(rawCommand, 2, 20),
			shortName: Util.bufToNullTerminatedString(rawCommand, 22, 4),
			areNamesDefault: rawCommand.readUInt8(26) === 1,
			externalPorts: Util.getComponents(rawCommand.readUInt16BE(28)),
			externalPortType: rawCommand.readUInt16BE(30),
			internalPortType: rawCommand.readUInt8(32),
			sourceAvailability: rawCommand.readUInt8(34),
			meAvailability: rawCommand.readUInt8(35),
		}

		return new InputPropertiesUpdateCommand(inputId, properties)
	}

	public applyToState(state: AtemState): string {
		state.inputs[this.inputId] = {
			...this.properties,
		}
		return `inputs.${this.inputId}`
	}
}
