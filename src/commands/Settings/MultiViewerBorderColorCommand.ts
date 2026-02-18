import { SymmetricalCommand } from '../CommandBase'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state'
import type { MultiViewerBorderColorState } from '../../state/settings'

export class MultiViewerBorderColorCommand extends SymmetricalCommand<MultiViewerBorderColorState> {
	public static readonly rawName = 'MvBC'

	public readonly multiViewerId: number

	constructor(multiviewerId: number, color: MultiViewerBorderColorState) {
		super(color)

		this.multiViewerId = multiviewerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(12)
		buffer.writeUInt8(this.multiViewerId, 0)
		buffer.writeUInt16BE(this.properties.red, 2)
		buffer.writeUInt16BE(this.properties.green, 4)
		buffer.writeUInt16BE(this.properties.blue, 6)
		buffer.writeUInt16BE(this.properties.alpha, 8)
		return buffer
	}

	public static deserialize(rawCommand: Buffer): MultiViewerBorderColorCommand {
		const multiViewerId = rawCommand.readUInt8(0)

		const color: MultiViewerBorderColorState = {
			red: rawCommand.readUInt16BE(2),
			green: rawCommand.readUInt16BE(4),
			blue: rawCommand.readUInt16BE(6),
			alpha: rawCommand.readUInt16BE(8),
		}

		return new MultiViewerBorderColorCommand(multiViewerId, color)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.multiviewer || this.multiViewerId >= state.info.multiviewer.count) {
			throw new InvalidIdError('MultiViewer', this.multiViewerId)
		}

		const multiviewer = AtemStateUtil.getMultiViewer(state, this.multiViewerId)
		multiviewer.borderColor = { ...this.properties }

		return `settings.multiViewers.${this.multiViewerId}.borderColor`
	}
}
