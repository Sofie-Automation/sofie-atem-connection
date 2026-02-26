import { BasicWritableCommand, DeserializedCommand } from '../CommandBase'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state'
import { MultiViewerSourceState } from '../../state/settings'
import { isRunningInTests } from '../../lib/atemUtil'

export class MultiViewerSourceCommand extends BasicWritableCommand<
	Pick<MultiViewerSourceState, 'windowIndex' | 'source'>
> {
	public static readonly rawName = 'CMvI'

	public readonly multiViewerId: number

	constructor(multiviewerId: number, windowIndex: number, source: number) {
		super({ windowIndex, source })

		this.multiViewerId = multiviewerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.multiViewerId, 0)
		buffer.writeUInt8(this.properties.windowIndex || 0, 1)
		buffer.writeUInt16BE(this.properties.source || 0, 2)
		return buffer
	}
}

export class MultiViewerSourceUpdateCommand extends DeserializedCommand<MultiViewerSourceState> {
	public static readonly rawName = 'MvIn'

	public readonly multiViewerId: number

	constructor(multiviewerId: number, properties: MultiViewerSourceState) {
		super(properties)

		this.multiViewerId = multiviewerId
	}

	public static deserialize(rawCommand: Buffer): MultiViewerSourceUpdateCommand {
		const multiViewerId = rawCommand.readUInt8(0)
		const properties = {
			windowIndex: rawCommand.readUInt8(1),
			source: rawCommand.readUInt16BE(2),
			supportsVuMeter: rawCommand.readUInt8(4) != 0,
			supportsSafeArea: rawCommand.readUInt8(5) != 0,
		}

		return new MultiViewerSourceUpdateCommand(multiViewerId, properties)
	}

	public applyToState(state: AtemState): string | string[] {
		if (!state.info.multiviewer || this.multiViewerId >= state.info.multiviewer.count) {
			throw new InvalidIdError('MultiViewer', this.multiViewerId)
		}

		const multiviewer = AtemStateUtil.getMultiViewer(state, this.multiViewerId)
		const currentWindow = multiviewer.windows[this.properties.windowIndex]

		// The Constellation HD range had a bug where it sends this command for every window on every frame
		// This hides that from library consumers by doing a deep diff, when we usually do not.
		if (currentWindow && !isRunningInTests()) {
			let isChanged = false
			for (const stringKey of Object.keys(this.properties)) {
				const typedKey = stringKey as keyof MultiViewerSourceState
				if (this.properties[typedKey] !== currentWindow[typedKey]) {
					isChanged = true
					break
				}
			}
			if (!isChanged) return []
		}

		multiviewer.windows[this.properties.windowIndex] = {
			...currentWindow,
			...this.properties,
		}

		return `settings.multiViewers.${this.multiViewerId}.windows.${this.properties.windowIndex}`
	}
}
