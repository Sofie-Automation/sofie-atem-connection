import { AtemState, AtemStateUtil, InvalidIdError } from '../../state/index.js'
import { MediaPlayer } from '../../state/media.js'
import { WritableCommand, DeserializedCommand } from '../CommandBase.js'

export class MediaPlayerStatusCommand extends WritableCommand<MediaPlayer> {
	public static MaskFlags = {
		playing: 1 << 0,
		loop: 1 << 1,
		atBeginning: 1 << 2,
		clipFrame: 1 << 3,
	}
	public static readonly rawName = 'SCPS'

	public readonly mediaPlayerId: number

	constructor(mediaPlayerId: number) {
		super()

		this.mediaPlayerId = mediaPlayerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.mediaPlayerId, 1)
		buffer.writeUInt8(this.properties.playing ? 1 : 0, 2)
		buffer.writeUInt8(this.properties.loop ? 1 : 0, 3)
		buffer.writeUInt8(this.properties.atBeginning ? 1 : 0, 4)
		buffer.writeUInt16BE(this.properties.clipFrame || 0, 6)
		return buffer
	}
}

export class MediaPlayerStatusUpdateCommand extends DeserializedCommand<MediaPlayer> {
	public static readonly rawName = 'RCPS'

	public readonly mediaPlayerId: number

	constructor(mediaPlayerId: number, properties: MediaPlayer) {
		super(properties)

		this.mediaPlayerId = mediaPlayerId
	}

	public static deserialize(rawCommand: Buffer): MediaPlayerStatusUpdateCommand {
		const mediaPlayerId = rawCommand.readUInt8(0)
		const properties = {
			playing: rawCommand.readUInt8(1) === 1,
			loop: rawCommand.readUInt8(2) === 1,
			atBeginning: rawCommand.readUInt8(3) === 1,
			clipFrame: (rawCommand.readUInt8(4) << 8) | rawCommand.readUInt8(5),
		}

		return new MediaPlayerStatusUpdateCommand(mediaPlayerId, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.mediaPlayerId >= state.info.capabilities.mediaPlayers) {
			throw new InvalidIdError('MediaPlayer', this.mediaPlayerId)
		}

		state.media.players[this.mediaPlayerId] = {
			...AtemStateUtil.getMediaPlayer(state, this.mediaPlayerId),
			...this.properties,
		}
		return `media.players.${this.mediaPlayerId}`
	}
}
