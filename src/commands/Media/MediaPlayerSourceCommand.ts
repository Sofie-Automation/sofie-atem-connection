import { AtemState, AtemStateUtil, InvalidIdError } from '../../state/index.js'
import { MediaPlayerSource } from '../../state/media.js'
import { WritableCommand, DeserializedCommand } from '../CommandBase.js'

export class MediaPlayerSourceCommand extends WritableCommand<MediaPlayerSource> {
	public static MaskFlags = {
		sourceType: 1 << 0,
		stillIndex: 1 << 1,
		clipIndex: 1 << 2,
	}

	public static readonly rawName = 'MPSS'

	public readonly mediaPlayerId: number

	constructor(mediaPlayerId: number) {
		super()

		this.mediaPlayerId = mediaPlayerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.mediaPlayerId, 1)
		buffer.writeUInt8(this.properties.sourceType || 0, 2)
		buffer.writeUInt8(this.properties.stillIndex || 0, 3)
		buffer.writeUInt8(this.properties.clipIndex || 0, 4)
		return buffer
	}
}

export class MediaPlayerSourceUpdateCommand extends DeserializedCommand<MediaPlayerSource> {
	public static readonly rawName = 'MPCE'

	public readonly mediaPlayerId: number

	constructor(mediaPlayerId: number, properties: MediaPlayerSource) {
		super(properties)

		this.mediaPlayerId = mediaPlayerId
	}

	public static deserialize(rawCommand: Buffer): MediaPlayerSourceUpdateCommand {
		const mediaPlayerId = rawCommand.readUInt8(0)
		const properties = {
			sourceType: rawCommand.readUInt8(1),
			stillIndex: rawCommand.readUInt8(2),
			clipIndex: rawCommand.readUInt8(3),
		}

		return new MediaPlayerSourceUpdateCommand(mediaPlayerId, properties)
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
