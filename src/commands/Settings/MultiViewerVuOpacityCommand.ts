import { SymmetricalCommand } from '../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state/index.js'

export interface MultiViewerVuOpacityState {
	opacity: number
}

export class MultiViewerVuOpacityCommand extends SymmetricalCommand<MultiViewerVuOpacityState> {
	public static readonly rawName = 'VuMo'

	public readonly multiViewerId: number

	constructor(multiviewerId: number, opacity: number) {
		super({ opacity })

		this.multiViewerId = multiviewerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.multiViewerId, 0)
		buffer.writeUInt8(this.properties.opacity, 1)
		return buffer
	}

	public static deserialize(rawCommand: Buffer): MultiViewerVuOpacityCommand {
		const multiViewerId = rawCommand.readUInt8(0)
		const opacity = rawCommand.readUInt8(1)

		return new MultiViewerVuOpacityCommand(multiViewerId, opacity)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.multiviewer || this.multiViewerId >= state.info.multiviewer.count) {
			throw new InvalidIdError('MultiViewer', this.multiViewerId)
		}

		const multiviewer = AtemStateUtil.getMultiViewer(state, this.multiViewerId)
		multiviewer.vuOpacity = this.properties.opacity

		return `settings.multiViewers.${this.multiViewerId}.vuOpacity`
	}
}
