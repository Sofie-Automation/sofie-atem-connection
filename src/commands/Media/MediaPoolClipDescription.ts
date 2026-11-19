import { AtemState, AtemStateUtil } from '../../state/index.js'
import { ClipBank } from '../../state/media.js'
import { DeserializedCommand } from '../CommandBase.js'
import * as Util from '../../lib/atemUtil.js'

export class MediaPoolClipDescriptionCommand extends DeserializedCommand<Omit<ClipBank, 'frames'>> {
	public static readonly rawName = 'MPCS'

	public readonly clipId: number

	constructor(mediaPool: number, properties: Omit<ClipBank, 'frames'>) {
		super(properties)

		this.clipId = mediaPool
	}

	public static deserialize(rawCommand: Buffer): MediaPoolClipDescriptionCommand {
		const mediaPool = rawCommand.readUInt8(0)
		const properties = {
			isUsed: rawCommand.readUInt8(1) === 1,
			name: Util.bufToNullTerminatedString(rawCommand, 2, 64),
			frameCount: rawCommand.readUInt16BE(66),
		}

		return new MediaPoolClipDescriptionCommand(mediaPool, properties)
	}

	public applyToState(state: AtemState): string {
		// TODO - validate ids

		state.media.clipPool[this.clipId] = {
			...this.properties,
			frames: AtemStateUtil.getClip(state, this.clipId).frames, // TODO - lengthen/shorten array of frames?
		}
		return `media.clipPool.${this.clipId}`
	}
}
