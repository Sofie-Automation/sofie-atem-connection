import { BasicWritableCommand, DeserializedCommand } from '../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state/index.js'

export class MultiViewerWindowVuMeterCommand extends BasicWritableCommand<{ vuEnabled: boolean }> {
	public static readonly rawName = 'VuMS'

	public readonly multiViewerId: number
	public readonly windowIndex: number

	constructor(multiviewerId: number, windowIndex: number, vuEnabled: boolean) {
		super({ vuEnabled })

		this.multiViewerId = multiviewerId
		this.windowIndex = windowIndex
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.multiViewerId, 0)
		buffer.writeUInt8(this.windowIndex || 0, 1)
		buffer.writeUInt8(this.properties.vuEnabled ? 1 : 0, 2)
		return buffer
	}
}

export class MultiViewerWindowVuMeterUpdateCommand extends DeserializedCommand<{ vuEnabled: boolean }> {
	public static readonly rawName = 'VuMC'

	public readonly multiViewerId: number
	public readonly windowIndex: number

	constructor(multiviewerId: number, windowIndex: number, vuEnabled: boolean) {
		super({ vuEnabled })

		this.multiViewerId = multiviewerId
		this.windowIndex = windowIndex
	}

	public static deserialize(rawCommand: Buffer): MultiViewerWindowVuMeterUpdateCommand {
		const multiViewerId = rawCommand.readUInt8(0)
		const windowIndex = rawCommand.readUInt8(1)
		const vuEnabled = rawCommand.readUInt8(2) > 0

		return new MultiViewerWindowVuMeterUpdateCommand(multiViewerId, windowIndex, vuEnabled)
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
		window.audioMeter = this.properties.vuEnabled

		return `settings.multiViewers.${this.multiViewerId}.windows.${this.windowIndex}.audioMeter`
	}
}
