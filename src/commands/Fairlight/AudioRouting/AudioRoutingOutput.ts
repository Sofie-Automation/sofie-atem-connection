import { DeserializedCommand, WritableCommand } from '../../CommandBase.js'
import { FairlightAudioRoutingOutput } from '../../../state/fairlight.js'
import { OmitReadonly } from '../../../lib/types.js'
import { AtemState, InvalidIdError } from '../../../state/index.js'
import * as Util from '../../../lib/atemUtil.js'
import { AudioChannelPair } from '../../../enums/index.js'

export class AudioRoutingOutputCommand extends WritableCommand<OmitReadonly<FairlightAudioRoutingOutput>> {
	public static MaskFlags = {
		sourceId: 1 << 0,
		name: 1 << 1,
	}

	public static readonly rawName = 'AROC'

	public readonly id: number

	constructor(outputId: number) {
		super()

		this.id = outputId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(76)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt32BE(this.id, 4)

		buffer.writeUInt32BE(this.properties.sourceId ?? 0, 8)
		buffer.write(this.properties.name ?? '', 12, 64)
		return buffer
	}
}

export class AudioRoutingOutputUpdateCommand extends DeserializedCommand<FairlightAudioRoutingOutput> {
	public static readonly rawName = 'AROP'

	public readonly id: number

	constructor(outputId: number, properties: FairlightAudioRoutingOutput) {
		super(properties)

		this.id = outputId
	}

	public static deserialize(rawCommand: Buffer): AudioRoutingOutputUpdateCommand {
		const outputId = rawCommand.readUInt32BE(0)
		const properties = {
			audioOutputId: outputId >> 16,
			audioChannelPair: (outputId & 0xffff) as AudioChannelPair,

			sourceId: rawCommand.readUInt32BE(4),
			externalPortType: rawCommand.readUInt16BE(8),
			internalPortType: rawCommand.readUInt16BE(10),

			name: Util.bufToNullTerminatedString(rawCommand, 12, 64),
		}

		return new AudioRoutingOutputUpdateCommand(outputId, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.fairlight) {
			throw new InvalidIdError('Fairlight')
		}

		if (!state.fairlight.audioRouting)
			state.fairlight.audioRouting = {
				outputs: {},
				sources: {},
			}

		state.fairlight.audioRouting.outputs[this.id] = this.properties
		return `fairlight.audioRouting.outputs.${this.id}`
	}
}
