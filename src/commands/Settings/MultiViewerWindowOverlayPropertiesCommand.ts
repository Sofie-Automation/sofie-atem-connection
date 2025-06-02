import { DeserializedCommand, WritableCommand } from '../CommandBase'
import { MultiViewerWindowOverlayPropertiesState } from '../../state/settings'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state'

export class MultiViewerWindowOverlayPropertiesCommand extends WritableCommand<MultiViewerWindowOverlayPropertiesState> {
	public static MaskFlags = {
		labelVisible: 1 << 0,
		borderVisible: 1 << 1,
	}

	public static readonly rawName = 'CMvO'

	public readonly multiViewerId: number
	public readonly windowIndex: number

	constructor(multiviewerId: number, windowIndex: number) {
		super()

		this.multiViewerId = multiviewerId
		this.windowIndex = windowIndex
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt8(this.multiViewerId, 0)
		buffer.writeUInt8(this.windowIndex || 0, 1)

		let value = 0
		if (this.properties.labelVisible) value |= 0x01
		if (this.properties.borderVisible) value |= 0x02

		buffer.writeUInt8(value, 3)
		buffer.writeUInt8(this.flag, 5)
		return buffer
	}
}

export class MultiViewerWindowOverlayPropertiesUpdateCommand extends DeserializedCommand<MultiViewerWindowOverlayPropertiesState> {
	public static readonly rawName = 'MvOv'

	public readonly multiViewerId: number
	public readonly windowIndex: number

	constructor(multiviewerId: number, windowIndex: number, props: MultiViewerWindowOverlayPropertiesState) {
		super(props)

		this.multiViewerId = multiviewerId
		this.windowIndex = windowIndex
	}

	public static deserialize(rawCommand: Buffer): MultiViewerWindowOverlayPropertiesUpdateCommand {
		const multiViewerId = rawCommand.readUInt8(0)
		const windowIndex = rawCommand.readUInt8(1)

		const values = rawCommand.readUInt8(3)

		const props: MultiViewerWindowOverlayPropertiesState = {
			labelVisible: (values & 0x01) > 0,
			borderVisible: (values & 0x02) > 0,
		}

		return new MultiViewerWindowOverlayPropertiesUpdateCommand(multiViewerId, windowIndex, props)
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
		window.overlayProperties = this.properties

		return `settings.multiViewers.${this.multiViewerId}.windows.${this.windowIndex}.overlayProperties`
	}
}
