import { SymmetricalCommand } from '../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state/index.js'
import { ProtocolVersion } from '../../enums/index.js'

export class MultiViewerWindowSafeAreaCommand extends SymmetricalCommand<{ safeAreaEnabled: boolean }> {
	public static readonly rawName = 'SaMw'
	public static readonly minimumVersion = ProtocolVersion.V8_0

	public readonly multiViewerId: number
	public readonly windowIndex: number

	constructor(multiviewerId: number, windowIndex: number, safeAreaEnabled: boolean) {
		super({ safeAreaEnabled })

		this.multiViewerId = multiviewerId
		this.windowIndex = windowIndex
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.multiViewerId, 0)
		buffer.writeUInt8(this.windowIndex, 1)
		buffer.writeUInt8(this.properties.safeAreaEnabled ? 1 : 0, 2)
		return buffer
	}

	public static deserialize(rawCommand: Buffer): MultiViewerWindowSafeAreaCommand {
		const multiViewerId = rawCommand.readUInt8(0)
		const windowIndex = rawCommand.readUInt8(1)
		const safeAreaEnabled = rawCommand.readUInt8(2) > 0

		return new MultiViewerWindowSafeAreaCommand(multiViewerId, windowIndex, safeAreaEnabled)
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
		window.safeTitle = this.properties.safeAreaEnabled

		return `settings.multiViewers.${this.multiViewerId}.windows.${this.windowIndex}.safeTitle`
	}
}
