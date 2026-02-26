import { SymmetricalCommand } from '../CommandBase'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state'
import { SafeTitlePattern } from '../../enums'
import { combineComponents, getComponents } from '../../lib/atemUtil'

export class MultiViewerWindowOverlaySafeAreaPatternCommand extends SymmetricalCommand<{
	safeTitlePattern: SafeTitlePattern[]
}> {
	public static readonly rawName = 'StMw'

	public readonly multiViewerId: number
	public readonly windowIndex: number

	constructor(multiviewerId: number, windowIndex: number, safeTitlePattern: SafeTitlePattern[]) {
		super({ safeTitlePattern })

		this.multiViewerId = multiviewerId
		this.windowIndex = windowIndex
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.multiViewerId, 0)
		buffer.writeUInt8(this.windowIndex, 1)
		buffer.writeUInt8(combineComponents(this.properties.safeTitlePattern), 2)
		return buffer
	}

	public static deserialize(rawCommand: Buffer): MultiViewerWindowOverlaySafeAreaPatternCommand {
		const multiViewerId = rawCommand.readUInt8(0)
		const windowIndex = rawCommand.readUInt8(1)
		const safeTitlePattern = getComponents(rawCommand.readUInt8(2)) as SafeTitlePattern[]

		return new MultiViewerWindowOverlaySafeAreaPatternCommand(multiViewerId, windowIndex, safeTitlePattern)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.multiviewer || this.multiViewerId >= state.info.multiviewer.count) {
			throw new InvalidIdError('MultiViewer', this.multiViewerId)
		}

		const multiviewer = AtemStateUtil.getMultiViewer(state, this.multiViewerId)
		const window = multiviewer.windows[this.windowIndex]
		if (!window) {
			throw new InvalidIdError('MultiViewer Window', this.multiViewerId, this.windowIndex)
		}
		window.safeTitlePattern = this.properties.safeTitlePattern

		return `settings.multiViewers.${this.multiViewerId}.windows.${this.windowIndex}.safeTitlePattern`
	}
}
