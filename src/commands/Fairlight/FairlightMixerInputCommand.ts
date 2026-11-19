import { AtemState, InvalidIdError } from '../../state/index.js'
import { FairlightAudioInputProperties } from '../../state/fairlight.js'
import { ProtocolVersion, FairlightAnalogInputLevel } from '../../enums/index.js'
import * as Util from '../../lib/atemUtil.js'
import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { OmitReadonly } from '../../lib/types.js'

export class FairlightMixerInputCommand extends WritableCommand<
	Omit<OmitReadonly<FairlightAudioInputProperties>, 'activeInputLevel'> & { rcaToXlrEnabled: boolean }
> {
	public static MaskFlags = {
		rcaToXlrEnabled: 1 << 0,
		activeConfiguration: 1 << 1,
	}

	public static readonly rawName = 'CFIP'

	public readonly index: number

	constructor(index: number) {
		super()

		this.index = index
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt16BE(this.index, 2)

		buffer.writeUInt8(this.properties.rcaToXlrEnabled ? 1 : 0, 4)
		buffer.writeUInt8(this.properties.activeConfiguration || 0, 5)

		return buffer
	}
}

export class FairlightMixerInputV8Command extends WritableCommand<OmitReadonly<FairlightAudioInputProperties>> {
	public static MaskFlags = {
		activeConfiguration: 1 << 0,
		activeInputLevel: 1 << 1,
	}
	public static readonly rawName = 'CFIP'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	public readonly index: number

	constructor(index: number) {
		super()

		this.index = index
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt16BE(this.index, 2)

		buffer.writeUInt8(this.properties.activeConfiguration || 0, 4)
		buffer.writeUInt8(this.properties.activeInputLevel || 0, 5)

		return buffer
	}
}

export class FairlightMixerInputUpdateCommand extends DeserializedCommand<FairlightAudioInputProperties> {
	public static readonly rawName = 'FAIP'

	public readonly index: number

	constructor(index: number, properties: FairlightAudioInputProperties) {
		super(properties)

		this.index = index
	}

	public static deserialize(rawCommand: Buffer, version: ProtocolVersion): FairlightMixerInputUpdateCommand {
		const rcaToXlr = version < ProtocolVersion.V8_1_1

		const index = rawCommand.readUInt16BE(0)

		const properties: FairlightAudioInputProperties = {
			inputType: rawCommand.readUInt8(2),
			externalPortType: rawCommand.readUInt16BE(6),

			supportedConfigurations: Util.getComponents(rawCommand.readUInt8(rcaToXlr ? 11 : 9)),
			activeConfiguration: rawCommand.readUInt8(rcaToXlr ? 12 : 10),

			// TODO - check these value conversions
			supportedInputLevels: rcaToXlr
				? rawCommand.readUInt8(8) > 0
					? [FairlightAnalogInputLevel.ProLine, FairlightAnalogInputLevel.Microphone]
					: []
				: Util.getComponents(rawCommand.readUInt8(11)),
			activeInputLevel: rcaToXlr
				? rawCommand.readUInt8(9) > 0
					? FairlightAnalogInputLevel.ProLine
					: FairlightAnalogInputLevel.Microphone
				: rawCommand.readUInt8(12),
		}

		return new FairlightMixerInputUpdateCommand(index, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.fairlight) {
			throw new InvalidIdError('Fairlight')
		}

		state.fairlight.inputs[this.index] = {
			sources: {},
			...state.fairlight.inputs[this.index],
			properties: this.properties,
		}
		return `fairlight.inputs.${this.index}.properties`
	}
}
