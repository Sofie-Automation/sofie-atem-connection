import { DeserializedCommand, WritableCommand } from '../../CommandBase.js'
import { FairlightAudioRoutingSource } from '../../../state/fairlight.js'
import { OmitReadonly } from '../../../lib/types.js'
import { AtemState, InvalidIdError } from '../../../state/index.js'
import * as Util from '../../../lib/atemUtil.js'
import { AudioChannelPair } from '../../../enums/index.js'

export class AudioRoutingSourceCommand extends WritableCommand<OmitReadonly<FairlightAudioRoutingSource>> {
	public static MaskFlags = {
		name: 1 << 0,
	}

	public static readonly rawName = 'ARSC'

	public readonly id: number

	constructor(sourceId: number) {
		super()

		this.id = sourceId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(72)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt32BE(this.id, 4)

		buffer.write(this.properties.name ?? '', 8, 64)
		return buffer
	}
}

export class AudioRoutingSourceUpdateCommand extends DeserializedCommand<FairlightAudioRoutingSource> {
	public static readonly rawName = 'ARSP'

	public readonly id: number

	constructor(sourceId: number, properties: FairlightAudioRoutingSource) {
		super(properties)

		this.id = sourceId
	}

	public static deserialize(rawCommand: Buffer): AudioRoutingSourceUpdateCommand {
		const sourceId = rawCommand.readUInt32BE(0)
		const properties = {
			audioSourceId: sourceId >> 16,
			audioChannelPair: (sourceId & 0xffff) as AudioChannelPair,

			externalPortType: rawCommand.readUInt16BE(4),
			internalPortType: rawCommand.readUInt16BE(6),

			name: Util.bufToNullTerminatedString(rawCommand, 8, 64),
		}

		return new AudioRoutingSourceUpdateCommand(sourceId, properties)
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

		state.fairlight.audioRouting.sources[this.id] = this.properties
		return `fairlight.audioRouting.sources.${this.id}`
	}
}
