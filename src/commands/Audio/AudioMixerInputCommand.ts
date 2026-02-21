import { AtemState, InvalidIdError } from '../../state/index.js'
import { Util } from '../../index.js'
import { AudioChannel } from '../../state/audio.js'
import { WritableCommand, DeserializedCommand } from '../CommandBase.js'
import { ProtocolVersion } from '../../enums/index.js'
import { OmitReadonly } from '../../lib/types.js'

export class AudioMixerInputCommand extends WritableCommand<OmitReadonly<AudioChannel>> {
	public static MaskFlags = {
		mixOption: 1 << 0,
		gain: 1 << 1,
		balance: 1 << 2,
		rcaToXlrEnabled: 1 << 3,
	}
	public static readonly rawName = 'CAMI'

	public readonly index: number

	constructor(index: number) {
		super()

		this.index = index
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(12)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt16BE(this.index, 2)
		buffer.writeUInt8(this.properties.mixOption || 0, 4)
		buffer.writeUInt16BE(Util.DecibelToUInt16BE(this.properties.gain || 0), 6)
		buffer.writeInt16BE(Util.BalanceToInt(this.properties.balance || 0), 8)
		buffer.writeUInt8(this.properties.rcaToXlrEnabled ? 1 : 0, 10)
		return buffer
	}
}

export class AudioMixerInputUpdateCommand extends DeserializedCommand<
	Omit<AudioChannel, 'rcaToXlrEnabled' | 'supportsRcaToXlrEnabled'>
> {
	public static readonly rawName = 'AMIP'

	public readonly index: number

	constructor(index: number, properties: AudioMixerInputUpdateCommand['properties']) {
		super(properties)

		this.index = index
	}

	public static deserialize(rawCommand: Buffer): AudioMixerInputUpdateCommand {
		const index = rawCommand.readUInt16BE(0)
		const properties = {
			sourceType: rawCommand.readUInt8(2),
			portType: rawCommand.readUInt16BE(6),
			mixOption: rawCommand.readUInt8(8),
			gain: Util.UInt16BEToDecibel(rawCommand.readUInt16BE(10)),
			balance: Util.IntToBalance(rawCommand.readInt16BE(12)),
		}

		return new AudioMixerInputUpdateCommand(index, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.audio) {
			throw new InvalidIdError('Classic Audio')
		}

		state.audio.channels[this.index] = {
			...this.properties,
			rcaToXlrEnabled: false,
			supportsRcaToXlrEnabled: false,
		}
		return `audio.channels.${this.index}`
	}
}

export class AudioMixerInputUpdateV8Command extends DeserializedCommand<AudioChannel> {
	public static readonly minimumVersion = ProtocolVersion.V8_0
	public static readonly rawName = 'AMIP'

	public readonly index: number

	constructor(index: number, properties: AudioChannel) {
		super(properties)

		this.index = index
	}

	public static deserialize(rawCommand: Buffer): AudioMixerInputUpdateV8Command {
		const index = rawCommand.readUInt16BE(0)
		const properties = {
			sourceType: rawCommand.readUInt8(2),
			portType: rawCommand.readUInt16BE(6),
			mixOption: rawCommand.readUInt8(8),
			gain: Util.UInt16BEToDecibel(rawCommand.readUInt16BE(10)),
			balance: Util.IntToBalance(rawCommand.readInt16BE(12)),
			supportsRcaToXlrEnabled: rawCommand.readUInt8(14) != 0,
			rcaToXlrEnabled: rawCommand.readUInt8(15) != 0,
		}

		return new AudioMixerInputUpdateV8Command(index, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.audio) {
			throw new InvalidIdError('Classic Audio')
		}

		state.audio.channels[this.index] = this.properties
		return `audio.channels.${this.index}`
	}
}
