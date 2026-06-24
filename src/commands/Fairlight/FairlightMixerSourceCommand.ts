import { FairlightAudioInput, FairlightAudioSourcePropertiesState } from '../../state/fairlight.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import * as Util from '../../lib/atemUtil.js'
import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { OmitReadonly } from '../../lib/types.js'

export class FairlightMixerSourceDeleteCommand extends DeserializedCommand<Record<string, never>> {
	public static readonly rawName = 'FASD'

	public readonly index: number
	public readonly source: bigint

	constructor(index: number, source: bigint) {
		super({})

		this.index = index
		this.source = source
	}

	public static deserialize(rawCommand: Buffer): FairlightMixerSourceDeleteCommand {
		const index = rawCommand.readUInt16BE(0)
		const source = rawCommand.readBigInt64BE(8)
		return new FairlightMixerSourceDeleteCommand(index, source)
	}

	public applyToState(state: AtemState): string | string[] {
		if (!state.fairlight) {
			throw new InvalidIdError('Fairlight')
		}

		const input = state.fairlight.inputs[this.index]
		if (input) {
			delete input.sources[this.source.toString()]
			return `fairlight.inputs.${this.index}.sources.${this.source}`
		}
		return []
	}
}

export interface FairlightMixerSourceCommandProperties extends FairlightAudioSourcePropertiesState {
	equalizerEnabled: boolean
	equalizerGain: number

	makeUpGain: number
}

export class FairlightMixerSourceCommand extends WritableCommand<OmitReadonly<FairlightMixerSourceCommandProperties>> {
	public static MaskFlags = {
		framesDelay: 1 << 0,
		gain: 1 << 1,
		stereoSimulation: 1 << 2,
		equalizerEnabled: 1 << 3,
		equalizerGain: 1 << 4,
		makeUpGain: 1 << 5,
		balance: 1 << 6,
		faderGain: 1 << 7,
		mixOption: 1 << 8,
	}

	public static readonly rawName = 'CFSP'

	public readonly index: number
	public readonly source: bigint

	constructor(index: number, source: bigint) {
		super()

		this.index = index
		this.source = source
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(48)
		buffer.writeUInt16BE(this.flag, 0)
		buffer.writeUInt16BE(this.index, 2)
		buffer.writeBigInt64BE(this.source, 8)

		buffer.writeUInt8(this.properties.framesDelay || 0, 16)
		buffer.writeInt32BE(this.properties.gain || 0, 20)
		buffer.writeInt16BE(this.properties.stereoSimulation || 0, 24)

		buffer.writeUInt8(this.properties.equalizerEnabled ? 1 : 0, 26)
		buffer.writeInt32BE(this.properties.equalizerGain || 0, 28)
		buffer.writeInt32BE(this.properties.makeUpGain || 0, 32)
		buffer.writeInt16BE(this.properties.balance || 0, 36)
		buffer.writeInt32BE(this.properties.faderGain || 0, 40)
		buffer.writeUInt8(this.properties.mixOption || 0, 44)
		return buffer
	}
}

export class FairlightMixerSourceUpdateCommand extends DeserializedCommand<
	FairlightMixerSourceCommandProperties & { bandCount: number }
> {
	public static readonly rawName = 'FASP'

	public readonly index: number
	public readonly source: bigint

	constructor(index: number, source: bigint, props: FairlightMixerSourceUpdateCommand['properties']) {
		super(props)

		this.index = index
		this.source = source
	}

	public static deserialize(rawCommand: Buffer): FairlightMixerSourceUpdateCommand {
		const index = rawCommand.readUInt16BE(0)
		const source = rawCommand.readBigInt64BE(8)
		const properties = {
			sourceType: rawCommand.readUInt8(16),
			maxFramesDelay: rawCommand.readUInt8(17),
			framesDelay: rawCommand.readUInt8(18),

			gain: rawCommand.readInt32BE(20),

			hasStereoSimulation: rawCommand.readUInt8(24) > 0,
			stereoSimulation: rawCommand.readInt16BE(26),

			bandCount: rawCommand.readUInt8(28),
			equalizerEnabled: rawCommand.readUInt8(29) > 0,
			equalizerGain: rawCommand.readInt32BE(32),
			makeUpGain: rawCommand.readInt32BE(36),
			balance: rawCommand.readInt16BE(40),
			faderGain: rawCommand.readInt32BE(44),

			supportedMixOptions: Util.getComponents(rawCommand.readUInt8(48)),
			mixOption: rawCommand.readUInt8(49),
		}

		return new FairlightMixerSourceUpdateCommand(index, source, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.fairlight) {
			throw new InvalidIdError('Fairlight')
		}

		const input: FairlightAudioInput = state.fairlight.inputs[this.index] || { sources: {} }
		state.fairlight.inputs[this.index] = input

		const sourceIdStr = this.source.toString()
		const oldSource = input.sources[sourceIdStr]

		input.sources[sourceIdStr] = {
			...oldSource,
			equalizer: {
				...oldSource?.equalizer,
				enabled: this.properties.equalizerEnabled,
				gain: this.properties.equalizerGain,
				bands: oldSource?.equalizer?.bands ?? new Array(this.properties.bandCount).fill(undefined),
			},
			dynamics: {
				...oldSource?.dynamics,
				makeUpGain: this.properties.makeUpGain,
			},
			properties: {
				// preserve old props
				...(oldSource ? oldSource.properties : {}),
				...Util.omit(this.properties, 'bandCount', 'equalizerEnabled', 'equalizerGain', 'makeUpGain'),
			},
		}

		return `fairlight.inputs.${this.index}.sources.${sourceIdStr}.properties`
	}
}
