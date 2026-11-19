import { FairlightAudioMonitorSolo } from '../../state/fairlight.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { OmitReadonly } from '../../lib/types.js'

export class FairlightMixerMonitorSoloCommand extends WritableCommand<OmitReadonly<FairlightAudioMonitorSolo>> {
	public static MaskFlags = {
		solo: 1 << 0,
		index: 1 << 1,
		source: 1 << 1, // Intentional duplicate
	}

	public static readonly rawName = 'CFMS'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(24)
		buffer.writeUInt8(this.flag, 0)

		buffer.writeUInt8(this.properties.solo ? 1 : 0, 1)
		buffer.writeUInt16BE(this.properties.index ?? 0, 8)
		if (this.properties.source) buffer.writeBigInt64BE(BigInt(this.properties.source), 16)
		return buffer
	}
}

export class FairlightMixerMonitorSoloUpdateCommand extends DeserializedCommand<FairlightAudioMonitorSolo> {
	public static readonly rawName = 'FAMS'

	public static deserialize(rawCommand: Buffer): FairlightMixerMonitorSoloUpdateCommand {
		const properties: FairlightAudioMonitorSolo = {
			solo: rawCommand.readUint8(0) === 1,
			index: rawCommand.readUInt16BE(8),
			source: rawCommand.readBigInt64BE(16).toString(),
		}

		return new FairlightMixerMonitorSoloUpdateCommand(properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.fairlight) {
			throw new InvalidIdError('Fairlight')
		}

		state.fairlight.solo = { ...this.properties }

		return `fairlight.solo`
	}
}
